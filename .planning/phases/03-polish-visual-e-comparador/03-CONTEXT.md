# Phase 3: polish-visual-e-comparador - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish visual da calculadora: composição visual do custo inicial via stacked bar horizontal, comparador de até 3 cenários fixados (lado a lado em desktop, scroll horizontal em mobile), tooltips acessíveis em 6 labels técnicos, e indicador de % do custo inicial sobre o arremate (sublabel no Resumo + coluna na matriz).

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**4 requirements estão travados.** Ver `03-SPEC.md` para o conjunto completo (R8 + 14 acceptance criteria).

Downstream agents DEVEM ler `03-SPEC.md` antes de planejar/implementar.

**In scope (do SPEC.md):**
- Gráfico de composição do custo inicial (3 segmentos rotulados)
- Comparador limitado a 3 slots, com botão fixar/desfixar e "Limpar"
- Tooltips em 6 labels (Comissão, Carta de fiança, Custo inicial, Saldo a parcelar, Entrada, Margem)
- Indicador "% do arremate sai no dia" no Resumo e na matriz
- Arquivo central de textos de tooltips (`src/lib/tooltips.js`)
- Compatibilidade com modo escuro e mobile

**Out of scope (do SPEC.md, confirmado):**
- Mais de 3 cenários no comparador
- Customização do gráfico pelo usuário
- Tooltips em todos os labels (só os 6 técnicos)
- Animações elaboradas
- Exportação do comparador em PDF/WhatsApp — backlog
- i18n dos tooltips
- Tour guiado / onboarding

</spec_lock>

<decisions>
## Implementation Decisions

### Gráfico de composição (D-28 a D-29)
- **D-28:** Tipo: **stacked bar horizontal** (não donut). Renderização SVG inline ou divs com `width: %`. Bundle ≈0KB extra. Três segmentos coloridos: Entrada / Comissão / Carta de fiança. Cada segmento clicável/hoverable mostra valor + % sobre custo inicial.
- **D-29:** Posição: **inline dentro do hero-stat "Custo inicial"**, abaixo do valor monetário e antes do sublabel "Entrada + comissão + carta de fiança". Altura ~10px, full-width do hero-stat. Cores derivadas de tokens existentes — proposta inicial:
  - Entrada → `--fg` (cor mais densa, item dominante)
  - Comissão → `--accent` (azul/diferenciado)
  - Carta de fiança → `--fg-muted` (suave, terceiro elemento)
  Valores numéricos opcionalmente aparecem em tooltip ao hover/tap em cada segmento.

### Comparador de cenários (D-30 a D-33)
- **D-30:** **Botão "fixar" (📌 ou ícone bookmark) em cada linha da matriz** (desktop e mobile). Estado de fixados é local à sessão (NÃO persiste). Acessível por teclado.
- **D-31:** Comparador aparece como **card novo abaixo da matriz** quando há ≥1 cenário fixado. Título "Comparar cenários (N/3)" + botão "Limpar comparação" no canto direito.
- **D-32:** Layout do comparador:
  - **Desktop (`md:` ≥768)**: 3 colunas alinhadas com headers `Arremate | Custo inicial | Parcela | Margem % | Badge` (linhas).
  - **Mobile (<768px)**: cards lado a lado com **scroll horizontal** (overflow-x-auto). Cada card mostra todos os campos. Snap natural via `snap-x snap-mandatory` opcional para experiência polida.
- **D-33:** Limite hard de 3 cenários: tentativa de fixar 4º → **toast "Máximo 3 cenários — desfixe um primeiro"** e **NÃO substitui** automaticamente (decisão do usuário). Botão "Limpar" zera a lista.

### Tooltips acessíveis (D-34 a D-37)
- **D-34:** **Custom React component** (`<Tooltip>` em `src/components/Tooltip.jsx`) — sem libs externas. Padrão do `UserMenu` já estabelecido (state local + click-outside + ESC + foco).
- **D-35:** Comportamento:
  - **Desktop**: hover abre, mouseleave fecha (debounce ~100ms para evitar flicker)
  - **Mobile**: tap toggle (não hover)
  - **Teclado**: focus + Enter abre, ESC fecha; `aria-describedby` no label apontando para o id do tooltip
  - **Fecha**: click outside, ESC, ou ao desfocar
