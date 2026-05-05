import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './components/Icon'
import { Tooltip } from './components/Tooltip'
import { TOOLTIPS } from './lib/tooltips'
import { Modal } from './components/Modal'
import { SettingsModal } from './components/SettingsModal'
import { WhatsAppModal } from './components/WhatsAppModal'
import { HistoryModal } from './components/HistoryModal'
import { ReminderToggle } from './components/ReminderToggle'
import { RemindersBell } from './components/RemindersBell'
import { RemindersBanner } from './components/RemindersBanner'
import { getDaysUntil } from './lib/reminder'
import { ProfileModal } from './components/ProfileModal'
import { AuthScreen } from './components/AuthScreen'
import { calculate } from './lib/calc'
import { buildScenarioMatrix, DEFAULT_THRESHOLDS, TIER_LABELS } from './lib/scenarios'
import { buildSchedule } from './lib/schedule'
import { brl, formatBRLInput, parseBRL, pct, formatDateBR } from './lib/format'
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

const SURETY_FALLBACK = 1

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
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('calc.lastMode') || 'fixed' } catch { return 'fixed' }
  })
  const [arremateStr, setArremateStr] = useState('')
  const [appraisalStr, setAppraisalStr] = useState('')
  const [selectedDiscountPct, setSelectedDiscountPct] = useState(null)
  const [commissionPct, setCommissionPct] = useState(DEFAULT_COMMISSION)
  const [installments, setInstallments] = useState(DEFAULT_INSTALLMENTS)
  const [suretyPctStr, setSuretyPctStr] = useState('')
  const [suretyTouched, setSuretyTouched] = useState(false)
  const [revendaStr, setRevendaStr] = useState('')
  const [intervaloDiasStr, setIntervaloDiasStr] = useState('30')
  const [meta, setMeta] = useState(EMPTY_META)
  const [pinnedPcts, setPinnedPcts] = useState([])  // session-only (D-40)

  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState({})

  const [openSettings, setOpenSettings] = useState(false)
  const [openWA, setOpenWA] = useState(false)
  const [openHistory, setOpenHistory] = useState(false)
  const [openSave, setOpenSave] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [toast, setToast] = useState('')
  const [reminderDraft, setReminderDraft] = useState({ enabled: true, leadTimes: ['7d', '1d', '0d'] })
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  useEffect(() => {
    try { localStorage.setItem('calc.lastMode', mode) } catch {}
  }, [mode])

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

  // Sync surety default from Settings (only once, while user hasn't touched the field)
  useEffect(() => {
    if (suretyTouched) return
    if (suretyPctStr !== '') return
    if (settings && settings.defaultSuretyPct != null) {
      setSuretyPctStr(String(settings.defaultSuretyPct))
    } else if (settings) {
      setSuretyPctStr(String(SURETY_FALLBACK))
    }
  }, [settings, suretyTouched, suretyPctStr])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('recover') === '1') {
      setOpenProfile(true)
      url.searchParams.delete('recover')
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams}` : ''))
    }
  }, [])

  const suretyPct = useMemo(() => {
    if (suretyPctStr.trim() === '') return settings?.defaultSuretyPct ?? SURETY_FALLBACK
    const n = Number(suretyPctStr)
    return Number.isFinite(n) ? n : 0
  }, [suretyPctStr, settings])

  const appraisal = useMemo(() => parseBRL(appraisalStr), [appraisalStr])

  const effectiveArremate = useMemo(() => {
    if (mode === 'scenarios') {
      if (selectedDiscountPct == null) return 0
      return appraisal * (selectedDiscountPct / 100)
    }
    return parseBRL(arremateStr)
  }, [mode, arremateStr, appraisal, selectedDiscountPct])

  const calc = useMemo(
    () => calculate({ arremate: effectiveArremate, commissionPct, suretyPct, installments }),
    [effectiveArremate, commissionPct, suretyPct, installments],
  )

  // Thresholds vindos de Settings (com fallback aos defaults)
  const thresholds = useMemo(() => ({
    t1: settings?.viabilityT1 ?? DEFAULT_THRESHOLDS.t1,
    t2: settings?.viabilityT2 ?? DEFAULT_THRESHOLDS.t2,
    t3: settings?.viabilityT3 ?? DEFAULT_THRESHOLDS.t3,
  }), [settings])

  const scenarios = useMemo(() => buildScenarioMatrix({
    appraisal,
    commissionPct,
    suretyPct,
    installments,
    thresholds,
  }), [appraisal, commissionPct, suretyPct, installments, thresholds])

  const revenda = useMemo(() => parseBRL(revendaStr), [revendaStr])
  const intervaloDias = useMemo(() => {
    const n = parseInt(intervaloDiasStr, 10)
    return Number.isFinite(n) && n > 0 ? n : 30
  }, [intervaloDiasStr])

  // Margem bruta — só quando revenda > 0 e há um arremate efetivo
  const margin = useMemo(() => {
    if (!(revenda > 0) || calc.bid <= 0) return null
    const totalEfetivo = calc.bid + calc.commission + calc.surety
    const value = revenda - totalEfetivo
    const pctVal = (value / revenda) * 100
    return { value, pct: pctVal }
  }, [revenda, calc])

  // Cronograma — derivado, só com data leilão preenchida
  const schedule = useMemo(() => {
    if (!meta.dataLeilao || calc.installments <= 0) return []
    return buildSchedule(calc.installments, meta.dataLeilao, intervaloDias, calc.installment)
  }, [meta.dataLeilao, calc.installments, calc.installment, intervaloDias])

  // Tier do cenário ativo (Resumo badge)
  const activeTier = useMemo(() => {
    if (mode === 'scenarios' && selectedDiscountPct != null) {
      const row = scenarios.find(r => r.pct === selectedDiscountPct)
      return row?.tier ?? null
    }
    return null
  }, [mode, selectedDiscountPct, scenarios])

  const hasValue = effectiveArremate > 0
  const canAct = mode === 'fixed' ? hasValue : (selectedDiscountPct != null && appraisal > 0)

  const switchMode = (next) => {
    if (next === mode) return
    // Preserva inputs de ambos os modos para o usuário poder ir e vir sem perder dados.
    // Limpeza só pelo botão "Limpar".
    setMode(next)
  }

  const updateMeta = (k, v) => setMeta(m => {
    const next = { ...m, [k]: v }
    if (k === 'categoria') next.subcategoria = ''
    return next
  })

  const buildSavePayload = () => {
    const base = {
      ...calc,
      mode,
      suretyPct,
      surety: calc.surety,
    }
    if (mode === 'scenarios') {
      base.appraisal = appraisal
      base.discountPct = selectedDiscountPct
    }
    if (revenda > 0) base.revendaEsperada = revenda
    if (intervaloDias !== 30) base.intervaloDias = intervaloDias
    return base
  }

  const handleSave = async () => {
    try {
      const payload = buildSavePayload()
      const days = getDaysUntil(meta.dataLeilao)
      const metaToSave = (days !== null && days >= 0)
        ? { ...meta, reminder: { ...reminderDraft, pushEnabled: false } }
        : meta
      const item = await insertCalculation(userId, { calc: payload, meta: metaToSave })
      setHistory(h => [item, ...h])
      setOpenSave(false)
      const lt = metaToSave.reminder?.enabled && metaToSave.reminder.leadTimes?.length
      showToast(lt ? `Cálculo salvo · lembretes ativos` : 'Cálculo salvo')
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar')
    }
  }

  const handleLoad = (item) => {
    const c = item.calc || {}

    // Legados
    setCommissionPct(c.commissionPct ?? DEFAULT_COMMISSION)
    setInstallments(c.installments ?? DEFAULT_INSTALLMENTS)
    setMeta({ ...EMPTY_META, ...item.meta })

    // Novos campos (D-06) — backwards-compat
    const loadedMode = c.mode ?? 'fixed'
    setMode(loadedMode)
    setSuretyPctStr(c.suretyPct != null ? String(c.suretyPct) : '0')
    setSuretyTouched(true)

    if (loadedMode === 'scenarios') {
      setAppraisalStr(formatBRLInput(String(Math.round((c.appraisal || 0) * 100))))
      setSelectedDiscountPct(c.discountPct ?? null)
      setArremateStr('')
    } else {
      setArremateStr(formatBRLInput(String(Math.round((c.bid || 0) * 100))))
      setAppraisalStr('')
      setSelectedDiscountPct(null)
    }

    // Fase 2 — restaura revenda e intervalo (D-26)
    setRevendaStr(c.revendaEsperada > 0 ? formatBRLInput(String(Math.round(c.revendaEsperada * 100))) : '')
    setIntervaloDiasStr(String(c.intervaloDias ?? 30))

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
      // Re-sincroniza o campo de fiança com o novo default de Settings
      // (a menos que o usuário tenha um override ativo divergente do default antigo)
      const newDefault = s.defaultSuretyPct ?? SURETY_FALLBACK
      setSuretyPctStr(String(newDefault))
      setSuretyTouched(false)
      showToast('Configurações salvas')
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar configurações')
    }
  }

  const calcForExport = useMemo(() => ({
    ...calc,
    revendaEsperada: revenda > 0 ? revenda : undefined,
    intervaloDias,
  }), [calc, revenda, intervaloDias])

  const handlePDF = () => {
    if (!canAct) return showToast(mode === 'scenarios' ? 'Selecione um cenário' : 'Informe o valor de arremate')
    openPDF({ calc: calcForExport, meta, settings })
  }
  const handleWA = () => {
    if (!canAct) return showToast(mode === 'scenarios' ? 'Selecione um cenário' : 'Informe o valor de arremate')
    setOpenWA(true)
  }

  const handleReset = () => {
    setArremateStr('')
    setAppraisalStr('')
    setSelectedDiscountPct(null)
    setCommissionPct(DEFAULT_COMMISSION)
    setInstallments(DEFAULT_INSTALLMENTS)
    setRevendaStr('')
    setIntervaloDiasStr('30')
    setMeta(EMPTY_META)
    setPinnedPcts([])
  }

  const subcats = CATEGORIES[meta.categoria] || []
  const suretyPlaceholder = String(settings?.defaultSuretyPct ?? SURETY_FALLBACK)

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
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
            <RemindersBell items={history} onOpenItem={(item) => { handleLoad(item); }} />
            <IconBtn label="Histórico" onClick={() => setOpenHistory(true)} icon="history" />
            <UserMenu
              theme={theme}
              onToggleTheme={toggleTheme}
              onSettings={() => setOpenSettings(true)}
              onProfile={() => setOpenProfile(true)}
            />
          </div>
        </div>
      </header>

      {!bannerDismissed && (
        <RemindersBanner
          items={history}
          onOpenItem={(item) => { handleLoad(item); setBannerDismissed(true) }}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <main className={`mx-auto px-4 sm:px-6 pt-6 sm:pt-10 grid lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)] gap-5 sm:gap-7 ${mode === 'scenarios' ? 'max-w-7xl' : 'max-w-6xl'}`}>
        {/* Inputs */}
        <section className="card p-5 sm:p-7 space-y-6 min-w-0">
          {/* Mode toggle */}
          <div role="tablist" aria-label="Modo de cálculo" className="inline-flex rounded-lg border border-line bg-soft p-1 gap-1">
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'fixed'}
              onClick={() => switchMode('fixed')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'fixed' ? 'bg-accent text-white shadow-soft' : 'text-fg-muted hover:text-fg'}`}
            >Arremate fixo</button>
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'scenarios'}
              onClick={() => switchMode('scenarios')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'scenarios' ? 'bg-accent text-white shadow-soft' : 'text-fg-muted hover:text-fg'}`}
            >Simular por avaliação</button>
          </div>

          {mode === 'fixed' ? (
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
          ) : (
            <div>
              <label className="label">Valor de avaliação</label>
              <div className="mt-2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle text-lg">R$</span>
                <input
                  inputMode="decimal"
                  className="input !pl-12 !py-4 text-3xl sm:text-4xl font-semibold tabular-nums"
                  value={appraisalStr}
                  onChange={e => {
                    setAppraisalStr(formatBRLInput(e.target.value))
                    setSelectedDiscountPct(null)
                  }}
                  placeholder="0,00"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="flex flex-col">
              <div className="flex justify-between items-baseline gap-2 min-h-[20px]">
                <span className="label inline-flex items-center gap-1">Comissão<Tooltip text={TOOLTIPS.commission} /></span>
                <button
                  className="text-[11px] text-accent hover:text-accent-hover whitespace-nowrap"
                  onClick={() => setCommissionPct(DEFAULT_COMMISSION)}
                  type="button"
                >Padrão 5%</button>
              </div>
              <div className="mt-2 relative">
                <input
                  type="number" min="0" max="100" step="0.01"
                  className="input !pr-10 tabular-nums h-11"
                  value={commissionPct}
                  onChange={e => setCommissionPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-subtle">%</span>
              </div>
              <p className="text-[11px] text-fg-muted mt-1.5">Do leiloeiro</p>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-baseline gap-2 min-h-[20px]">
                <span className="label inline-flex items-center gap-1">Carta fiança<Tooltip text={TOOLTIPS.surety} /></span>
              </div>
              <div className="mt-2 relative">
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="input !pr-10 tabular-nums h-11"
                  value={suretyPctStr}
                  placeholder={suretyPlaceholder}
                  onChange={e => { setSuretyPctStr(e.target.value); setSuretyTouched(true) }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-subtle">%</span>
              </div>
              <p className="text-[11px] text-fg-muted mt-1.5">% do saldo · Padrão {suretyPlaceholder}%</p>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-baseline gap-2 min-h-[20px]">
                <label className="label">Parcelas</label>
                <span className="text-[11px] text-fg-muted whitespace-nowrap">até {MAX_INSTALLMENTS}x</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <StepBtn onClick={() => setInstallments(v => Math.max(MIN_INSTALLMENTS, v - 1))} label="Diminuir">
                  <Icon name="minus" className="w-4 h-4" />
                </StepBtn>
                <input
                  type="number" min={MIN_INSTALLMENTS} max={MAX_INSTALLMENTS}
                  className="input text-center tabular-nums h-11 px-1"
                  value={installments}
                  onChange={e => setInstallments(Math.max(MIN_INSTALLMENTS, Math.min(MAX_INSTALLMENTS, parseInt(e.target.value) || 1)))}
                />
                <StepBtn onClick={() => setInstallments(v => Math.min(MAX_INSTALLMENTS, v + 1))} label="Aumentar">
                  <Icon name="plus" className="w-4 h-4" />
                </StepBtn>
              </div>
              <p className="text-[11px] text-fg-muted mt-1.5">Sem juros</p>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-baseline gap-2 min-h-[20px]">
                <label className="label">Revenda</label>
                <span className="text-[11px] text-fg-muted whitespace-nowrap">Opcional</span>
              </div>
              <div className="mt-2 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle text-sm">R$</span>
                <input
                  inputMode="decimal"
                  className="input !pl-10 tabular-nums h-11"
                  value={revendaStr}
                  onChange={e => setRevendaStr(formatBRLInput(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <p className="text-[11px] text-fg-muted mt-1.5">Estimar margem</p>
            </div>
          </div>

          {mode === 'scenarios' && (
            <ScenariosMatrix
              scenarios={scenarios}
              selected={selectedDiscountPct}
              onSelect={setSelectedDiscountPct}
              hasInput={appraisal > 0}
              revenda={revenda}
              pinned={pinnedPcts}
              onTogglePin={(pct) => {
                setPinnedPcts(prev => {
                  if (prev.includes(pct)) return prev.filter(p => p !== pct)
                  if (prev.length >= 3) {
                    showToast('Máximo 3 cenários — desfixe um primeiro')
                    return prev
                  }
                  return [...prev, pct]
                })
              }}
            />
          )}

          {mode === 'scenarios' && pinnedPcts.length > 0 && (
            <ScenarioComparator
              scenarios={scenarios}
              pinnedPcts={pinnedPcts}
              revenda={revenda}
              onClear={() => setPinnedPcts([])}
              onUnpin={(pct) => setPinnedPcts(prev => prev.filter(p => p !== pct))}
            />
          )}

          <div className="divider" />

          <details className="group rounded-xl border border-line bg-soft/40 hover:bg-soft transition-colors open:bg-surface open:shadow-soft">
            <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-3.5 list-none">
              <span className="flex items-center gap-2.5 text-sm font-medium text-fg">
                <span className="w-7 h-7 rounded-lg bg-surface border border-line flex items-center justify-center text-fg-muted group-hover:text-accent group-open:text-accent transition-colors">
                  <Icon name="plus" className="w-4 h-4 group-open:hidden" />
                  <Icon name="minus" className="w-4 h-4 hidden group-open:block" />
                </span>
                <span className="flex flex-col">
                  <span>Adicionar detalhes do arremate</span>
                  <span className="text-[11px] text-fg-muted font-normal">Comprador, lote, processo, categoria…</span>
                </span>
              </span>
              <Icon name="chevron-down" className="w-4 h-4 text-fg-subtle group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-line">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Intervalo entre parcelas (dias)">
                  <input
                    type="number" min="1" max="365" step="1"
                    className="input tabular-nums"
                    value={intervaloDiasStr}
                    onChange={e => setIntervaloDiasStr(e.target.value)}
                    placeholder="30"
                  />
                  <span className="text-[11px] text-fg-muted block mt-1">Estimado — confirme com o edital</span>
                </Field>
              </div>
            </div>
          </details>

          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-ghost" onClick={handleReset}>Limpar</button>
            <div className="flex-1" />
            <button className="btn-ghost" onClick={() => setOpenSave(true)} disabled={!canAct}>
              <Icon name="save" className="w-4 h-4" /> Salvar
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="lg:sticky lg:top-24 self-start min-w-0">
          <div className="card p-5 sm:p-7">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-fg">Resumo</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {canAct && activeTier && <ViabilityBadge tier={activeTier} />}
                {canAct && <span className="text-xs text-fg-muted whitespace-nowrap">{pct(commissionPct)} · {calc.installments}x</span>}
              </div>
            </div>

            {!canAct && mode === 'scenarios' ? (
              <div className="mt-5 rounded-xl bg-soft border border-line p-6 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-fg-muted">
                  <Icon name="calculator" className="w-5 h-5" />
                </div>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Selecione um cenário na matriz<br />para ver o resumo.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="hero-stat">
                  <div className="text-[11px] uppercase tracking-[0.08em] font-medium opacity-60 flex items-center gap-1">
                    Custo inicial
                    <Tooltip text={TOOLTIPS.upfront} />
                  </div>
                  <div className="text-3xl sm:text-[34px] font-semibold tabular-nums mt-1 leading-tight">{brl(calc.upfront)}</div>
                  {calc.upfront > 0 && calc.bid > 0 && (
                    <CompositionBar entry={calc.entry} commission={calc.commission} surety={calc.surety} upfront={calc.upfront} />
                  )}
                  <div className="text-xs mt-1.5 opacity-60">Entrada + comissão + carta de fiança</div>
                  {calc.upfront > 0 && calc.bid > 0 && (
                    <div className="text-[11px] opacity-60 mt-0.5">
                      ({(calc.upfront / calc.bid * 100).toFixed(1)}% do arremate sai no dia)
                    </div>
                  )}
                  {margin && (
                    <div className="text-xs mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                      <span className="opacity-60 inline-flex items-center gap-1">
                        Margem estimada
                        <Tooltip text={TOOLTIPS.margin} />:
                      </span>{' '}
                      <span className="font-semibold tabular-nums" style={{
                        color: margin.value >= 0 ? 'rgb(var(--hero-positive))' : 'rgb(var(--hero-negative))',
                      }}>
                        {brl(margin.value)} ({margin.pct.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Entrada (25%)" value={brl(calc.entry)} tooltip={TOOLTIPS.entry} />
                  <MiniStat label={`Comissão (${pct(commissionPct)})`} value={brl(calc.commission)} tooltip={TOOLTIPS.commission} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={`Carta de fiança (${pct(suretyPct)})`} value={brl(calc.surety)} tooltip={TOOLTIPS.surety} />
                  <MiniStat label="Saldo a parcelar" value={brl(calc.remaining)} tooltip={TOOLTIPS.remaining} />
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

                {/* Cronograma — mobile (details dentro do Resumo) */}
                {canAct && (
                  <details className="md:hidden mt-2 group rounded-xl border border-line bg-soft/40 hover:bg-soft transition-colors open:bg-surface">
                    <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-3 list-none">
                      <span className="flex items-center gap-2 text-sm font-medium text-fg">
                        <Icon name="calendar" className="w-4 h-4 text-fg-muted" />
                        {schedule.length > 0
                          ? `Ver cronograma (${schedule.length} parcelas)`
                          : 'Cronograma de pagamento'}
                      </span>
                      <Icon name="chevron-down" className="w-4 h-4 text-fg-subtle group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 pt-1 border-t border-line">
                      <ScheduleContent schedule={schedule} hasDate={!!meta.dataLeilao} />
                    </div>
                  </details>
                )}
              </div>
            )}

            <div className="mt-7 grid grid-cols-2 gap-2">
              <button className="btn-primary" onClick={handlePDF} disabled={!canAct}>
                <Icon name="pdf" className="w-4 h-4" /> PDF
              </button>
              <button className="btn-accent" onClick={handleWA} disabled={!canAct}>
                <Icon name="whatsapp" className="w-4 h-4" /> WhatsApp
              </button>
            </div>
          </div>

          {/* Cronograma — desktop (card separado abaixo do Resumo) */}
          {canAct && (
            <div className="hidden md:block card p-5 sm:p-7 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="calendar" className="w-4 h-4 text-fg-muted" />
                <h3 className="text-sm font-semibold text-fg">Cronograma de pagamento</h3>
              </div>
              <ScheduleContent schedule={schedule} hasDate={!!meta.dataLeilao} />
            </div>
          )}

          <p className="text-[11px] text-fg-muted text-center mt-4 px-4">
            Os valores são referenciais. Confira com o edital do leilão antes de informar o comprador.
          </p>
        </section>
      </main>

      {/* Modals */}
      <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} settings={settings} onSave={handleSaveSettings} />
      <WhatsAppModal open={openWA} onClose={() => setOpenWA(false)} calc={calcForExport} meta={meta} settings={settings} />
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
          <Row k="Modo" v={mode === 'scenarios' ? `Cenários (${selectedDiscountPct ?? '—'}%)` : 'Arremate fixo'} />
          <Row k="Arremate" v={brl(calc.bid)} />
          <Row k="Custo inicial" v={brl(calc.upfront)} strong />
          <Row k={`Parcela (${calc.installments}x)`} v={brl(calc.installment)} />
          {meta.comprador && <Row k="Comprador" v={meta.comprador} />}
          {meta.lote && <Row k="Lote" v={meta.lote} />}
        </div>
        <ReminderToggle
          value={reminderDraft}
          onChange={setReminderDraft}
          dataLeilao={meta.dataLeilao}
        />
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

function ScenariosMatrix({ scenarios, selected, onSelect, hasInput, revenda = 0, pinned = [], onTogglePin }) {
  if (!hasInput) {
    return (
      <div className="rounded-xl bg-soft border border-line p-6 text-center text-sm text-fg-muted">
        Informe o valor de avaliação para ver os 13 cenários.
      </div>
    )
  }

  const showMargin = revenda > 0

  const tierStyle = (row) => ({
    background: `rgb(var(--tier-${row.tier}-bg))`,
    color: `rgb(var(--tier-${row.tier}-fg))`,
  })

  const marginFor = (row) => {
    const totalEfetivo = row.bid + row.commission + row.surety
    const value = revenda - totalEfetivo
    const pctVal = revenda > 0 ? (value / revenda) * 100 : 0
    return { value, pct: pctVal }
  }

  return (
    <div className="min-w-0">
      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">Cenários de desconto</caption>
          <thead className="bg-soft text-fg-muted text-[11px] uppercase tracking-[0.06em]">
            <tr>
              <th className="text-left px-2 py-2.5 w-8" aria-label="Fixar"></th>
              <th className="text-left px-3 py-2.5">%</th>
              <th className="text-right px-3 py-2.5">Arrematação</th>
              <th className="text-right px-3 py-2.5">Entrada</th>
              <th className="text-right px-3 py-2.5">Saldo</th>
              <th className="text-right px-3 py-2.5">Comissão</th>
              <th className="text-right px-3 py-2.5">Carta fiança</th>
              <th className="text-right px-3 py-2.5">Custo inicial</th>
              <th className="text-right px-3 py-2.5">Parcela</th>
              {showMargin && <th className="text-right px-3 py-2.5">Margem %</th>}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((row) => {
              const isSel = row.pct === selected
              return (
                <tr
                  key={row.pct}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  onClick={() => onSelect(row.pct)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(row.pct)
                    }
                  }}
                  style={tierStyle(row)}
                  className={`border-t border-line cursor-pointer transition-colors hover:brightness-95 ${isSel ? 'ring-2 ring-accent ring-inset' : ''}`}
                >
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onTogglePin?.(row.pct) }}
                      aria-label={pinned.includes(row.pct) ? `Desfixar cenário ${row.pct}%` : `Fixar cenário ${row.pct}%`}
                      aria-pressed={pinned.includes(row.pct)}
                      className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition ${pinned.includes(row.pct) ? 'bg-accent text-white' : 'opacity-50 hover:opacity-100'}`}
                    >
                      <Icon name="pin" className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium">{row.pct}%</td>
                  <td className="px-3 py-2 text-right">{brl(row.bid)}</td>
                  <td className="px-3 py-2 text-right">{brl(row.entry)}</td>
                  <td className="px-3 py-2 text-right">{brl(row.remaining)}</td>
                  <td className="px-3 py-2 text-right">{brl(row.commission)}</td>
                  <td className="px-3 py-2 text-right">{brl(row.surety)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{brl(row.upfront)}</td>
                  <td className="px-3 py-2 text-right">{brl(row.installment)}</td>
                  {showMargin && (() => {
                    const m = marginFor(row)
                    return (
                      <td className="px-3 py-2 text-right font-medium">
                        {m.pct.toFixed(1)}%
                      </td>
                    )
                  })()}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {scenarios.map((row) => {
          const isSel = row.pct === selected
          return (
            <button
              key={row.pct}
              type="button"
              aria-pressed={isSel}
              onClick={() => onSelect(row.pct)}
              style={tierStyle(row)}
              className={`w-full text-left rounded-xl border border-line p-4 transition-colors hover:brightness-95 ${isSel ? 'ring-2 ring-accent' : ''}`}
            >
              <div className="flex items-baseline justify-between mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums">{row.pct}%</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onTogglePin?.(row.pct) }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTogglePin?.(row.pct) } }}
                    aria-label={pinned.includes(row.pct) ? `Desfixar ${row.pct}%` : `Fixar ${row.pct}%`}
                    aria-pressed={pinned.includes(row.pct)}
                    className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition ${pinned.includes(row.pct) ? 'bg-accent text-white' : 'opacity-50 hover:opacity-100'}`}
                  >
                    <Icon name="pin" className="w-3.5 h-3.5" />
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{brl(row.bid)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <span className="opacity-70">Entrada</span><span className="text-right tabular-nums">{brl(row.entry)}</span>
                <span className="opacity-70">Saldo</span><span className="text-right tabular-nums">{brl(row.remaining)}</span>
                <span className="opacity-70">Comissão</span><span className="text-right tabular-nums">{brl(row.commission)}</span>
                <span className="opacity-70">Carta fiança</span><span className="text-right tabular-nums">{brl(row.surety)}</span>
                <span className="opacity-70 font-semibold">Custo inicial</span><span className="text-right tabular-nums font-semibold">{brl(row.upfront)}</span>
                <span className="opacity-70">Parcela</span><span className="text-right tabular-nums">{brl(row.installment)}</span>
                {showMargin && (() => {
                  const m = marginFor(row)
                  return (
                    <>
                      <span className="opacity-70">Margem</span>
                      <span className="text-right tabular-nums font-medium">{m.pct.toFixed(1)}%</span>
                    </>
                  )
                })()}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UserMenu({ theme, onToggleTheme, onSettings, onProfile }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (fn) => { setOpen(false); fn() }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Menu do usuário"
        aria-haspopup="menu"
        aria-expanded={open}
        className="icon-btn flex items-center gap-0.5"
      >
        <Icon name="user" className="w-[18px] h-[18px]" />
        <Icon name="chevron-down" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-xl border border-line shadow-soft overflow-hidden z-40"
          style={{ background: 'rgb(var(--surface))' }}
        >
          <MenuItem
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            onClick={() => pick(onToggleTheme)}
          />
          <MenuItem icon="settings" label="Configurações" onClick={() => pick(onSettings)} />
          <MenuItem icon="user" label="Perfil" onClick={() => pick(onProfile)} />
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-fg hover:bg-soft transition text-left"
    >
      <Icon name={icon} className="w-4 h-4 text-fg-muted" />
      {label}
    </button>
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
      className="shrink-0 w-9 h-11 rounded-xl bg-soft border border-line text-fg-muted hover:text-fg active:scale-95 transition flex items-center justify-center"
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

function MiniStat({ label, value, tooltip }) {
  return (
    <div className="mini-stat">
      <div className="text-[10px] uppercase tracking-[0.08em] text-fg-muted font-medium flex items-center gap-1">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div className="text-[15px] font-medium text-fg tabular-nums mt-0.5">{value}</div>
    </div>
  )
}

function CompositionBar({ entry, commission, surety, upfront }) {
  if (upfront <= 0) return null
  const pE = (entry / upfront) * 100
  const pC = (commission / upfront) * 100
  const pS = (surety / upfront) * 100
  const segments = [
    { label: 'Entrada',      value: entry,      pct: pE, bg: 'rgb(var(--on-elevated) / 0.92)' },
    { label: 'Comissão',     value: commission, pct: pC, bg: 'rgb(var(--accent))' },
    { label: 'Carta fiança', value: surety,     pct: pS, bg: 'rgb(var(--on-elevated) / 0.45)' },
  ]
  return (
    <div
      className="mt-3 h-2 w-full flex rounded-full overflow-hidden"
      style={{ background: 'rgb(var(--on-elevated) / 0.15)' }}
      role="img"
      aria-label={`Composição: Entrada ${pE.toFixed(0)}%, Comissão ${pC.toFixed(0)}%, Carta de fiança ${pS.toFixed(0)}%`}
    >
      {segments.map((s, i) => s.pct > 0 && (
        <span
          key={i}
          className="h-full block"
          title={`${s.label}: R$ ${s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${s.pct.toFixed(1)}%)`}
          style={{ width: `${s.pct}%`, background: s.bg }}
        />
      ))}
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

function ScenarioComparator({ scenarios, pinnedPcts, revenda, onClear, onUnpin }) {
  const rows = pinnedPcts
    .map(p => scenarios.find(s => s.pct === p))
    .filter(Boolean)
  if (rows.length === 0) return null

  const showMargin = revenda > 0

  const marginPctFor = (row) => {
    if (!showMargin) return null
    const total = row.bid + row.commission + row.surety
    return ((revenda - total) / revenda) * 100
  }

  const items = [
    { key: 'bid', label: 'Arremate', fmt: (r) => brl(r.bid) },
    { key: 'upfront', label: 'Custo inicial', fmt: (r) => brl(r.upfront), strong: true },
    { key: 'installment', label: 'Parcela', fmt: (r) => brl(r.installment) },
  ]

  return (
    <section className="card p-5 sm:p-6 mt-5">
      <header className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-base font-semibold text-fg">
          Comparar cenários <span className="text-fg-muted font-normal">({rows.length}/3)</span>
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-fg-muted hover:text-fg transition-colors"
        >
          Limpar comparação
        </button>
      </header>

      {/* Desktop: 3 colunas alinhadas. Mobile: scroll horizontal com snap */}
      <div className="flex gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none -mx-2 md:mx-0 px-2 md:px-0">
        {rows.map((row) => (
          <article
            key={row.pct}
            className="flex-shrink-0 w-[260px] md:w-auto md:flex-1 snap-center rounded-xl border border-line p-4 relative"
            style={{
              background: `rgb(var(--tier-${row.tier}-bg))`,
              color: `rgb(var(--tier-${row.tier}-fg))`,
            }}
          >
            <button
              type="button"
              onClick={() => onUnpin(row.pct)}
              aria-label={`Remover cenário ${row.pct}% da comparação`}
              className="absolute top-2 right-2 w-6 h-6 rounded-md inline-flex items-center justify-center opacity-60 hover:opacity-100"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col gap-1.5 mb-3 pr-6">
              <span className="text-3xl font-bold tabular-nums leading-none">{row.pct}%</span>
              <span className="self-start"><ViabilityBadge tier={row.tier} /></span>
            </div>
            <dl className="space-y-1.5 text-sm">
              {items.map(it => (
                <div key={it.key} className="flex justify-between items-baseline gap-3">
                  <dt className="opacity-70 text-xs">{it.label}</dt>
                  <dd className={`tabular-nums text-right ${it.strong ? 'font-semibold' : ''}`}>{it.fmt(row)}</dd>
                </div>
              ))}
              {showMargin && (() => {
                const m = marginPctFor(row)
                return (
                  <div className="flex justify-between items-baseline gap-3 pt-1.5 border-t" style={{ borderColor: 'currentColor', opacity: 0.3 }}>
                    <dt className="opacity-100 text-xs font-medium" style={{ opacity: 1 }}>Margem</dt>
                    <dd className="tabular-nums text-right font-semibold">{m.toFixed(1)}%</dd>
                  </div>
                )
              })()}
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function ViabilityBadge({ tier }) {
  const label = TIER_LABELS[tier] || tier
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap"
      style={{
        background: `rgb(var(--tier-${tier}-bg))`,
        color: `rgb(var(--tier-${tier}-fg))`,
      }}
      title={`Faixa de viabilidade: ${label}`}
    >
      {label}
    </span>
  )
}

function ScheduleContent({ schedule, hasDate }) {
  if (!hasDate) {
    return (
      <p className="text-sm text-fg-muted">
        Informe a data do leilão em <span className="font-medium">"Adicionar detalhes do arremate"</span> para gerar o cronograma.
      </p>
    )
  }
  if (!schedule || schedule.length === 0) {
    return <p className="text-sm text-fg-muted">Sem parcelas para exibir.</p>
  }
  const todayISO = new Date().toISOString().slice(0, 10)
  const nextIdx = schedule.findIndex(p => p.dueDate >= todayISO)
  return (
    <div className="rounded-lg border border-line overflow-hidden">
      <table className="w-full text-sm tabular-nums">
        <thead className="bg-soft text-fg-muted text-[10px] uppercase tracking-[0.06em]">
          <tr>
            <th className="text-left px-3 py-2 w-10">#</th>
            <th className="text-left px-3 py-2">Vencimento</th>
            <th className="text-right px-3 py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((p, i) => {
            const isPast = p.dueDate < todayISO
            const isNext = i === nextIdx
            return (
              <tr
                key={p.index}
                className={`border-t border-line ${isPast ? 'opacity-60' : ''} ${isNext ? 'bg-soft' : ''}`}
              >
                <td className="px-3 py-2 text-fg-muted">{p.index}</td>
                <td className={`px-3 py-2 ${isNext ? 'font-medium text-fg' : 'text-fg'}`}>
                  {isNext && <Icon name="calendar" className="inline w-3 h-3 mr-1 -mt-0.5 text-accent" />}
                  {formatDateBR(p.dueDate)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{brl(p.value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
