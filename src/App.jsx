import { useEffect, useMemo, useState } from 'react'
import { Icon } from './components/Icon'
import { Modal } from './components/Modal'
import { SettingsModal } from './components/SettingsModal'
import { WhatsAppModal } from './components/WhatsAppModal'
import { HistoryModal } from './components/HistoryModal'
import { ProfileModal } from './components/ProfileModal'
import { AuthScreen } from './components/AuthScreen'
import { calculate } from './lib/calc'
import { brl, formatBRLInput, parseBRL, pct } from './lib/format'
import { openPDF } from './lib/pdf'
import { useTheme } from './lib/theme'
import { useAuth } from './lib/auth'
import {
  fetchCalculations, insertCalculation, deleteCalculation,
  fetchSettings, upsertSettings,
} from './lib/data'
import {
  CATEGORIES, DEFAULT_COMMISSION, DEFAULT_INSTALLMENTS,
  MAX_INSTALLMENTS, MIN_INSTALLMENTS,
} from './lib/constants'

const EMPTY_META = {
  comprador: '', lote: '', processo: '',
  categoria: '', subcategoria: '', descricao: '', dataLeilao: '',
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-fg-muted">Carregando…</div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return <Calculator userId={user.id} theme={theme} toggleTheme={toggleTheme} />
}

