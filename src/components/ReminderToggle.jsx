import { useState } from 'react'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { LEAD_TIMES, getDaysUntil } from '../lib/reminder'
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getPermissionState,
  requestPermission,
} from '../lib/push'

const LEAD_LABEL = { '7d': '7 dias antes', '1d': '1 dia antes', '0d': 'No dia' }
const LEAD_DAYS  = { '7d': 7, '1d': 1, '0d': 0 }

function IOSTutorialModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Instale o app no iPhone">
      <div className="space-y-4 text-sm text-fg-muted">
        <p>Para receber notificações no iPhone, instale o app na tela de início:</p>
        <ol className="space-y-3 pl-1">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">1</span>
            <span>Toque no botão <strong className="text-fg">Compartilhar</strong> (ícone de quadrado com seta pra cima)</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">2</span>
            <span>Role e toque em <strong className="text-fg">Adicionar à Tela de Início</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">3</span>
            <span>Toque <strong className="text-fg">Adicionar</strong> — abra o app pela tela de início</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">4</span>
            <span>Volte aqui e ative as notificações</span>
          </li>
        </ol>
      </div>
    </Modal>
  )
}

/**
 * Toggle "Acompanhar este leilão" + escolha de antecedências + push opt-in.
 *
 * Props:
 *   value      = { enabled, leadTimes, pushEnabled }
 *   onChange   = (next) => void
 *   dataLeilao = ISO YYYY-MM-DD
 */
export function ReminderToggle({ value, onChange, dataLeilao }) {
  const enabled = !!value?.enabled
  const pushEnabled = !!value?.pushEnabled
  const leadTimes = value?.leadTimes ?? LEAD_TIMES
  const days = getDaysUntil(dataLeilao)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)
  const [permState, setPermState] = useState(getPermissionState)

  const setEnabled = (v) => onChange({ ...value, enabled: v, leadTimes })
  const toggleLead = (lt) => {
    const has = leadTimes.includes(lt)
    const next = has ? leadTimes.filter(x => x !== lt) : [...leadTimes, lt].sort((a, b) => LEAD_DAYS[b] - LEAD_DAYS[a])
    onChange({ ...value, enabled, leadTimes: next })
  }

  const handlePushToggle = async () => {
    if (pushEnabled) {
      onChange({ ...value, pushEnabled: false })
      return
    }

    // iOS não-standalone → tutorial
    if (isIOS() && !isStandalone()) {
      setShowIOSTutorial(true)
      return
    }

    if (!isPushSupported()) return

    const result = await requestPermission()
    setPermState(result === 'granted' ? 'granted' : result)
    if (result === 'granted') {
      onChange({ ...value, pushEnabled: true })
    }
  }

  if (days === null) return null
  if (days < 0) return null

  const showPushButton = enabled && isPushSupported()
  const pushGranted = permState === 'granted'
  const pushDenied = permState === 'denied'

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

          {showPushButton && (
            <div className="mt-3">
              {pushDenied ? (
                <p className="text-xs text-fg-muted">
                  <Icon name="bell-off" className="w-3.5 h-3.5 inline mr-1" />
                  Notificações bloqueadas pelo navegador.{' '}
                  <span className="text-fg-subtle">Vá nas configurações do navegador para reativar.</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handlePushToggle}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    pushEnabled && pushGranted
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                  }`}
                >
                  <Icon name={pushEnabled && pushGranted ? 'check' : 'bell'} className="w-3.5 h-3.5 inline mr-1" />
                  {pushEnabled && pushGranted
                    ? 'Notificações ativadas'
                    : 'Ativar notificações no celular'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <IOSTutorialModal open={showIOSTutorial} onClose={() => setShowIOSTutorial(false)} />
    </div>
  )
}
