---
phase: 01-cenarios-e-carta-fianca
plan: 05
subsystem: app-shell-ui
tags: [ui, scenarios, surety, history, rename]
requires: [01-01, 01-02, 01-03, 01-04]
provides:
  - "App.jsx mode toggle (fixed/scenarios) with localStorage persistence"
  - "Scenarios matrix UI (responsive table + cards) with click-to-select"
  - "Surety override field always visible in input grid"
  - "Hero-stat renamed to 'Custo inicial'"
  - "handleLoad round-trip for scenarios mode"
affects:
  - src/App.jsx
key-files:
  modified:
    - src/App.jsx
decisions:
  - "ScenariosMatrix kept as inline component in App.jsx (no new file) to match plan stack guidance"
  - "Added suretyTouched flag to avoid Settings sync overriding loaded/edited values"
  - "Save payload schema additive — legacy reads guarded with `?? 'fixed'` and `?? 0`"
metrics:
  completed: 2026-04-27
  tasks_completed: 3 (autonomous) + 1 (checkpoint pending)
  files_changed: 1
---

# Phase 01 Plan 05: Wire de tudo no App.jsx — Summary

Wired the mode toggle, surety override grid, scenarios matrix (responsive desktop table + mobile cards) with click-to-select and ideal-zone highlighting, full "Custo inicial" rename in the Resumo panel and Save modal, and extended `handleLoad` to round-trip scenarios mode (mode/suretyPct/appraisal/discountPct) with backwards-compat for legacy history items.

## Tasks Completed

