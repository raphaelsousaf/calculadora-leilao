# Phase 1: cenarios-e-carta-fianca - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar carta de fiança como campo de primeira classe no cálculo, introduzir o modo "Avaliação → Cenários" com matriz de descontos clicável (13 linhas: 30/35/50/55/60/65/70/75/80/85/88/90/100), e renomear "Total à vista" → "Custo inicial" em UI/PDF/WhatsApp.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements estão travados.** Ver `01-SPEC.md` para o conjunto completo de requisitos, boundaries e acceptance criteria.

Downstream agents (researcher, planner, executor) DEVEM ler `01-SPEC.md` antes de planejar ou implementar. Os requisitos não estão duplicados aqui.

**In scope (do SPEC.md):**
- Campo carta de fiança em `calc.js`, Settings e form principal (override)
- Toggle de modo "Arremate fixo" / "Simular por avaliação"
- Matriz de cenários renderizada com 13 linhas default
- Realce visual de "zona ideal" (70%–85%) na matriz
- Renomeação completa "Total à vista" → "Custo inicial" (UI + PDF + WhatsApp)
- Persistência do default de fiança em Supabase Settings
- Histórico salva o cálculo do cenário ativo

**Out of scope (do SPEC.md):**
- Indicador de viabilidade / margem / faixas verde-amarelo-vermelho — Fase 2
- Cronograma de parcelas com datas — Fase 2
- Comparador lado a lado — Fase 3
- Gráfico de composição — Fase 3
- Tooltips explicativos — Fase 3
- Customização das faixas de cenários — backlog
- Seguro garantia como alternativa — backlog
- Migração retroativa de cálculos antigos — não retroativo

**Note:** O default de carta de fiança foi alterado durante esta discussão de **5% → 1%**. SPEC.md, REQUIREMENTS.md e STATE.md atualizados em conjunto.

</spec_lock>

<decisions>
## Implementation Decisions

### Toggle de modo (D-01 a D-03)
- **D-01:** Apresentação do toggle = **segmented control** no topo do form (acima do input principal). Não usar tabs nem switch.
- **D-02:** Ao trocar de modo, **preservar todo o estado lateral** — `meta`, `commissionPct`, `installments`, `suretyPct`, e o que estiver em Settings. Só zera o input exclusivo do modo: `arremateStr` (modo fixo) ou `appraisalStr` (modo cenários).
- **D-03:** Modo escolhido **persiste entre sessões** via `localStorage` (chave `calc.lastMode`). Default na primeira visita: `'fixed'` (preserva comportamento atual para usuários existentes).

### Layout responsivo da matriz (D-04 a D-05)
- **D-04:** Desktop (≥768px) = tabela full-width com todas as 8 colunas. Permitir scroll horizontal mínimo se viewport ainda cortar.
- **D-05:** Mobile (<768px) = card-por-cenário empilhado verticalmente, cada card mostrando todos os campos do cenário (linha vira card). Breakpoint de troca: **`md`** (768px) do Tailwind.

### Persistência (D-06 a D-07)
- **D-06:** Estender o JSON `calc` salvo no Supabase com novos campos **nullable**, sem migration:
  - `mode: 'fixed' | 'scenarios'`
  - `appraisal?: number` (preenchido só em modo cenários)
  - `discountPct?: number` (% selecionado da matriz; preenchido só em modo cenários)
  - `suretyPct: number` (sempre preenchido após esta fase; default vem de Settings)
  - `surety: number` (valor calculado em R$)
  - Cálculos antigos lidos do banco assumem `mode='fixed'` e `surety=0` por convenção de leitura — **sem backfill**.
- **D-07:** `HistoryModal` mostra **badge** indicando o modo do cálculo salvo: "Cenários" (com %) ou "Arremate fixo". Posicionado no card de cada item do histórico.

### Form do override de fiança (D-08)
- **D-08:** Override de fiança fica no **grid principal de inputs**, não dentro do `<details>` "Adicionar detalhes do arremate". Layout do grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — 3 colunas (Comissão | Fiança | Parcelas) só em desktop largo (≥1024px); em tablet/mobile colapsa naturalmente. Sublabel do campo: "Use 0 se o edital não exigir."

