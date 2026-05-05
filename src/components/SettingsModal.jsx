import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icon'
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getPermissionState,
  requestPermission,
} from '../lib/push'

const DEFAULT_T1 = 70
const DEFAULT_T2 = 85
const DEFAULT_T3 = 95

export function SettingsModal({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings || {})
  const [defaultSuretyPctStr, setDefaultSuretyPctStr] = useState('')
  const [t1Str, setT1Str] = useState('')
  const [t2Str, setT2Str] = useState('')
  const [t3Str, setT3Str] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(settings || {})
      const fmt = (v) => (v === null || v === undefined ? '' : String(v))
      setDefaultSuretyPctStr(fmt(settings?.defaultSuretyPct))
      setT1Str(fmt(settings?.viabilityT1))
      setT2Str(fmt(settings?.viabilityT2))
      setT3Str(fmt(settings?.viabilityT3))
      setErrors({})
    }
  }, [open, settings])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const parsePct = (s, { min = 0, max = 100 } = {}) => {
    const trimmed = s.trim()
    if (trimmed === '') return { ok: true, value: null }
    const n = Number(trimmed)
    if (Number.isNaN(n) || n < min || n > max) return { ok: false }
    return { ok: true, value: n }
  }

  const handleSave = () => {
    const next = {}
    const errs = {}

    const surety = parsePct(defaultSuretyPctStr)
    if (!surety.ok) errs.surety = 'Informe um valor entre 0 e 100.'
    else next.defaultSuretyPct = surety.value

    const p1 = parsePct(t1Str)
    const p2 = parsePct(t2Str)
    const p3 = parsePct(t3Str)
    if (!p1.ok) errs.t1 = '0–100'
    if (!p2.ok) errs.t2 = '0–100'
    if (!p3.ok) errs.t3 = '0–100'

    // Se algum threshold preenchido, todos precisam estar preenchidos e crescentes
    const provided = [p1.value, p2.value, p3.value].filter(v => v !== null).length
    if (provided > 0 && provided < 3) {
      errs.thresholds = 'Preencha os 3 limites ou deixe os 3 vazios para usar os padrões.'
    } else if (provided === 3) {
      if (!(p1.value < p2.value && p2.value < p3.value)) {
        errs.thresholds = 'Os limites devem ser crescentes (T1 < T2 < T3).'
      }
    }

    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    next.viabilityT1 = p1.value
    next.viabilityT2 = p2.value
    next.viabilityT3 = p3.value

    setErrors({})
    onSave?.({ ...form, ...next })
    onClose?.()
  }

  return (
    <Modal
      open={open} onClose={onClose} title="Configurações do leiloeiro"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Salvar</button>
        </>
      }
    >
      <p className="text-sm text-fg-muted mb-4">Esses dados aparecem no cabeçalho do PDF e da mensagem do WhatsApp.</p>
      <div className="space-y-4">
        <Field label="Nome / Escritório">
          <input className="input" value={form.nome || ''} onChange={e => update('nome', e.target.value)} placeholder="Ex: João Silva Leiloeiro Oficial" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <input className="input" value={form.telefone || ''} onChange={e => update('telefone', e.target.value)} placeholder="(31) 9 0000-0000" />
          </Field>
          <Field label="E-mail">
            <input type="email" className="input" value={form.email || ''} onChange={e => update('email', e.target.value)} placeholder="contato@exemplo.com" />
          </Field>
        </div>
        <Field label="CNPJ ou CPF">
          <input className="input" value={form.documento || ''} onChange={e => update('documento', e.target.value)} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="Carta de fiança padrão (%)" sublabel="% sobre o saldo a parcelar. Use 0 se o edital não exigir.">
          <input
            type="number" step="0.1" min="0" max="100"
            className="input"
            value={defaultSuretyPctStr}
            onChange={e => setDefaultSuretyPctStr(e.target.value)}
            placeholder="1"
          />
          {errors.surety && <span className="text-sm text-red-500 mt-1 block">{errors.surety}</span>}
        </Field>

        <div className="border-t border-line pt-4">
          <p className="text-sm font-medium text-fg mb-1">Faixas de viabilidade</p>
          <p className="text-xs text-fg-muted mb-3">Limites de % do arremate sobre avaliação que classificam cada cenário. Deixe vazio para usar os padrões ({DEFAULT_T1}/{DEFAULT_T2}/{DEFAULT_T3}).</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Excelente até" sublabel={`Padrão ${DEFAULT_T1}`}>
              <div className="relative">
                <input
                  type="number" step="1" min="0" max="100"
                  className="input !pr-8 tabular-nums"
                  value={t1Str}
                  onChange={e => setT1Str(e.target.value)}
                  placeholder={String(DEFAULT_T1)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle text-sm">%</span>
              </div>
            </Field>
            <Field label="Bom até" sublabel={`Padrão ${DEFAULT_T2}`}>
              <div className="relative">
                <input
                  type="number" step="1" min="0" max="100"
                  className="input !pr-8 tabular-nums"
                  value={t2Str}
                  onChange={e => setT2Str(e.target.value)}
                  placeholder={String(DEFAULT_T2)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle text-sm">%</span>
              </div>
            </Field>
            <Field label="Marginal até" sublabel={`Padrão ${DEFAULT_T3}`}>
              <div className="relative">
                <input
                  type="number" step="1" min="0" max="100"
                  className="input !pr-8 tabular-nums"
                  value={t3Str}
                  onChange={e => setT3Str(e.target.value)}
                  placeholder={String(DEFAULT_T3)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle text-sm">%</span>
              </div>
            </Field>
          </div>
          {errors.thresholds && <span className="text-sm text-red-500 mt-2 block">{errors.thresholds}</span>}
          {(errors.t1 || errors.t2 || errors.t3) && <span className="text-sm text-red-500 mt-2 block">Cada limite precisa ser um número entre 0 e 100.</span>}
        </div>

        <NotificationSettings />
      </div>
    </Modal>
  )
}

function NotificationSettings() {
  const [permState, setPermState] = useState(getPermissionState)
  const supported = isPushSupported()
  const iosNonStandalone = isIOS() && !isStandalone()

  const handleRequest = async () => {
    const result = await requestPermission()
    setPermState(result)
  }

  const handleTest = async () => {
    if (Notification.permission !== 'granted') return
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification('Teste de notificação', {
        body: 'As notificações estão funcionando!',
        icon: '/icon-192.png',
        tag: 'test',
      })
    } catch {
      new Notification('Teste', { body: 'Notificações funcionando!' })
    }
  }

  const STATUS_MAP = {
    granted:     { label: 'Concedida', tone: 'text-emerald-700 dark:text-emerald-400', icon: 'check' },
    denied:      { label: 'Bloqueada', tone: 'text-red-500', icon: 'bell-off' },
    default:     { label: 'Não solicitada', tone: 'text-fg-muted', icon: 'bell' },
    unsupported: { label: 'Não suportado', tone: 'text-fg-subtle', icon: 'bell-off' },
  }

  const status = STATUS_MAP[permState] || STATUS_MAP.unsupported

  return (
    <div className="border-t border-line pt-4">
      <p className="text-sm font-medium text-fg mb-1">
        <Icon name="bell" className="w-4 h-4 inline mr-1" />
        Notificações
      </p>
      <p className="text-xs text-fg-muted mb-3">
        Receba lembretes no celular quando um leilão estiver próximo.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-fg-muted">Status:</span>
        <span className={`text-xs font-medium ${status.tone}`}>
          <Icon name={status.icon} className="w-3.5 h-3.5 inline mr-0.5" />
          {status.label}
        </span>
      </div>

      {!supported && (
        <p className="text-xs text-fg-subtle">
          Seu navegador não suporta notificações.
        </p>
      )}

      {supported && iosNonStandalone && (
        <p className="text-xs text-fg-muted">
          No iPhone/iPad, instale o app na tela de início para receber notificações.
        </p>
      )}

      {supported && !iosNonStandalone && permState === 'default' && (
        <button onClick={handleRequest} className="btn-ghost text-xs">
          <Icon name="bell" className="w-3.5 h-3.5" /> Ativar notificações
        </button>
      )}

      {supported && permState === 'granted' && (
        <button onClick={handleTest} className="btn-ghost text-xs">
          <Icon name="bell" className="w-3.5 h-3.5" /> Enviar teste
        </button>
      )}

      {supported && permState === 'denied' && (
        <p className="text-xs text-fg-muted">
          As notificações foram bloqueadas. Para reativar, acesse as configurações do navegador
          {' → '} Permissões do site {' → '} Notificações.
        </p>
      )}
    </div>
  )
}

function Field({ label, sublabel, children }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
      {sublabel && <span className="text-xs text-fg-muted block mt-1">{sublabel}</span>}
    </label>
  )
}
