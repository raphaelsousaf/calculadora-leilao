import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { StatusChip } from './StatusChip'
import { getStatusChip, getAuctionStatus, getDaysUntil } from '../lib/reminder'

/**
 * Sino do header. Badge mostra contagem de leilões ativos
 * (today + upcoming com reminder.enabled). Dropdown lista os próximos.
 */
export function RemindersBell({ items, onOpenItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const upcoming = (items || [])
    .filter(it => {
      const s = getAuctionStatus(it.meta)
      return (s === 'today' || s === 'upcoming') && it.meta?.reminder?.enabled
    })
    .sort((a, b) => (getDaysUntil(a.meta.dataLeilao) ?? 0) - (getDaysUntil(b.meta.dataLeilao) ?? 0))

  const badgeCount = upcoming.filter(it => {
    const d = getDaysUntil(it.meta.dataLeilao)
    return d !== null && d <= 7
  }).length

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Lembretes${badgeCount ? ` (${badgeCount} próximo${badgeCount > 1 ? 's' : ''})` : ''}`}
        onClick={() => setOpen(o => !o)}
        className="icon-btn relative"
      >
        <Icon name="bell" className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Próximos leilões"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] card overflow-hidden anim-scale z-50"
        >
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-medium text-fg">Próximos leilões</p>
            <p className="text-xs text-fg-muted mt-0.5">
              {upcoming.length === 0 ? 'Nenhum leilão sendo acompanhado.' : `${upcoming.length} ativo${upcoming.length > 1 ? 's' : ''}`}
            </p>
          </div>
          {upcoming.length > 0 && (
            <ul className="max-h-80 overflow-y-auto divide-y divide-line">
              {upcoming.slice(0, 8).map(it => {
                const s = getAuctionStatus(it.meta)
                const d = getDaysUntil(it.meta.dataLeilao)
                const chip = getStatusChip(s, d)
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => { setOpen(false); onOpenItem?.(it) }}
                      className="w-full text-left px-4 py-3 hover:bg-soft transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-fg text-sm truncate">
                          {it.meta?.comprador || 'Sem comprador'}
                        </span>
                        <StatusChip chip={chip} />
                      </div>
                      <p className="text-xs text-fg-muted mt-0.5 truncate">
                        {it.meta?.lote ? `Lote ${it.meta.lote} · ` : ''}
                        {it.meta?.dataLeilao}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
