import { describe, it, expect } from 'vitest'
import {
  getDaysUntil,
  getAuctionStatus,
  getStatusChip,
  compareForHistory,
  filterByTab,
  getDueReminders,
  getPendingOutcomes,
} from './reminder.js'

const NOW = new Date(2026, 4, 5, 14, 30) // 2026-05-05 14:30 local

describe('getDaysUntil', () => {
  it('mesma data = 0 ignorando hora', () => {
    expect(getDaysUntil('2026-05-05', NOW)).toBe(0)
  })
  it('amanhã = 1', () => {
    expect(getDaysUntil('2026-05-06', NOW)).toBe(1)
  })
  it('ontem = -1', () => {
    expect(getDaysUntil('2026-05-04', NOW)).toBe(-1)
  })
  it('7 dias à frente', () => {
    expect(getDaysUntil('2026-05-12', NOW)).toBe(7)
  })
  it('virada de mês', () => {
    expect(getDaysUntil('2026-06-01', NOW)).toBe(27)
  })
  it('data inválida retorna null', () => {
    expect(getDaysUntil('', NOW)).toBeNull()
    expect(getDaysUntil(undefined, NOW)).toBeNull()
    expect(getDaysUntil('2026-13-99', NOW)).not.toBeNaN()
  })
})

describe('getAuctionStatus', () => {
  it('sem data = none', () => {
    expect(getAuctionStatus({}, NOW)).toBe('none')
    expect(getAuctionStatus(null, NOW)).toBe('none')
  })
  it('outcome won/lost prevalece sobre data', () => {
    expect(getAuctionStatus({ dataLeilao: '2026-05-10', outcome: 'won' }, NOW)).toBe('won')
    expect(getAuctionStatus({ dataLeilao: '2026-05-10', outcome: 'lost' }, NOW)).toBe('lost')
  })
  it('hoje', () => {
    expect(getAuctionStatus({ dataLeilao: '2026-05-05' }, NOW)).toBe('today')
  })
  it('futuro', () => {
    expect(getAuctionStatus({ dataLeilao: '2026-05-12' }, NOW)).toBe('upcoming')
  })
  it('passado sem outcome', () => {
    expect(getAuctionStatus({ dataLeilao: '2026-05-01' }, NOW)).toBe('past_pending')
  })
})

describe('getStatusChip', () => {
  it('hoje pulsa em âmbar', () => {
    const c = getStatusChip('today', 0)
    expect(c.label).toBe('Hoje')
    expect(c.tone).toBe('warning')
    expect(c.pulse).toBe(true)
  })
  it('amanhã usa singular', () => {
    expect(getStatusChip('upcoming', 1).label).toBe('Amanhã')
  })
  it('upcoming plural', () => {
    expect(getStatusChip('upcoming', 5).label).toBe('Em 5 dias')
  })
  it('won é success', () => {
    expect(getStatusChip('won').tone).toBe('success')
  })
  it('past_pending é neutro', () => {
    expect(getStatusChip('past_pending').label).toBe('Encerrado')
  })
  it('none retorna null', () => {
    expect(getStatusChip('none')).toBeNull()
  })
})

describe('compareForHistory', () => {
  const items = [
    { id: 'a', savedAt: '2026-01-01', meta: { dataLeilao: '2026-04-01' } },         // past_pending
    { id: 'b', savedAt: '2026-01-02', meta: { dataLeilao: '2026-05-05' } },         // today
    { id: 'c', savedAt: '2026-01-03', meta: { dataLeilao: '2026-05-12' } },         // upcoming +7
    { id: 'd', savedAt: '2026-01-04', meta: { dataLeilao: '2026-05-08' } },         // upcoming +3
    { id: 'e', savedAt: '2026-01-05', meta: { dataLeilao: '2026-04-01', outcome: 'won' } }, // won
  ]
  it('ordena: today > upcoming(asc) > past > won', () => {
    const sorted = [...items].sort((a, b) => compareForHistory(a, b, NOW))
    expect(sorted.map(i => i.id)).toEqual(['b', 'd', 'c', 'a', 'e'])
  })
})

