# Phase 1: cenarios-e-carta-fianca - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 01-cenarios-e-carta-fianca
**Areas discussed:** Toggle de modo, Layout da matriz no mobile, Persistência no Supabase, Override de fiança no form, Realce da zona ideal, Comportamento da carta de fiança

---

## Toggle de modo

| Option | Description | Selected |
|--------|-------------|----------|
| Segmented control + preservar tudo | Locked default — segmented control no topo do form, preserva meta/comissão/parcelas/fiança ao trocar | ✓ |
| Tabs | Tabs no topo | |
| Switch | Switch binário | |

**Sub-question — persistência do modo entre sessões:**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) localStorage lembra último modo | `calc.lastMode` persistido | ✓ |
| (b) sempre abre em "Arremate fixo" | Comportamento atual |  |

**User's choice:** A1=A → localStorage
**Notes:** Default na primeira visita = `'fixed'` para não quebrar usuários existentes.

---

## Layout da matriz no mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Tabela full + scroll horizontal | Mantém todas as 8 colunas | desktop |
| Card-por-cenário empilhado | Cada % vira card vertical com todos os campos | mobile ✓ |
| Tabela reduzida + expand-on-tap | 3 colunas + ver mais |  |

**Sub-question — breakpoint de troca:**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) sm (640px) | Troca já em telefones grandes em landscape |  |
| (b) md (768px) | Tablets em retrato ainda usam tabela | ✓ |

**User's choice:** A2=B → md (768px)

---

## Persistência no Supabase

| Option | Description | Selected |
|--------|-------------|----------|
| Estender JSON `calc` com campos nullable | Sem migration; backwards-compat | ✓ |
| Coluna nova dedicada | Migration |  |
| Salvar só arremate final | Perde rastreabilidade |  |

**Sub-question — badge de modo no HistoryModal:**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) sim, badge "Cenários" / "Arremate fixo" | Ajuda quando histórico crescer | ✓ |
| (b) não, igual ao atual | |  |

**User's choice:** A3=A → badge no histórico

---

## Override de fiança no form

| Option | Description | Selected |
|--------|-------------|----------|
| Grid principal (não dentro de `<details>`) | Fiança compõe Custo inicial, precisa ficar visível | ✓ |
| Dentro de "Adicionar detalhes" | Esconde por padrão |  |

**Sub-question — layout do grid com 3 inputs (Comissão / Fiança / Parcelas):**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) `sm:grid-cols-3` | 3 colunas já em mobile médio — fica apertado |  |
| (b) `sm:grid-cols-2` + Fiança full-width abaixo | 2+1 |  |
| (c) `lg:grid-cols-3` | 3 col só em desktop largo, 1 ou 2 antes | ✓ |

**User's choice:** A4=C → `lg:grid-cols-3`

---

## Realce da zona ideal (70-85%)

| Option | Description | Selected |
|--------|-------------|----------|
| Fundo amarelo/laranja claro | Espelha planilha | ✓ |
| Borda lateral colorida | Mais sutil |  |
| Badge inline na coluna % | Texto |  |

**Sub-question — tokens de cor:**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) reutilizar `accent` / `soft` | Não cria paleta nova |  |
| (b) tokens novos `--zone-ideal-bg` / `--zone-ideal-fg` | Isola, fácil ajustar | ✓ |

**User's choice:** A5=B → tokens novos
**Notes:** Padrão dos tokens novos será reutilizado na Fase 2 para cores de viabilidade.

---

## Comportamento da carta de fiança

| Option | Description | Selected |
|--------|-------------|----------|
| Always-on (default 5%) | Recomendação inicial | substituído |
| Opt-in por cálculo | Usuário ativa quando edital exige |  |
| **Always-on, default 1%, configurável, valor 0 desativa** | Decisão final do usuário | ✓ |

**User's choice:** A6 → always-on, default **1%** (não 5% como sugerido), 0 funciona como "não usar"
**Notes:** SPEC.md, REQUIREMENTS.md e STATE.md atualizados em conjunto para refletir o default 1%. Caso de teste do SPEC R3 também recalculado.

---

## Claude's Discretion

- Forma exata do segmented control (componente próprio vs. inline)
- Estrutura interna do estado React (manter `useState` múltiplos do padrão atual)
- Nome da função `calculateScenarios` / `buildScenarioMatrix`
- Refinamento de placeholder/helper text durante implementação

## Deferred Ideas

- Customização das 13 % da matriz pelo usuário — backlog
- Seguro garantia como alternativa à carta de fiança — backlog
- Migração retroativa de cálculos antigos — não retroativo
- Faixas de "zona ideal" customizáveis em Settings — backlog (talvez Fase 2)
