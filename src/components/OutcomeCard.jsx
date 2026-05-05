import { useState } from 'react'
import { Icon } from './Icon'
import { brl, formatDateBR } from '../lib/format'
import { formatBRLInput, parseBRL } from '../lib/format'

/**
 * Card "Você arrematou?" para um leilão encerrado sem outcome.
 * Sim abre input rápido de valor final; Não marca como lost;
 * Lembrar depois aplica snooze de 12h via outcomeAskedAt.
 */
export function OutcomeCard({ item, onAnswer }) {
  const [phase, setPhase] = useState('ask') // 'ask' | 'won-amount'
  const [finalBidStr, setFinalBidStr] = useState('')

  const submitWon = () => {
    const v = parseBRL(finalBidStr) || item.calc?.bid || 0
    onAnswer?.({ outcome: 'won', finalBid: v })
  }

  return (
    <div className="card border-emerald-500/30 bg-emerald-500/[0.04] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
          <Icon name="flag" className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-fg">
            <span className="font-medium">
              {item.meta?.comprador || 'Leilão'}
              {item.meta?.lote ? ` · Lote ${item.meta.lote}` : ''}
            </span>
            <span className="text-fg-muted"> · {formatDateBR(item.meta?.dataLeilao)}</span>
          </p>

          {phase === 'ask' && (
            <>
              <p className="text-sm text-fg-muted mt-1">Você arrematou esse lote?</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  className="btn-primary !py-1.5 !px-4 text-xs"
                  onClick={() => setPhase('won-amount')}
                >
                  <Icon name="check" className="w-3.5 h-3.5" /> Sim, arrematei
                </button>
                <button
                  className="btn-ghost !py-1.5 !px-4 text-xs"
                  onClick={() => onAnswer?.({ outcome: 'lost' })}
                >
                  Não arrematei
                </button>
                <button
                  className="text-xs text-fg-muted hover:text-fg px-2"
                  onClick={() => onAnswer?.({ snooze: true })}
                >
                  Lembrar depois
                </button>
              </div>
            </>
          )}

          {phase === 'won-amount' && (
            <div className="mt-3">
              <label className="label">Valor final do arremate</label>
              <div className="flex gap-2 mt-1">
                <input
                  className="input flex-1"
                  inputMode="numeric"
                  placeholder={brl(item.calc?.bid || 0)}
                  value={finalBidStr}
                  onChange={e => setFinalBidStr(formatBRLInput(e.target.value))}
                  autoFocus
                />
                <button className="btn-primary" onClick={submitWon}>
                  <Icon name="check" className="w-4 h-4" /> Confirmar
                </button>
              </div>
              <p className="text-[11px] text-fg-muted mt-1">
                Em branco usa o valor calculado: {brl(item.calc?.bid || 0)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