### Realce da zona ideal (D-09)
- **D-09:** Fundo de linha amarelo/laranja claro para % entre 70 e 85 inclusive. **Tokens novos** dedicados (não reaproveitar `accent`/`soft` existentes): introduzir CSS variables `--zone-ideal-bg` e `--zone-ideal-fg` em `index.css` com pares para tema claro e escuro, ambos validados WCAG AA. Razão: isolar a paleta da zona ideal facilita ajustes futuros (Fase 2 introduzirá cores de viabilidade que reutilizarão padrão similar).

### Carta de fiança: comportamento (D-10)
- **D-10:** Always-on. Default global persistido em Settings = **1%** (escolha do usuário; valor inicial razoável para editais brasileiros). Override por cálculo aceita qualquer valor `0–100`. Valor `0` é tratado como "não usar carta" — coluna da matriz exibe `R$ 0,00`, não esconde a coluna. Sublabel do campo de input: "Use 0 se o edital não exigir."

### Renomeação "Total à vista" → "Custo inicial" (D-11)
- **D-11:** Substituição literal em todos os locais: `src/App.jsx` (hero-stat label e sublabel), `src/lib/pdf.js`, `src/lib/whatsapp.js`, `src/components/HistoryModal.jsx` se mencionar, e qualquer texto em modal "Salvar". Sublabel passa a ser **"Entrada + comissão + carta de fiança"** (não mais "Entrada 25% + comissão X%"). Verificar com `grep -ri "Total à vista" src/` no fim da fase.

