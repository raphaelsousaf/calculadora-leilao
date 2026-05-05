import { useMemo } from 'react'
import { Icon } from './Icon'
import { getDueReminders } from '../lib/reminder'

/**
 * Banner de alta prioridade exibido no topo da página quando há leilões
 * hoje ou nos lead times configurados. Usa aria-live="polite" para
 * leitores de tela e some sozinho ao mudar `items`.
 */
export function RemindersBanner({ items, onOpenItem, onDismiss }) {
  const due = useMemo(() => getDueReminders(items), [items])
  if (!due.length) return null

  // Prioriza urgency=high (today / 1d). Se houver, mostra apenas o primeiro alto.
  const high = due.find(d => d.urgency === 'high') || due[0]
  const it = high.item
  const days = high.days
  const label =
    days === 0 ? 'é HOJE' :
    days === 1 ? 'é amanhã' :
    `em ${days} dias`

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-7xl px-4 sm:px-6 mt-4"
    >
      <div className="card border-amber-500/40 bg-amber-500/5 flex items-center gap-3 px-4 py-3">
        <span className="shrink-0 w-9 h-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Icon name="bell" className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-fg">
            <span className="font-medium">
              {it.meta?.comprador || 'Leilão'}
              {it.meta?.lote ? ` · Lote ${it.meta.lote}` : ''}
            </span>{' '}
            <span className="text-fg-muted">{label}</span>
            {due.length > 1 && (
              <span className="text-fg-muted"> · +{due.length - 1} outro{due.length > 2 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => onOpenItem?.(it)}
          className="text-xs font-medium text-accent hover:underline"
        >
          Ver
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dispensar"
          className="p-1 rounded-full text-fg-subtle hover:text-fg hover:bg-line/60"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
