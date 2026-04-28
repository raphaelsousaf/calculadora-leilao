# Roadmap

## Milestone v1.1 — Calculadora de viabilidade pré-lance

Aproxima o app do fluxo de decisão real de leiloeiros: partir da avaliação, simular cenários, sinalizar viabilidade, comunicar com clareza.

### Phase 1: cenarios-e-carta-fianca

**Goal:** Adicionar carta de fiança como campo de primeira classe e introduzir o modo "Avaliação → Cenários" com matriz de descontos clicável; renomear "Total à vista" para "Custo inicial".

**Requirements:** R1, R2, R3, R4, R5
**Status:** planned
**Depends on:** —
**Plans:** 5 plans

Plans:
- [ ] 01-01-PLAN.md — Estender calc.js com suretyPct + scenarios.js (buildScenarioMatrix, 13 pcts, IDEAL_ZONE) + tokens CSS --zone-ideal-*
- [ ] 01-02-PLAN.md — Migration SQL `default_surety_pct` + estender data.js (fetchSettings/upsertSettings)
- [ ] 01-03-PLAN.md — SettingsModal: campo "Carta de fiança padrão (%)"
- [ ] 01-04-PLAN.md — pdf.js + whatsapp.js renomear "Total à vista" → "Custo inicial" + linha "Carta de fiança"; HistoryModal badge de modo
- [ ] 01-05-PLAN.md — App.jsx: toggle de modo + override de fiança + matriz responsiva click-to-select + finalizar renomeação

### Phase 2: viabilidade-e-cronograma

**Goal:** Indicador de viabilidade do cenário (faixa, margem vs. revenda esperada) + cronograma de parcelas com datas estimadas exportado em PDF e WhatsApp.

**Requirements:** R6, R7
**Status:** planned
**Depends on:** Phase 1
**Plans:** 6 plans

Plans:
- [ ] 02-01-PLAN.md — Migration 0002 (viability_t1/t2/t3) + schema.sql + data.js mapping
- [ ] 02-02-PLAN.md — Refactor scenarios.js (4 tiers + thresholds) + tokens CSS + atualização de testes
- [ ] 02-03-PLAN.md — schedule.js puro (buildSchedule + addDaysISO) + suite TDD
- [ ] 02-04-PLAN.md — SettingsModal: 3 inputs de threshold com validação 0<T1<T2<T3≤100
- [ ] 02-05-PLAN.md — pdf.js: linha de margem + seção cronograma; whatsapp.js: linha margem + resumo cronograma
- [ ] 02-06-PLAN.md — App.jsx: revenda no grid, intervalo no <details>, badge no Resumo, margem, cronograma desktop/mobile, coluna Margem %

### Phase 3: polish-visual-e-comparador

**Goal:** Composição visual do custo inicial (gráfico), comparador de até 3 cenários lado a lado, tooltips de clareza, indicador de % do custo inicial sobre o arremate.

**Requirements:** R8
**Status:** specced
**Depends on:** Phase 1, Phase 2
**Plans:** 4 plans

Plans:
- [ ] 03-01-PLAN.md — Tooltip primitives: tooltips.js (6 textos canônicos) + Tooltip.jsx acessível + Icon.jsx (info, pin)
- [ ] 03-02-PLAN.md — App.jsx hero-stat: CompositionBar inline + sublabel "% do arremate sai no dia" + coluna "% Arremate" na matriz + 6 ⓘ tooltips wired
- [ ] 03-03-PLAN.md — App.jsx comparador: pinned state (sessão) + fixar buttons + ScenarioComparator card responsivo + toast 3-limit + Limpar
- [ ] 03-04-PLAN.md — Checkpoint humano: visual + a11y + contraste WCAG AA + bundle ≤30KB + verificação de não-persistência