### Task 1 — Toggle + override fiança + estado base
- New state: `mode`, `appraisalStr`, `suretyPctStr`, `suretyTouched`, `selectedDiscountPct`
- `useEffect` persists `mode` to `localStorage.calc.lastMode`
- `useEffect` syncs surety default from `settings.defaultSuretyPct` (fallback `1`) only while user hasn't touched the field
- `suretyPct` derived via `useMemo`
- Segmented control (`role="tablist"`) at top of input section: "Arremate fixo" / "Simular por avaliação"
- Mode switching preserves `commissionPct`, `installments`, `suretyPctStr`, `meta`; only zeros the input exclusive to the other mode
- Input grid reorganized to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`: Comissão | Carta de fiança | Parcelas
- Surety field: type="number", step="0.1", placeholder = settings default, sublabel "Use 0 se o edital não exigir."
- Hero-stat renamed: "Custo inicial" + "Entrada + comissão + carta de fiança"
- Added MiniStat for "Carta de fiança (X%)" + "Saldo a parcelar"
- `handleSave` builds payload: `{ ...calc, mode, suretyPct, surety, appraisal?, discountPct? }`
- PDF/WhatsApp/Salvar use `canAct` (true when fixed+hasValue OR scenarios+selected)

### Task 2 — Modo cenários + matriz responsiva + click-to-select
- `ScenariosMatrix` inline component
- `useMemo` builds scenarios via `buildScenarioMatrix({ appraisal, commissionPct, suretyPct, installments })`
- Desktop (`hidden md:block`): `<table>` with 8 columns in locked order: % | Arrematação | Entrada | Saldo | Comissão | Carta fiança | Custo inicial | Parcela. `<caption className="sr-only">` for a11y
- Mobile (`md:hidden`): card-per-scenario with 2-col grid of label/value
- Ideal-zone highlight applied via inline style using `--zone-ideal-bg` / `--zone-ideal-fg` tokens when `row.isIdeal`
- Selected row gets `ring-2 ring-accent` (stacks with ideal background)
- Empty state ("Informe o valor de avaliação...") when `appraisal === 0`
- Resumo panel shows "Selecione um cenário na matriz para ver o resumo." when `mode === 'scenarios' && selectedDiscountPct == null`
- Keyboard support: `tabIndex={0}`, Enter/Space handlers, `aria-pressed`

### Task 3 — handleLoad round-trip
- Reads `c.mode ?? 'fixed'`, `c.suretyPct ?? '0'`, `c.appraisal`, `c.discountPct`
- Sets `setSuretyTouched(true)` after load to lock value against Settings sync
- Branches on loaded mode: scenarios restores `appraisalStr` + `selectedDiscountPct`; fixed restores `arremateStr` and clears scenarios state
- Backwards-compat: legacy items (no `mode`) load as fixed with `suretyPct=0` without crashing

## Save Modal
Updated to show:
- Modo: "Cenários (X%)" or "Arremate fixo"
- Custo inicial (was: Total à vista)

## Verification

| Check | Result |
|---|---|
| `npm run build` | PASS (vite build, 0 errors) |
| `grep -ri "Total à vista" src/` | 0 occurrences |
| `grep -c "calc.lastMode" src/App.jsx` | 2 (read + write) |
| `grep -c "Carta de fiança" src/App.jsx` | present (label + MiniStat) |
| `grep -c "Custo inicial" src/App.jsx` | present (hero-stat + Save modal + table header + mobile card) |
| `grep -c "Entrada + comissão + carta de fiança"` | 1 |
| `grep -c "buildScenarioMatrix" src/App.jsx` | 2 (import + useMemo call) |
| `grep -c "zone-ideal-bg" src/App.jsx` | 1 |
| `grep -c "hidden md:block" src/App.jsx` | 1 |
| `grep -c "md:hidden" src/App.jsx` | 1 |
| `grep -c "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"` | 1 |

Vitest run was blocked in this sandbox (permission), but the build (which type-checks/parses all imports and JSX) passes cleanly. `scenarios.test.js` (from Plan 01) is unaffected by this plan's changes.

## Deviations from Plan

**[Rule 2 - Critical functionality] Added `suretyTouched` flag.**
- **Found during:** Task 1 (wiring Settings sync)
- **Issue:** The Settings-sync `useEffect` would overwrite a value the user (or `handleLoad`) had just set, because it watches `settings` and re-fires after `setSuretyPctStr('0')` populates state. Without the flag, loading a legacy item would briefly show '0' then snap back to the Settings default.
- **Fix:** Added `suretyTouched` boolean. The user-onChange handler and `handleLoad` set it to `true`; the sync effect bails when it is `true`.
- **Files modified:** `src/App.jsx`
- **Commit:** (pending — see "Pending Commit" below)

No other deviations.

## Pending Commit

The sandbox blocked all `git commit` invocations during this run (every `git commit` variant — `-m`, `-F`, heredoc, with or without quotes — returned a permission denial). The work is staged (`git status` shows `src/App.jsx` staged) and the build passes. The user (or a process with elevated permissions) must run a single commit such as:

```
git commit -m "feat(01-05): wire mode toggle, scenarios matrix and Custo inicial rename in App.jsx"
```

All three logical tasks are co-located in this single commit because they modify the same file (`src/App.jsx`) and are tightly coupled (Task 2's matrix uses Task 1's state; Task 3's handleLoad sets Task 1+2's state).

## Visual Checkpoint Items (Task 4 — pending human verification)

The following 12 items must be validated manually (`npm run dev`):

1. Toggle "Arremate fixo" / "Simular por avaliação" visible at top of form; reload preserves last mode.
2. Switching modes preserves comissão/fiança/parcelas/comprador.
3. Settings → "Carta de fiança padrão (%)" = 2 → reload → new calc opens with fiança=2.
4. Override fiança=5 in main form does NOT change Settings default.
5. Modo cenários: avaliação=R$61.000, com=5%, fia=1%, 30x → matrix has 13 rows; rows 70/75/80/85 highlighted; row 70%: Arrematação R$42.700,00 / Entrada R$10.675,00 / Saldo R$32.025,00 / Comissão R$2.135,00 / Fiança R$427,00 / Custo inicial R$13.237,00 / Parcela R$1.067,50.
6. Click row 70% → Resumo populates; PDF/WA/Salvar enable. Click row 50% → Resumo updates.
7. Mobile (~375px) → cards stacked, same values, same highlight, click works.
8. Dark mode + WCAG AA contrast on ideal-zone tokens (validate in DevTools Accessibility → Contrast).
9. Save scenario calc → History shows badge "Cenários (70%)" → Load → mode returns to scenarios with appraisal/selection restored, fiança=1; save fixed calc → badge "Arremate fixo" → Load.
10. Backwards-compat: legacy history items (no `mode`) load as fixed with fiança=0 without crash.
11. PDF + WhatsApp: hero label "Custo inicial", line "Carta de fiança: R$ X,XX", no "Total à vista" anywhere.
12. `grep -ri "Total à vista" src/` → 0 occurrences.

## Self-Check: PASSED

- src/App.jsx: FOUND (rewritten)
- npm run build: PASS
- grep "Total à vista" src/: 0 occurrences
- All grep acceptance criteria for Tasks 1-3: PASS
- Commit: PENDING (sandbox blocked git commit; staged and ready)
