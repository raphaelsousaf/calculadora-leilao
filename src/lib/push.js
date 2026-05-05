/**
 * Web Push & Notification API — detect, request, schedule, cancel.
 *
 * Estratégia:
 *   1. Notification API disponível → agenda via SW showNotification
 *   2. iOS standalone → funciona, mas precisa instalar PWA primeiro
 *   3. iOS Safari (não standalone) → sem suporte; mostra tutorial
 *   4. Fallback → setTimeout em memória + IndexedDB p/ reagendar ao reabrir
 *
 * Todas as funções são seguras pra chamar em qualquer plataforma —
 * retornam graciosamente quando não suportadas.
 */

const IDB_NAME = 'cl_reminders'
const IDB_STORE = 'scheduled'
const IDB_VERSION = 1

// ─── Platform detection ──────────────────────────────────────

export function isPushSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// ─── Permission request ──────────────────────────────────────

const ASKED_KEY = 'cl_push_asked_session'

export async function requestPermission() {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  // Só pede uma vez por sessão
  if (sessionStorage.getItem(ASKED_KEY)) return 'already-asked'
  sessionStorage.setItem(ASKED_KEY, '1')

  const result = await Notification.requestPermission()
  return result
}

// ─── IndexedDB para persistir agendamentos ───────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(entry) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(entry)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDelete(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbGetAll() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

// ─── Schedule / Cancel ───────────────────────────────────────

const activeTimers = new Map()

function makeKey(itemId, leadTime) {
  return `${itemId}__${leadTime}`
}

function isoToLocalDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Agenda uma notificação local para um item + leadTime.
 * Se o timestamp já passou, ignora. Persiste no IndexedDB para
 * reagendamento se o app for fechado e reaberto.
 */
export async function scheduleLocal(item, leadTime) {
  if (!item?.meta?.dataLeilao) return
  const LEAD_DAYS = { '7d': 7, '1d': 1, '0d': 0 }
  const leadDays = LEAD_DAYS[leadTime]
  if (leadDays == null) return

  const auctionDate = isoToLocalDate(item.meta.dataLeilao)
  if (!auctionDate) return

  const fireDate = new Date(auctionDate)
  fireDate.setDate(fireDate.getDate() - leadDays)
  fireDate.setHours(8, 0, 0, 0) // Notifica às 8h da manhã

  const now = Date.now()
  const fireMs = fireDate.getTime()
  if (fireMs <= now) return // Já passou

  const key = makeKey(item.id, leadTime)
  const label = item.meta?.comprador || 'Leilão'
  const lote = item.meta?.lote ? ` · Lote ${item.meta.lote}` : ''
  const dayLabel =
    leadDays === 0 ? 'é HOJE' :
    leadDays === 1 ? 'é amanhã' :
    `em ${leadDays} dias`

  const entry = {
    key,
    itemId: item.id,
    leadTime,
    fireAt: fireMs,
    title: `${label}${lote}`,
    body: `O leilão ${dayLabel}!`,
  }

  // Persiste no IDB
  await idbPut(entry).catch(() => {})

  // Cancela timer anterior se existir
  if (activeTimers.has(key)) clearTimeout(activeTimers.get(key))

  const delay = fireMs - now
  // setTimeout máximo é ~24.8 dias (2^31 ms); além disso, reagenda no reopen
  if (delay > 2_000_000_000) return

  const timerId = setTimeout(() => {
    fireNotification(entry)
    idbDelete(key).catch(() => {})
    activeTimers.delete(key)
  }, delay)

  activeTimers.set(key, timerId)
}

async function fireNotification(entry) {
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(entry.title, {
      body: entry.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `reminder-${entry.itemId}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
  } catch {
    // Fallback: Notification API direta
    try {
      new Notification(entry.title, { body: entry.body, icon: '/icon-192.png' })
    } catch { /* silencioso */ }
  }
}

/**
 * Cancela todos os timers de um item (todos os leadTimes).
 */
export async function cancelLocal(itemId) {
  const LEADS = ['7d', '1d', '0d']
  for (const lt of LEADS) {
    const key = makeKey(itemId, lt)
    if (activeTimers.has(key)) {
      clearTimeout(activeTimers.get(key))
      activeTimers.delete(key)
    }
    await idbDelete(key).catch(() => {})
  }
}

/**
 * Reagenda todas as notificações persistidas no IndexedDB.
 * Chamar ao abrir/reabrir o app.
 */
export async function rescheduleAll() {
  if (!isPushSupported() || Notification.permission !== 'granted') return

  let entries = []
  try {
    entries = await idbGetAll()
  } catch {
    return
  }

  const now = Date.now()
  for (const entry of entries) {
    if (entry.fireAt <= now) {
      // Já passou — dispara agora se foi recente (< 1h)
      if (now - entry.fireAt < 3_600_000) {
        await fireNotification(entry)
      }
      await idbDelete(entry.key).catch(() => {})
      continue
    }

    const delay = entry.fireAt - now
    if (delay > 2_000_000_000) continue

    const key = entry.key
    if (activeTimers.has(key)) clearTimeout(activeTimers.get(key))

    const timerId = setTimeout(() => {
      fireNotification(entry)
      idbDelete(key).catch(() => {})
      activeTimers.delete(key)
    }, delay)

    activeTimers.set(key, timerId)
  }
}

/**
 * Agenda todas as notificações para um item baseado em reminder.leadTimes.
 */
export async function scheduleAllForItem(item) {
  if (!isPushSupported() || Notification.permission !== 'granted') return
  const r = item?.meta?.reminder
  if (!r?.enabled || !r?.pushEnabled) return
  const leadTimes = Array.isArray(r.leadTimes) && r.leadTimes.length ? r.leadTimes : ['7d', '1d', '0d']
  for (const lt of leadTimes) {
    await scheduleLocal(item, lt)
  }
}
