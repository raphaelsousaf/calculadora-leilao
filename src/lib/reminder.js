/**
 * Lembretes de leilão — funções puras.
 *
 * Status derivado de `meta.dataLeilao` + `meta.outcome`:
 *   - 'won'          → usuário marcou que arrematou
 *   - 'lost'         → usuário marcou que não arrematou
 *   - 'past_pending' → data passou e ainda não respondeu "arrematou?"
 *   - 'today'        → leilão é hoje
 *   - 'upcoming'     → leilão é no futuro
 *   - 'none'         → sem data
 *
 * Datas são tratadas como YYYY-MM-DD em horário local (sem timezone),
 * coerentes com o resto do app (ver schedule.js).
 */

export const LEAD_TIMES = ['7d', '1d', '0d']

const LEAD_DAYS = { '7d': 7, '1d': 1, '0d': 0 }

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoToLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** Diferença em dias calendário entre `dateISO` e `now` (positivo = futuro). */
export function getDaysUntil(dateISO, now = new Date()) {
  const target = isoToLocalDate(dateISO)
  if (!target) return null
  const a = startOfDay(target).getTime()
  const b = startOfDay(now).getTime()
  return Math.round((a - b) / 86400000)
}

export function getAuctionStatus(meta, now = new Date()) {
  if (!meta) return 'none'
  if (meta.outcome === 'won') return 'won'
  if (meta.outcome === 'lost') return 'lost'
  const days = getDaysUntil(meta.dataLeilao, now)
  if (days === null) return 'none'
  if (days > 0) return 'upcoming'
  if (days === 0) return 'today'
  return 'past_pending'
}

/**
 * Chip visual para o status. `tone` mapeia para cores padronizadas
 * no StatusChip; o consumidor não precisa conhecer Tailwind.
 */
export function getStatusChip(status, days) {
  switch (status) {
    case 'today':
      return { label: 'Hoje', tone: 'warning', icon: 'clock', pulse: true }
    case 'upcoming': {
      const d = days ?? 0
      if (d === 1) return { label: 'Amanhã', tone: 'info', icon: 'clock' }
      return { label: `Em ${d} dias`, tone: 'info', icon: 'clock' }
    }
    case 'past_pending':
      return { label: 'Encerrado', tone: 'neutral', icon: 'flag' }
    case 'won':
      return { label: 'Arrematado', tone: 'success', icon: 'check' }
    case 'lost':
      return { label: 'Não arrematado', tone: 'muted', icon: 'x' }
    default:
      return null
  }
}

/** Ordem de prioridade para listagem do histórico. */
export function compareForHistory(a, b, now = new Date()) {
  const sa = getAuctionStatus(a.meta, now)
  const sb = getAuctionStatus(b.meta, now)
  const rank = { today: 0, upcoming: 1, past_pending: 2, won: 3, lost: 3, none: 4 }
  if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb]
  // Dentro do mesmo grupo:
  if (sa === 'upcoming') {
    return (getDaysUntil(a.meta?.dataLeilao, now) ?? 0) - (getDaysUntil(b.meta?.dataLeilao, now) ?? 0)
  }
  // Demais: mais recentes primeiro pelo savedAt
  return new Date(b.savedAt || 0) - new Date(a.savedAt || 0)
}

/**
 * Filtra itens conforme aba selecionada.
 *   'all' | 'upcoming' | 'today' | 'closed'
 */
export function filterByTab(items, tab, now = new Date()) {
  if (!tab || tab === 'all') return items
  return items.filter(it => {
    const s = getAuctionStatus(it.meta, now)
    if (tab === 'today') return s === 'today'
    if (tab === 'upcoming') return s === 'upcoming'
    if (tab === 'closed') return s === 'past_pending' || s === 'won' || s === 'lost'
    return true
  })
}

/**
 * Lembretes "vencidos" hoje — usados para alimentar o sino e o banner.
 * Um item gera lembrete quando: reminder.enabled=true, há leilão futuro/hoje,
 * e a antecedência atual (em dias) corresponde a um dos leadTimes escolhidos.
 *
 * Retorna [{ item, leadTime, days, urgency }].
 *   urgency: 'high' (today/1d) | 'medium' (>1d)
 */
export function getDueReminders(items, now = new Date()) {
  const out = []
  for (const item of items || []) {
    const r = item.meta?.reminder
    if (!r?.enabled) continue
    const status = getAuctionStatus(item.meta, now)
    if (status !== 'upcoming' && status !== 'today') continue
    const days = getDaysUntil(item.meta.dataLeilao, now)
    const leadTimes = Array.isArray(r.leadTimes) && r.leadTimes.length ? r.leadTimes : LEAD_TIMES
    for (const lt of leadTimes) {
      if (LEAD_DAYS[lt] === days) {
        out.push({
          item,
          leadTime: lt,
          days,
          urgency: days <= 1 ? 'high' : 'medium',
        })
        break
      }
    }
  }
  return out
}

/**
 * Itens que aguardam resposta "Você arrematou?" — encerrados sem outcome
 * e sem snooze recente (< 12h).
 */
export function getPendingOutcomes(items, now = new Date()) {
  const SNOOZE_MS = 12 * 60 * 60 * 1000
  return (items || []).filter(it => {
    if (getAuctionStatus(it.meta, now) !== 'past_pending') return false
    const asked = it.meta?.outcomeAskedAt
    if (!asked) return true
    return now - new Date(asked) > SNOOZE_MS
  })
}