### Claude's Discretion
- Forma exata do segmented control (componente próprio vs. composição inline com Tailwind) — fica para o planner.
- Estrutura interna do estado React (um `useReducer` central vs. múltiplos `useState`) — fica para o planner; pré-existente é múltiplos `useState` em `App.jsx`.
- Nome da função de cálculo da matriz (ex.: `calculateScenarios`, `buildScenarioMatrix`) — planner decide.
- Placeholder e helper text dos novos campos podem ser refinados na implementação se ficarem confusos.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/phases/01-cenarios-e-carta-fianca/01-SPEC.md` — Locked requirements, boundaries e acceptance criteria. **MUST read before planning.**

### Project-level
- `.planning/PROJECT.md` — Visão geral e stack
- `.planning/REQUIREMENTS.md` — Glossário de termos do domínio (arremate, avaliação, custo inicial, etc.) e requisitos não-funcionais (mobile-first ≥360px, pt-BR, modo escuro WCAG AA)
- `.planning/STATE.md` — Decisões travadas no nível do projeto (default de fiança 1%, faixas de matriz, zona ideal 70-85%)

### Codebase entry points (já scoutado)
- `src/lib/calc.js` — Função pura `calculate()` que precisa ser estendida com `suretyPct` e voltar `surety`
- `src/App.jsx` — UI principal; é onde o toggle, o modo cenários e a matriz vão entrar
- `src/components/SettingsModal.jsx` — Adicionar campo "Carta de fiança padrão (%)"
- `src/lib/data.js` — Wrappers Supabase (`insertCalculation`, `fetchSettings`, `upsertSettings`); cálculo é salvo como JSON, então campos novos não exigem migration
- `src/lib/pdf.js` e `src/lib/whatsapp.js` — Pontos da renomeação e da nova linha "Carta de fiança"
- `src/lib/format.js` — `parseBRL`, `formatBRLInput`, `brl`, `pct` — reutilizar para o input de avaliação e formatação da matriz
- `src/components/HistoryModal.jsx` — Adicionar badge de modo no card de histórico

### Reference (origem do problema)
- Planilha "Calculadora De Viabilidade" (compartilhada pelo usuário em conversa, 2026-04-27) — define as 13 % de desconto, ordem das colunas e zona ideal 70-85%

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`calculate()` em `src/lib/calc.js`** — função pura, sem efeito colateral. Estender adicionando parâmetro `suretyPct` é trivial; preserva backwards-compat se default for `0`.
- **`formatBRLInput` / `parseBRL` em `src/lib/format.js`** — já lidam com input mascarado em BRL; reutilizar tanto para `arremateStr` quanto para o novo `appraisalStr`.
- **`<details>` pattern em `App.jsx`** — usado para "Adicionar detalhes do arremate"; pode ser reutilizado se algum sub-bloco da matriz precisar colapsar (ex.: detalhes do cenário ativo no mobile).
- **`Modal` em `src/components/Modal.jsx`** — usado em Save/Settings/WhatsApp/History; provê padrão consistente para qualquer novo modal nesta fase (não previsto, mas disponível).
- **CSS classes utilitárias** já no app: `card`, `input`, `btn-primary`, `btn-accent`, `btn-ghost`, `hero-stat`, `mini-stat`, `stat`, `divider` — reutilizar; não criar variantes novas a menos que necessário.

### Established Patterns
- Estado local com múltiplos `useState` em `Calculator` (App.jsx). **Manter padrão**; não introduzir Redux/Zustand nesta fase.
- Cálculos derivam via `useMemo` a partir de inputs → seguir o mesmo padrão para `scenarios = useMemo(() => buildMatrix(...), [appraisal, commissionPct, suretyPct, installments])`.
- Persistência: `calc` é salvo como JSON serializado em uma coluna do Supabase; estender campos é seguro (sem ALTER TABLE).
- Tema escuro via CSS variables `rgb(var(--…))` — paleta da zona ideal **deve seguir esse padrão**, não hardcodar hex.

### Integration Points
- Toggle de modo entra **no topo do `<section className="card p-5 sm:p-7 space-y-6">`** dos inputs (App.jsx ~linha 175), antes do label "Valor de arremate".
- Matriz substitui o input de arremate quando modo = `'scenarios'`. Painel "Resumo" lateral continua igual nos dois modos — populado pelo `calc` ativo.
- Settings modal: novo campo entra perto dos atuais (nome/contato); precisa de prop de save handler já existente (`handleSaveSettings`).
- Schema Supabase de `calculations`: NÃO requer migration (JSON estendido).

### Constraints from Existing Code
- App é mobile-first (≥360px declarado em REQUIREMENTS.md N1); matriz precisa funcionar nesse viewport — daí a decisão de card empilhado em mobile.
- Modo escuro existe e é toggle pelo header (`useTheme`). Tokens novos `--zone-ideal-*` precisam de pares para ambos os temas.
- pt-BR único — todo texto novo em português.

</code_context>

<specifics>
## Specific Ideas

- **Caso de teste numérico canônico** (do SPEC R3 atualizado): avaliação=R$61.000, comissão=5%, fiança=1%, 30x → linha 70% deve produzir Arrematação=R$42.700,00, Entrada=R$10.675,00, Saldo=R$32.025,00, Comissão=R$2.135,00, Fiança=R$427,00, Custo inicial=R$13.237,00, Parcela=R$1.067,50. **Esses valores são o ground-truth do verifier.**
- **Ordem das colunas da matriz** (locked): `% | Arrematação | Entrada | Saldo | Comissão | Carta fiança | Custo inicial | Parcela` — espelha planilha de referência.
- **13 percentuais default** (locked): 30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100. Não são configuráveis pelo usuário nesta fase.
- **Sublabel do campo de fiança**: "Use 0 se o edital não exigir." — texto canônico, evitar variações.

</specifics>

<deferred>
## Deferred Ideas

- **Customização das % da matriz pelo usuário** — backlog. Defaults fixos atendem 95% dos casos.
- **Seguro garantia como alternativa à carta de fiança** — backlog. Single mecanismo nesta fase.
- **Migração retroativa de cálculos antigos no histórico** — explicitamente fora; cálculos antigos exibem `surety=R$0,00` por convenção de leitura.
- **Indicador de viabilidade / faixas verde-amarelo-vermelho** — Fase 2.
- **Margem potencial via valor de revenda** — Fase 2.
- **Cronograma de parcelas com datas** — Fase 2.
- **Comparador lado a lado de cenários fixados** — Fase 3.
- **Gráfico de composição do custo inicial** — Fase 3.
- **Tooltips explicativos nos labels técnicos** — Fase 3.
- **% do custo inicial sobre o arremate** como sublabel — Fase 3.
- **Faixas de "zona ideal" customizáveis em Settings** — backlog (pode entrar em Fase 2 junto com thresholds de viabilidade).

</deferred>

---

*Phase: 01-cenarios-e-carta-fianca*
*Context gathered: 2026-04-27*
