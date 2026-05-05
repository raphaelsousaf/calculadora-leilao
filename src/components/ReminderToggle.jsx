import { Icon } from './Icon'
import { LEAD_TIMES, getDaysUntil } from '../lib/reminder'

const LEAD_LABEL = { '7d': '7 dias antes', '1d': '1 dia antes', '0d': 'No dia' }
const LEAD_DAYS  = { '7d': 7, '1d': 1, '0d': 0 }

/**
 * Toggle "Acompanhar este leilão" + escolha de antecedências.
 *
 * Props:
 *   value    = { enabled, leadTimes }
 *   onChange = (next) => void
 *   dataLeilao = ISO YYYY-MM-DD (usada pra desabilitar leadTimes inviáveis)
 */
export function ReminderToggle({ value, onChange, dataLeilao }) {
  const enabled = !!value?.enabled
  const leadTimes = value?.leadTimes ?? LEAD_TIMES
  const days = getDaysUntil(dataLeilao)

  const setEnabled = (v) => onChange({ ...value, enabled: v, leadTimes })
  const toggleLead = (lt) => {
    const has = leadTimes.includes(lt)
    const next = has ? leadTimes.filter(x => x !== lt) : [...leadTimes, lt].sort((a, b) => LEAD_DAYS[b] - LEAD_DAYS[a])
    onChange({ ...value, enabled, leadTimes: next })
  }

  if (days === null) return null
  if (days < 0) return null

  return (
    <div className="rounded-xl border border-line bg-soft p-4 mt-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <span
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors mt-0.5 ${
            enabled ? 'bg-accent' : 'bg-fg-subtle/40'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : ''
            }`}
          />
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
        />
        <span className="flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
            <Icon name="bell" className="w-4 h-4" /> Acompanhar este leilão
          </span>
          <span className="block text-xs text-fg-muted mt-0.5">
            Receba lembretes no app conforme a data se aproxima.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="mt-3 pl-14">
          <p className="label mb-2">Lembrar:</p>
          <div className="flex flex-wrap gap-2">
            {LEAD_TIMES.map(lt => {
              const checked = leadTimes.includes(lt)
              const disabled = days < LEAD_DAYS[lt]
              return (
                <label
                  key={lt}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer select-none ${
                    disabled
                      ? 'border-line bg-soft text-fg-subtle cursor-not-allowed'
                      : checked
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-line bg-surface text-fg-muted hover:text-fg'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked && !disabled}
                    disabled={disabled}
                    onChange={() => !disabled && toggleLead(lt)}
                  />
                  {LEAD_LABEL[lt]}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
