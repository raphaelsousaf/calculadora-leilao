import { Modal } from './Modal'
import { Icon } from './Icon'
import { brl, formatDateBR } from '../lib/format'

export function HistoryModal({ open, onClose, items, onLoad, onDelete }) {
  return (
    <Modal open={open} onClose={onClose} title="Cálculos salvos" wide>
      {items.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          <Icon name="history" className="w-10 h-10 mx-auto mb-3 text-fg-subtle" />
          <p className="text-sm">Nenhum cálculo salvo ainda.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line -mx-5 sm:-mx-6">
          {items.map(item => {
            const mode = item.calc?.mode
            const isScenarios = mode === 'scenarios'
            const badgeText = isScenarios
              ? `Cenários (${item.calc?.discountPct ?? 0}%)`
              : 'Arremate fixo'
            const badgeClass = isScenarios
              ? 'bg-blue-500/10 text-blue-600'
              : 'bg-fg-subtle/10 text-fg-muted'
            return (
            <li key={item.id} className="px-5 sm:px-6 py-3.5 flex items-center gap-3 hover:bg-soft transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-fg truncate">
                    {item.meta?.comprador || 'Sem comprador'}
                  </span>
                  {item.meta?.lote && <span className="text-xs text-fg-muted">Lote {item.meta.lote}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeText}</span>
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
    </Modal>
  )
}
