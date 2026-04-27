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
**Status:** specced
**Depends on:** Phase 1

### Phase 3: polish-visual-e-comparador

**Goal:** Composição visual do custo inicial (gráfico), comparador de até 3 cenários lado a lado, tooltips de clareza, indicador de % do custo inicial sobre o arremate.

**Requirements:** R8
**Status:** specced
**Depends on:** Phase 1, Phase 2
