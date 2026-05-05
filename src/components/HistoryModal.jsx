import { useMemo, useState } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icon'
import { StatusChip } from './StatusChip'
import { brl, formatDateBR } from '../lib/format'
import {
  getAuctionStatus,
  getDaysUntil,
  getStatusChip,
  compareForHistory,
  filterByTab,
} from '../lib/reminder'

const TABS = [
  { id: 'all',      label: 'Todos' },
  { id: 'today',    label: 'Hoje' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'closed',   label: 'Encerrados' },
]

function tabCount(items, id) {
  return filterByTab(items, id).length
}

export function HistoryModal({ open, onClose, items, onLoad, onDelete }) {
  const [tab, setTab] = useState('all')

  const sorted = useMemo(() => [...items].sort(compareForHistory), [items])
  const visible = useMemo(() => filterByTab(sorted, tab), [sorted, tab])

  return (
    <Modal open={open} onClose={onClose} title="Cálculos salvos" wide>
      {items.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          <Icon name="history" className="w-10 h-10 mx-auto mb-3 text-fg-subtle" />
          <p className="text-sm">Nenhum cálculo salvo ainda.</p>
        </div>
      ) : (
        <>
          <div
            className="flex gap-1.5 flex-wrap mb-3"
            role="tablist"
            aria-label="Filtrar cálculos por status"
          >
            {TABS.map(t => {
              const count = tabCount(items, t.id)
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    active
                      ? 'bg-accent text-white'
                      : 'bg-soft text-fg-muted hover:text-fg hover:bg-line/70'
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 tabular-nums ${active ? 'opacity-80' : 'opacity-60'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-10 text-fg-muted text-sm">
              Nenhum item nesta aba.
            </div>
          ) : (
            <ul className="divide-y divide-line -mx-5 sm:-mx-6">
              {visible.map(item => {
                const mode = item.calc?.mode
                const isScenarios = mode === 'scenarios'
                const badgeText = isScenarios
                  ? `Cenários (${item.calc?.discountPct ?? 0}%)`
                  : 'Arremate fixo'
                const badgeClass = isScenarios
                  ? 'bg-blue-500/10 text-blue-600'
                  : 'bg-fg-subtle/10 text-fg-muted'
                const status = getAuctionStatus(item.meta)
                const days = getDaysUntil(item.meta?.dataLeilao)
                const chip = getStatusChip(status, days)
                return (
                  <li key={item.id} className="px-5 sm:px-6 py-3.5 flex items-center gap-3 hover:bg-soft transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-medium text-fg truncate">
                          {item.meta?.comprador || 'Sem comprador'}
                        </span>
                        {item.meta?.lote && <span className="text-xs text-fg-muted">Lote {item.meta.lote}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeText}</span>
                        <StatusChip chip={chip} />
                      </div>
                      <div className="text-xs text-fg-muted mt-0.5 truncate">
                        {[
                          brl(item.calc.bid),
                          item.meta?.categoria && [item.meta.categoria, item.meta.subcategoria].filter(Boolean).join(' / '),
                          item.meta?.dataLeilao && formatDateBR(item.meta.dataLeilao),
                          new Date(item.savedAt).toLocaleDateString('pt-BR'),
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button
                      className="btn-ghost !py-1.5 !px-3 text-xs"
                      onClick={() => { onLoad?.(item); onClose?.() }}
                    >Carregar</button>
                    <button
                      className="p-2 rounded-full text-fg-subtle hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      onClick={() => { if (confirm('Remover este cálculo?')) onDelete?.(item.id) }}
                      aria-label="Excluir"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  )
}