- **D-36:** **Posicionamento**: tooltip sempre acima do ícone ⓘ por default; auto-flip para baixo se não couber (calcular via `getBoundingClientRect`). Width fixo `max-w-xs` (~20rem), texto wrap normal. Z-index alto (z-50).
- **D-37:** **Textos centralizados** em `src/lib/tooltips.js`:
  ```js
  export const TOOLTIPS = {
    commission: 'Percentual cobrado pelo leiloeiro sobre o valor do arremate, pago no dia.',
    surety: 'Garantia bancária do saldo a parcelar (75% do arremate). Use 0 se o edital não exigir.',
    upfront: 'Soma de entrada (25%) + comissão + carta de fiança. É o que sai no dia do leilão.',
    remaining: 'Saldo do arremate (75%) que será dividido nas parcelas mensais.',
    entry: 'Pagamento à vista equivalente a 25% do valor do arremate, devido no dia do leilão.',
    margin: 'Diferença entre o valor de revenda esperado e o total efetivo pago (arremate + comissão + fiança).',
  }
  ```
  Cada texto ≤140 chars. Aplicação: ícone ⓘ ao lado de 6 labels (Resumo + matriz headers).

### Indicador % do arremate (D-38)
- **D-38:** Aparece em **dois lugares**:
  - **(a)** Sublabel adicional no hero-stat do Resumo: nova linha após "Entrada + comissão + carta de fiança", formato `(35,0% do arremate sai no dia)`. Estilo discreto (text-fg-muted text-[11px]).
  - **(b)** Coluna nova **"% Arremate"** na matriz desktop (após "Custo inicial", antes de "Parcela"). Cards mobile ganham linha "% do arremate". Cálculo: `pct = upfront / bid × 100`. Fica 1ª se `upfront > bid` (caso edge — não realista mas defensivo).

### Posicionamento ⓘ nos labels (D-39)
- **D-39:** Ícone ⓘ (Icon name="info" — adicionar ao Icon.jsx se não existir) **à direita do label**, com `gap-1`. Tamanho `w-3.5 h-3.5`, cor `text-fg-subtle hover:text-fg-muted`. Trigger é o ícone (não o label inteiro), para não bloquear interação do input quando o label tem `htmlFor`.

