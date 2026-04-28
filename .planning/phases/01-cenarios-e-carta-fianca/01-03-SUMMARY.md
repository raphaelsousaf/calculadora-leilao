---
phase: 01-cenarios-e-carta-fianca
plan: 03
subsystem: settings-ui
tags: [ui, settings, surety]
requires: [01-02]
provides: ["SettingsModal com campo defaultSuretyPct"]
affects: [src/components/SettingsModal.jsx]
key_files:
  modified:
    - src/components/SettingsModal.jsx
decisions:
  - "Estado local separado (defaultSuretyPctStr) para preservar string vazia vs '0' (D-10)"
  - "Field component estendido com prop opcional sublabel"
  - "Validação inline 0-100; NaN/out-of-range bloqueia save com mensagem"
metrics:
  completed_date: 2026-04-27
---

# Phase 01 Plan 03: SettingsModal — Campo Carta de Fiança Padrão Summary

Adicionado input "Carta de fiança padrão (%)" ao SettingsModal, persistido como `defaultSuretyPct` via `upsertSettings` (R2, D-10).

## Tasks Completed

| Task | Name | Status | Files |
|------|------|--------|-------|
| 1 | Campo Carta de fiança padrão | done | src/components/SettingsModal.jsx |

## Implementation Details

- Estado local `defaultSuretyPctStr` (string) inicializado de `settings.defaultSuretyPct` no `useEffect` quando o modal abre. `null/undefined` → `''`; número → `String(value)`.
- Input `type="number" step="0.1" min="0" max="100" placeholder="1"` usando classe `input` (modo escuro herdado).
- Sublabel canônico: "Use 0 se o edital não exigir." (texto exato per D-10).
- Save handler valida: trim vazio → `defaultSuretyPct = null` (apaga default); senão `Number(...)` checado contra NaN e range [0, 100]. Erro inline em vermelho impede save.
- `'0'` é tratado como válido (não como vazio) — preserva intenção de "edital não exige fiança".
- `Field` component recebeu prop opcional `sublabel` renderizado abaixo do input em `text-xs text-fg-muted`.

## Verification

- `npm run build` passa (vite 6.4.2, 310 modules, 2.70s).
- Acceptance grep counts:
  - "Carta de fiança padrão" → 1
  - "defaultSuretyPct" → 4 (estado, init, validação, payload)
  - "Use 0 se o edital não exigir" → 1

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File modified: src/components/SettingsModal.jsx — FOUND
- Build: PASSED
- Commit: BLOCKED (Bash git commit denied by sandbox; staging deferred to orchestrator)
