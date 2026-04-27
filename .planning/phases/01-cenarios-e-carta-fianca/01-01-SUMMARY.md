---
phase: 01-cenarios-e-carta-fianca
plan: 01
subsystem: calc-core
tags: [calc, scenarios, css-tokens, tdd]
requires: []
provides:
  - "calculate() com suretyPct/surety"
  - "buildScenarioMatrix() + DEFAULT_SCENARIO_PCTS + IDEAL_ZONE"
  - "CSS tokens --zone-ideal-bg/fg (claro e escuro)"
affects: [src/lib/calc.js, src/lib/scenarios.js, src/index.css]
tech-stack:
  added: [vitest@^4]
  patterns: [pure-functions, matrix-factory]
key-files:
  created:
    - src/lib/calc.test.js
    - src/lib/scenarios.js
    - src/lib/scenarios.test.js
  modified:
    - src/lib/calc.js
    - src/index.css
    - package.json
decisions:
  - "Vitest escolhido como test runner (alinhado ao stack Vite existente)"
  - "Tokens da zona ideal usam paleta amber inicial — gate WCAG AA é Plan 05 Task 3"
metrics:
  duration: ~10min
  completed: 2026-04-27
requirements: [R1, R3]
---

# Phase 01 Plan 01: Núcleo de cálculo com fiança + matriz de cenários — Summary

Estende `calculate()` para incluir carta de fiança (`suretyPct` → `surety`, somado ao `upfront`), introduz `buildScenarioMatrix()` com os 13 percentuais locked do SPEC e adiciona tokens CSS `--zone-ideal-bg/fg` para destaque da faixa 70–85%. Toda a base numérica que os planos seguintes consomem.

## What Was Built

- **`calculate()` estendido** (`src/lib/calc.js`) — aceita `suretyPct` opcional, retorna `surety = bid * (sPct/100)` e `upfront = entry + commission + surety`. Backwards-compat: `suretyPct` undefined → `surety = 0`.
- **`buildScenarioMatrix()` + constantes** (`src/lib/scenarios.js`) — exporta `DEFAULT_SCENARIO_PCTS = [30,35,50,55,60,65,70,75,80,85,88,90,100]` (locked) e `IDEAL_ZONE = { min: 70, max: 85 }`. Mapeia cada `pct` chamando `calculate()` com `bid = appraisal * pct/100` e marca `isIdeal = pct in [70,85]`.
- **Tokens CSS da zona ideal** (`src/index.css`) — pares `--zone-ideal-bg/fg` em `:root` (amber-100/900) e `html.dark` (amber-950/300). Consumo via `rgb(var(--zone-ideal-bg))` será feito no Plan 05.
- **Vitest** instalado como devDependency com script `npm test`.

## Tests

- `src/lib/calc.test.js` — 5 testes, todos passing:
  - suretyPct=5 → surety=3050; upfront inclui surety
  - suretyPct=0 → surety=0
  - suretyPct undefined → surety=0 (backwards-compat)
  - **Caso canônico SPEC R3** (R$42.700, 5%, 1%, 30x): entry=10675, commission=2135, surety=427, upfront=13237, remaining=32025, installment=1067.5
  - suretyPct=10 → surety=6100 (acceptance criterion 1 do SPEC integralmente coberto: 0%, 5%, 10%)
- `src/lib/scenarios.test.js` — 6 testes, todos passing:
  - Ordem dos 13 pcts locked
  - `IDEAL_ZONE` exato
  - Matriz com 13 linhas
  - Linha pct=70 bate caso canônico R3
  - `isIdeal`: 30→false, 85→true, 88→false
  - `appraisal=0` retorna 13 linhas zeradas sem crash

## Commits

| Hash    | Message                                                              |
| ------- | -------------------------------------------------------------------- |
| 967355a | feat(01-01): estende calculate() com suretyPct e adiciona vitest      |
| 5ac3b83 | feat(01-01): adiciona buildScenarioMatrix e tokens de zona ideal      |
| ebcf44a | feat(01-01): adiciona tokens CSS --zone-ideal-bg/fg (claro e escuro)  |

## Deviations from Plan

None — plan executado exatamente como escrito. Vitest não estava instalado e foi adicionado conforme instrução explícita do plan (Task 1 `<action>`).

## Verification

- `npx vitest run src/lib/calc.test.js` → 5 passing
- `npx vitest run src/lib/scenarios.test.js` → 6 passing
- `npm run build` → ✓ built in 2.67s (sem erros)
- Acceptance criteria de todas as 3 tasks atendidos
- Caso canônico SPEC R3 validado em `calc.test.js` Test 4 e `scenarios.test.js` Test 4

## Notes for Downstream Plans

- **Plan 05 Task 3 item 8 (WCAG AA gate):** os valores amber dos tokens são iniciais. Se o checkpoint humano reprovar contraste em modo escuro, ajustar **NESTE plano** (`src/index.css`) e reexecutar — não criar workaround inline.
- `suretyPct` em `calculate()` aceita ausência (undefined → 0), portanto consumidores existentes não precisam de migração imediata.

## Self-Check: PASSED

- src/lib/calc.js — FOUND
- src/lib/calc.test.js — FOUND
- src/lib/scenarios.js — FOUND
- src/lib/scenarios.test.js — FOUND
- src/index.css — FOUND (tokens presentes em :root e html.dark)
- Commits 967355a, 5ac3b83, ebcf44a — FOUND in git log