### Persistência e estado (D-40)
- **D-40:** Comparador é **estado de sessão apenas** — `useState([])` no Calculator, NÃO persiste no Supabase nem no localStorage. Após reload, lista vazia. SPEC pede explicitamente isso (acceptance #14).

### Claude's Discretion
- Forma exata do ícone "fixar" (📌 emoji, bookmark Lucide, pin SVG custom) — planner decide
- Cores do gráfico podem ser ajustadas se contraste WCAG AA não bater na implementação
- `<Tooltip>` pode usar Portal (createPortal) se z-index dentro do hero-stat criar problema — fica a critério
- Wording dos textos de tooltips pode ser refinado durante implementação se ficar verboso

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/phases/03-polish-visual-e-comparador/03-SPEC.md` — Locked requirements + 14 acceptance criteria. **MUST read before planning.**

### Project-level
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

### Fases anteriores (consumidas por Fase 3)
- `.planning/phases/01-cenarios-e-carta-fianca/01-CONTEXT.md` — D-01..D-11 (toggle, matriz, tokens)
- `.planning/phases/02-viabilidade-e-cronograma/02-CONTEXT.md` — D-12..D-27 (tiers, badges, margem, cronograma)

### Codebase entry points
- `src/App.jsx` — Calculator component principal; vai receber comparador, tooltips wrappers, gráfico no hero-stat
- `src/lib/scenarios.js` — `tierFor`, `TIER_LABELS`, `buildScenarioMatrix` (já existem)
- `src/lib/calc.js` — `calculate()` retorna upfront/bid; cálculo de "% do arremate" é derivação simples
- `src/components/Icon.jsx` — adicionar ícone "info" e "pin"/"bookmark" se necessário
- `src/components/UserMenu` (referência) — pattern de state + click-outside + ESC para tooltip
- `src/index.css` — possíveis tokens novos para cores do gráfico (ou usar existentes)

### Novos arquivos previstos
- `src/components/Tooltip.jsx` — componente acessível
- `src/components/CompositionBar.jsx` (opcional, pode ser inline no App.jsx) — stacked bar
- `src/components/ScenarioComparator.jsx` (opcional, pode ser inline) — card do comparador
- `src/lib/tooltips.js` — textos centralizados

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Pattern do `UserMenu`** (`src/App.jsx`) — base sólida para Tooltip: useState + useRef + useEffect com mousedown/keydown. Replicar com adaptações.
- **Tokens `--tier-*-bg/fg`** — disponíveis para badges no comparador (já mostram tier).
- **`brl()`, `pct()` em format.js** — reutilizar para todos os valores do gráfico, comparador, tooltips.
- **`MiniStat` component** já no App.jsx — padrão visual consistente para o comparador.
- **Classes utilitárias** existentes: `card`, `divider`, `bg-soft`, `text-fg-muted` — reutilizar.

### Established Patterns
- Estado local com `useState` múltiplos
- Click-outside via `useEffect` + `mousedown` listener
- ESC handler global enquanto `open === true`
- Modo escuro via `rgb(var(--…))`

### Integration Points
- Hero-stat do Resumo (`<div className="hero-stat">`): adicionar `<CompositionBar>` entre o valor e o sublabel
- Matriz `<ScenariosMatrix>`: adicionar coluna de % arremate (entre "Custo inicial" e "Parcela") + botão fixar (à esquerda do %, ou nova última coluna)
- Logo abaixo da matriz no `<section>` de inputs: card do comparador (condicional `if pinned.length > 0`)
- 6 labels para receber ⓘ:
  - Comissão (grid principal)
  - Carta fiança (grid principal)
  - Custo inicial (Resumo + headers da matriz)
  - Saldo a parcelar (matriz header "Saldo")
  - Entrada (Resumo MiniStat + matriz header)
  - Margem (Resumo sublabel + matriz header "Margem %")

### Constraints
- Bundle ≤30KB de aumento total (do SPEC). Confirma: zero libs novas para tooltips/gráfico = OK
- Tooltips precisam navegar por teclado e leitor de tela (NVDA/VoiceOver)
- Comparador no mobile ≥360px com scroll horizontal
- Estado do comparador NÃO persiste (verificável por reload)

</code_context>

<specifics>
## Specific Ideas

- **Caso de teste numérico (estende canônicos)**: avaliação=R$61.000, com=5%, fia=1%, 30x → linha 70% (arremate=R$42.700, custo inicial=R$13.130,25):
  - **% do arremate sai no dia** = 13.130,25 / 42.700 × 100 ≈ **30,75%**
  - Sublabel exato: `(30,8% do arremate sai no dia)` (1 casa decimal)
  - Composição: Entrada R$10.675 = 81,3% / Comissão R$2.135 = 16,3% / Fiança R$320,25 = 2,4% (do custo inicial)
- **3 cenários fixados (exemplo)**: 65% (Excelente), 70% (Excelente/Bom borderline), 80% (Bom) — visualizar lado a lado o trade-off de custo inicial vs. parcela vs. badge
- **Texto canônico do toast de limite**: `"Máximo 3 cenários — desfixe um primeiro"`
- **Texto do botão limpar**: `"Limpar comparação"` (não "Limpar tudo")
- **Hover delay** dos tooltips: 200ms abrir, 100ms fechar (evita flicker em movimentos rápidos)

</specifics>

<deferred>
## Deferred Ideas

- **Comparador em PDF/WhatsApp** — backlog (apenas in-app nesta fase)
- **Tour guiado / onboarding** — backlog
- **i18n dos tooltips** — pt-BR único nesta fase
- **Customização visual do gráfico** — fixo (cores, tipo, posição)
- **Animações elaboradas** — só transições suaves padrão
- **Mais de 3 slots no comparador** — fixo em 3
- **Tooltips em todos os labels** — só os 6 técnicos
- **Drag-and-drop para reordenar comparador** — backlog (ordem é ordem de fixar)
- **Persistência do comparador** — explicitamente fora (estado de sessão)

</deferred>

---

*Phase: 03-polish-visual-e-comparador*
*Context gathered: 2026-04-27*