describe('filterByTab', () => {
  const items = [
    { id: 'today', meta: { dataLeilao: '2026-05-05' } },
    { id: 'up', meta: { dataLeilao: '2026-05-10' } },
    { id: 'past', meta: { dataLeilao: '2026-05-01' } },
    { id: 'won', meta: { dataLeilao: '2026-05-01', outcome: 'won' } },
  ]
  it('all = tudo', () => {
    expect(filterByTab(items, 'all', NOW)).toHaveLength(4)
  })
  it('today só hoje', () => {
    expect(filterByTab(items, 'today', NOW).map(i => i.id)).toEqual(['today'])
  })
  it('upcoming só futuros', () => {
    expect(filterByTab(items, 'upcoming', NOW).map(i => i.id)).toEqual(['up'])
  })
  it('closed inclui past_pending, won, lost', () => {
    expect(filterByTab(items, 'closed', NOW).map(i => i.id).sort()).toEqual(['past', 'won'])
  })
})

describe('getDueReminders', () => {
  it('lembra na antecedência exata configurada', () => {
    const items = [
      { id: '7d', meta: { dataLeilao: '2026-05-12', reminder: { enabled: true, leadTimes: ['7d', '1d', '0d'] } } },
      { id: '1d', meta: { dataLeilao: '2026-05-06', reminder: { enabled: true, leadTimes: ['7d', '1d', '0d'] } } },
      { id: 'today', meta: { dataLeilao: '2026-05-05', reminder: { enabled: true, leadTimes: ['0d'] } } },
      { id: '3d', meta: { dataLeilao: '2026-05-08', reminder: { enabled: true, leadTimes: ['7d', '1d', '0d'] } } }, // não bate
    ]
    const due = getDueReminders(items, NOW)
    expect(due.map(d => d.item.id).sort()).toEqual(['1d', '7d', 'today'])
  })
  it('ignora itens sem reminder.enabled', () => {
    const items = [{ id: 'x', meta: { dataLeilao: '2026-05-12', reminder: { enabled: false, leadTimes: ['7d'] } } }]
    expect(getDueReminders(items, NOW)).toHaveLength(0)
  })
  it('ignora leilões já passados', () => {
    const items = [{ id: 'x', meta: { dataLeilao: '2026-05-01', reminder: { enabled: true, leadTimes: ['0d'] } } }]
    expect(getDueReminders(items, NOW)).toHaveLength(0)
  })
  it('urgency high para today/amanhã', () => {
    const items = [
      { id: 'a', meta: { dataLeilao: '2026-05-05', reminder: { enabled: true, leadTimes: ['0d'] } } },
      { id: 'b', meta: { dataLeilao: '2026-05-12', reminder: { enabled: true, leadTimes: ['7d'] } } },
    ]
    const due = getDueReminders(items, NOW)
    expect(due.find(d => d.item.id === 'a').urgency).toBe('high')
    expect(due.find(d => d.item.id === 'b').urgency).toBe('medium')
  })
})

describe('getPendingOutcomes', () => {
  it('inclui past_pending sem snooze', () => {
    const items = [{ id: 'a', meta: { dataLeilao: '2026-05-01' } }]
    expect(getPendingOutcomes(items, NOW)).toHaveLength(1)
  })
  it('exclui se snooze < 12h', () => {
    const recent = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString() // 1h atrás
    const items = [{ id: 'a', meta: { dataLeilao: '2026-05-01', outcomeAskedAt: recent } }]
    expect(getPendingOutcomes(items, NOW)).toHaveLength(0)
  })
  it('inclui se snooze > 12h', () => {
    const old = new Date(NOW.getTime() - 13 * 60 * 60 * 1000).toISOString()
    const items = [{ id: 'a', meta: { dataLeilao: '2026-05-01', outcomeAskedAt: old } }]
    expect(getPendingOutcomes(items, NOW)).toHaveLength(1)
  })
  it('exclui se já tem outcome', () => {
    const items = [
      { id: 'a', meta: { dataLeilao: '2026-05-01', outcome: 'won' } },
      { id: 'b', meta: { dataLeilao: '2026-05-01', outcome: 'lost' } },
    ]
    expect(getPendingOutcomes(items, NOW)).toHaveLength(0)
  })
  it('exclui upcoming/today', () => {
    const items = [
      { id: 'a', meta: { dataLeilao: '2026-05-05' } },
      { id: 'b', meta: { dataLeilao: '2026-05-10' } },
    ]
    expect(getPendingOutcomes(items, NOW)).toHaveLength(0)
  })
})
