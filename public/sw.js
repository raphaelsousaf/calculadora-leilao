/**
 * Service Worker para PWA — registro de notificações e cache mínimo.
 * Não faz caching agressivo pra manter dados sempre frescos.
 */

const VERSION = 'v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

/**
 * Clique em notificação → foca/abre app, opcionalmente com itemId no hash.
 * Notificação pode vir com data no tag: "reminder-{itemId}"
 */
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const tag = e.notification.tag || ''
  const itemId = tag.replace('reminder-', '')
  const url = itemId ? `/#item=${itemId}` : '/'

  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Procura client existente
      for (const client of clients) {
        if (client.url.includes(self.registration.scope)) {
          client.focus()
          client.postMessage({ type: 'REMINDER_OPENED', itemId })
          return client.navigate(url)
        }
      }
      // Não encontrou, abre novo
      return self.clients.openWindow(url)
    })
  )
})

/**
 * Notificação dismissida (botão X) — analytics opcional aqui.
 */
self.addEventListener('notificationclose', (e) => {
  // Pode logar que o usuário dismissiu a notificação
})

/**
 * Suporta showNotification com TimestampTrigger (Chromium).
 * Fallback: app agenda via setTimeout em memória.
 */
self.addEventListener('push', (e) => {
  if (!e.data) return
  try {
    const data = e.data.json()
    const options = {
      body: data.body || 'Lembrete de leilão',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'reminder',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    }
    e.waitUntil(self.registration.showNotification(data.title || 'Calculadora', options))
  } catch (err) {
    console.error('Push parse error:', err)
  }
})

/**
 * Clique em ação da notificação.
 */
self.addEventListener('notificationaction', (e) => {
  e.notification.close()
  if (e.action === 'open') {
    e.waitUntil(self.clients.openWindow('/'))
  }
})