function Calculator({ userId, theme, toggleTheme }) {
  const [arremateStr, setArremateStr] = useState('')
  const [commissionPct, setCommissionPct] = useState(DEFAULT_COMMISSION)
  const [installments, setInstallments] = useState(DEFAULT_INSTALLMENTS)
  const [meta, setMeta] = useState(EMPTY_META)

  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState({})

  const [openSettings, setOpenSettings] = useState(false)
  const [openWA, setOpenWA] = useState(false)
  const [openHistory, setOpenHistory] = useState(false)
  const [openSave, setOpenSave] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchCalculations(userId), fetchSettings(userId)])
      .then(([h, s]) => {
        if (cancelled) return
        setHistory(h)
        setSettings(s || {})
      })
      .catch(err => showToast(err?.message || 'Erro ao carregar dados'))
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('recover') === '1') {
      setOpenProfile(true)
      url.searchParams.delete('recover')
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams}` : ''))
    }
  }, [])

  const arremate = useMemo(() => parseBRL(arremateStr), [arremateStr])
  const calc = useMemo(
    () => calculate({ arremate, commissionPct, installments }),
    [arremate, commissionPct, installments],
  )
  const hasValue = arremate > 0

  const updateMeta = (k, v) => setMeta(m => {
    const next = { ...m, [k]: v }
    if (k === 'categoria') next.subcategoria = ''
    return next
  })

  const handleSave = async () => {
    try {
      const item = await insertCalculation(userId, { calc, meta })
      setHistory(h => [item, ...h])
      setOpenSave(false)
      showToast('Cálculo salvo')
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar')
    }
  }

  const handleLoad = (item) => {
    setArremateStr(formatBRLInput(String(Math.round((item.calc.bid || 0) * 100))))
    setCommissionPct(item.calc.commissionPct ?? DEFAULT_COMMISSION)
    setInstallments(item.calc.installments ?? DEFAULT_INSTALLMENTS)
    setMeta({ ...EMPTY_META, ...item.meta })
    showToast('Cálculo carregado')
  }

  const handleDelete = async (id) => {
    try {
      await deleteCalculation(id)
      setHistory(h => h.filter(x => x.id !== id))
    } catch (err) {
      showToast(err?.message || 'Erro ao excluir')
    }
  }

  const handleSaveSettings = async (s) => {
    try {
      await upsertSettings(userId, s)
      setSettings(s)
      showToast('Configurações salvas')
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar configurações')
    }
  }

  const handlePDF = () => {
    if (!hasValue) return showToast('Informe o valor de arremate')
    openPDF({ calc, meta, settings })
  }
  const handleWA = () => {
    if (!hasValue) return showToast('Informe o valor de arremate')
    setOpenWA(true)
  }

  const handleReset = () => {
    setArremateStr(''); setCommissionPct(DEFAULT_COMMISSION); setInstallments(DEFAULT_INSTALLMENTS); setMeta(EMPTY_META)
  }

  const subcats = CATEGORIES[meta.categoria] || []

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-soft"
                 style={{ background: 'rgb(var(--elevated))', color: 'rgb(var(--on-elevated))' }}>
              <Icon name="calculator" className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-fg leading-tight truncate">Calculadora de Leilão</h1>
              <p className="text-[11px] text-fg-muted leading-tight truncate">{settings?.nome || 'Configure seus dados'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconBtn label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'} onClick={toggleTheme} icon={theme === 'dark' ? 'sun' : 'moon'} />
            <IconBtn label="Histórico" onClick={() => setOpenHistory(true)} icon="history" />
            <IconBtn label="Configurações" onClick={() => setOpenSettings(true)} icon="settings" />
            <IconBtn label="Perfil" onClick={() => setOpenProfile(true)} icon="user" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 grid lg:grid-cols-[1.05fr_1fr] gap-5 sm:gap-7">
        {/* Inputs */}
        <section className="card p-5 sm:p-7 space-y-6">
          <div>
            <label className="label">Valor de arremate</label>
            <div className="mt-2 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle text-lg">R$</span>
              <input
                inputMode="decimal"
                className="input !pl-12 !py-4 text-3xl sm:text-4xl font-semibold tabular-nums"
                value={arremateStr}
                onChange={e => setArremateStr(formatBRLInput(e.target.value))}
                placeholder="0,00"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between items-baseline">
                <label className="label">Comissão do leiloeiro</label>
                <button
                  className="text-[11px] text-accent hover:text-accent-hover"
                  onClick={() => setCommissionPct(DEFAULT_COMMISSION)}
                  type="button"
                >Padrão 5%</button>
              </div>
              <div className="mt-2 relative">
                <input
                  type="number" min="0" max="100" step="0.01"
                  className="input !pr-10 tabular-nums"
                  value={commissionPct}
                  onChange={e => setCommissionPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-subtle">%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="label">Parcelas (sem juros)</label>
                <span className="text-[11px] text-fg-muted">até {MAX_INSTALLMENTS}x</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StepBtn onClick={() => setInstallments(v => Math.max(MIN_INSTALLMENTS, v - 1))} label="Diminuir">
                  <Icon name="minus" className="w-4 h-4" />
                </StepBtn>
                <input
                  type="number" min={MIN_INSTALLMENTS} max={MAX_INSTALLMENTS}
                  className="input text-center tabular-nums"
                  value={installments}
                  onChange={e => setInstallments(Math.max(MIN_INSTALLMENTS, Math.min(MAX_INSTALLMENTS, parseInt(e.target.value) || 1)))}
                />
                <StepBtn onClick={() => setInstallments(v => Math.min(MAX_INSTALLMENTS, v + 1))} label="Aumentar">
                  <Icon name="plus" className="w-4 h-4" />
                </StepBtn>
              </div>
            </div>
          </div>

          <div className="divider" />

          <details className="group" open={false}>
            <summary className="flex items-center justify-between cursor-pointer select-none py-1">
              <span className="label">Detalhes do arremate (opcional)</span>
              <Icon name="chevron-down" className="w-4 h-4 text-fg-subtle group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Comprador">
                  <input className="input" value={meta.comprador} onChange={e => updateMeta('comprador', e.target.value)} placeholder="Nome completo" />
                </Field>
                <Field label="Lote">
                  <input className="input" value={meta.lote} onChange={e => updateMeta('lote', e.target.value)} placeholder="Nº do lote" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Categoria">
                  <select className="input" value={meta.categoria} onChange={e => updateMeta('categoria', e.target.value)}>
                    <option value="">Selecione</option>
                    {Object.keys(CATEGORIES).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select
                    className="input disabled:opacity-50"
                    value={meta.subcategoria}
                    onChange={e => updateMeta('subcategoria', e.target.value)}
                    disabled={!subcats.length}
                  >
                    <option value="">{subcats.length ? 'Selecione' : '—'}</option>
                    {subcats.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Descrição do bem">
                <textarea rows={2} className="input resize-none" value={meta.descricao} onChange={e => updateMeta('descricao', e.target.value)} placeholder="Ex: Apartamento de 3 quartos, Centro, 90m²" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Processo judicial">
                  <input className="input" value={meta.processo} onChange={e => updateMeta('processo', e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
                </Field>
                <Field label="Data do leilão">
                  <input type="date" className="input" value={meta.dataLeilao} onChange={e => updateMeta('dataLeilao', e.target.value)} />
                </Field>
              </div>
            </div>
          </details>

          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-ghost" onClick={handleReset}>Limpar</button>
            <div className="flex-1" />
            <button className="btn-ghost" onClick={() => setOpenSave(true)} disabled={!hasValue}>
              <Icon name="save" className="w-4 h-4" /> Salvar
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="lg:sticky lg:top-24 self-start">
          <div className="card p-5 sm:p-7">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-fg">Resumo</h2>
              {hasValue && <span className="text-xs text-fg-muted">{pct(commissionPct)} comissão · {calc.installments}x</span>}
            </div>

            <div className="mt-5 space-y-5">
              <div className="hero-stat">
                <div className="text-[11px] uppercase tracking-[0.08em] font-medium opacity-60">Total à vista (no dia)</div>
                <div className="text-3xl sm:text-[34px] font-semibold tabular-nums mt-1 leading-tight">{brl(calc.upfront)}</div>
                <div className="text-xs mt-1.5 opacity-60">Entrada 25% + comissão {pct(commissionPct)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Entrada (25%)" value={brl(calc.entry)} />
                <MiniStat label={`Comissão (${pct(commissionPct)})`} value={brl(calc.commission)} />
              </div>

              <div className="divider" />

              <div className="hero-stat-light">
                <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-fg-muted">Parcela ({calc.installments}x sem juros)</div>
                <div className="text-3xl sm:text-[34px] font-semibold tabular-nums mt-1 leading-tight text-fg">{brl(calc.installment)}</div>
                <div className="text-xs mt-1.5 text-fg-muted">Saldo de {brl(calc.remaining)} parcelado</div>
              </div>

              <div className="divider" />

              <div className="stat">
                <span className="stat-label">Valor de arremate</span>
                <span className="stat-value">{brl(calc.bid)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total geral</span>
                <span className="stat-strong">{brl(calc.total)}</span>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2">
              <button className="btn-primary" onClick={handlePDF} disabled={!hasValue}>
                <Icon name="pdf" className="w-4 h-4" /> PDF
              </button>
              <button className="btn-accent" onClick={handleWA} disabled={!hasValue}>
                <Icon name="whatsapp" className="w-4 h-4" /> WhatsApp
              </button>
            </div>
          </div>

          <p className="text-[11px] text-fg-muted text-center mt-4 px-4">
            Os valores são referenciais. Confira com o edital do leilão antes de informar o comprador.
          </p>
        </section>
      </main>

      {/* Modals */}
      <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} settings={settings} onSave={handleSaveSettings} />
      <WhatsAppModal open={openWA} onClose={() => setOpenWA(false)} calc={calc} meta={meta} settings={settings} />
      <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} items={history} onLoad={handleLoad} onDelete={handleDelete} />
      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} onToast={showToast} />

      <Modal
        open={openSave} onClose={() => setOpenSave(false)} title="Salvar cálculo"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpenSave(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}><Icon name="check" className="w-4 h-4" /> Salvar</button>
          </>
        }
      >
        <p className="text-sm text-fg-muted mb-4">Revise as informações antes de salvar no histórico.</p>
        <div className="rounded-xl bg-soft p-4 space-y-1.5 text-sm border border-line">
          <Row k="Arremate" v={brl(calc.bid)} />
          <Row k="Total à vista" v={brl(calc.upfront)} strong />
          <Row k={`Parcela (${calc.installments}x)`} v={brl(calc.installment)} />
          {meta.comprador && <Row k="Comprador" v={meta.comprador} />}
          {meta.lote && <Row k="Lote" v={meta.lote} />}
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] anim-scale">
          <div
            className="text-sm px-5 py-2.5 rounded-full shadow-pop flex items-center gap-2"
            style={{ background: 'rgb(var(--elevated))', color: 'rgb(var(--on-elevated))' }}
          >
            <Icon name="check" className="w-4 h-4" /> {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function IconBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="icon-btn">
      <Icon name={icon} className="w-[18px] h-[18px]" />
    </button>
  )
}

function StepBtn({ onClick, label, children }) {
  return (
    <button
      type="button" aria-label={label} onClick={onClick}
      className="w-10 h-11 rounded-xl bg-soft border border-line text-fg-muted hover:text-fg active:scale-95 transition flex items-center justify-center"
    >{children}</button>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <div className="text-[10px] uppercase tracking-[0.08em] text-fg-muted font-medium">{label}</div>
      <div className="text-[15px] font-medium text-fg tabular-nums mt-0.5">{value}</div>
    </div>
  )
}

function Row({ k, v, strong }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-fg-muted">{k}</span>
      <span className={strong ? 'font-semibold text-fg tabular-nums' : 'text-fg tabular-nums'}>{v}</span>
    </div>
  )
}
