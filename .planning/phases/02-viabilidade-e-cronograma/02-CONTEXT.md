# Phase 2: viabilidade-e-cronograma - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Transformar a calculadora em assessor de decisão: badge de viabilidade (4 faixas configuráveis) no painel Resumo e na matriz, campo de valor de revenda esperado com cálculo de margem bruta, e cronograma de parcelas com datas estimadas integrado ao PDF e WhatsApp.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**4 requirements estão travados.** Ver `02-SPEC.md` para o conjunto completo.

Downstream agents DEVEM ler `02-SPEC.md` antes de planejar/implementar.

**Correção locked durante a discussão (bug do SPEC):**
- A fórmula original de margem (`revenda − arremate − custo inicial − soma parcelas`) contava o saldo duas vezes
- Fórmula correta locked: **`margem bruta = revenda − (arremate + comissão + carta de fiança)`**
- Equivalentemente: `margem = revenda − total_pago_efetivo`, onde `total_pago_efetivo = bid + commission + surety` (entry + remaining + commission + surety)
- SPEC R2 será atualizado em commit conjunto

**In scope (do SPEC.md):**
- Badges de viabilidade (4 faixas configuráveis) na matriz e no Resumo
- Thresholds em Settings (defaults 70/85/95 — três pontos de corte para quatro faixas)
- Campo "Valor esperado de revenda" + cálculo de margem bruta
- Coluna "Margem %" na matriz quando revenda > 0
- Painel cronograma com datas estimadas
- Intervalo entre parcelas configurável (default 30 dias)
- Cronograma no PDF + margem no WhatsApp
- Persistência: `revendaEsperada`, `intervaloDias` no histórico

**Out of scope (do SPEC.md, confirmado):**
- Margem líquida (ITBI, impostos, custos de revenda) — fora desta fase
- Calendário interativo / lembretes / sync externo — backlog
- Múltiplos valores de revenda por cenário — fora
- Comparador lado a lado — Fase 3
- Gráfico de composição — Fase 3

</spec_lock>

<decisions>
## Implementation Decisions

### Consolidação heatmap ↔ badges (D-12 a D-14)
- **D-12:** Unificar em **4 faixas** (não 5 como temos hoje no heatmap da Fase 1). Source-of-truth única; mesmas faixas determinam cor da linha na matriz E label do badge no Resumo.
  - **≤ T1 (default 70)** → `excellent` "Excelente" (verde)
  - **T1 a T2 (default 70–85)** → `good` "Bom" (amber — mantém os tokens `--zone-ideal-*` existentes)
  - **T2 a T3 (default 85–95)** → `marginal` "Marginal" (laranja — mantém `--tier-caution-*`)
  - **> T3 (default 95)** → `over-market` "Acima do mercado" (vermelho — mantém `--tier-high-risk-*`)
- **D-13:** Reaproveitar `tierFor()` em `src/lib/scenarios.js`: passar a aceitar opcionalmente os thresholds vindos de Settings. Renomear tiers para casar com SPEC: `excellent | good | marginal | over-market`. Tier `ideal` da Fase 1 vira `good`; tier `caution` vira `marginal`; tier `high-risk` vira `over-market`. Tier `good` antigo (lime, 50-65) some — fica todo verde até T1.
- **D-14:** Tokens CSS: manter os existentes mapeando para os novos nomes (variáveis `--tier-{name}-bg/fg`); deletar/substituir o token lime do antigo `good`. Manter contraste WCAG AA em ambos os temas.

### Thresholds em Settings (D-15)
- **D-15:** 3 inputs numéricos no SettingsModal (logo abaixo do campo de fiança padrão), labels: "Excelente até (%)", "Bom até (%)", "Marginal até (%)". Validação: `0 < T1 < T2 < T3 ≤ 100`. Persistir como colunas separadas em `auctioneer_settings`: `viability_t1` (default 70), `viability_t2` (default 85), `viability_t3` (default 95). **Migration nova necessária.** Reclassificação imediata na UI ao salvar — Settings já passa o `s` atualizado para o estado da Calculator via `handleSaveSettings`.

### Margem (D-16 a D-18)
- **D-16:** Fórmula locked: `margem = revenda − (bid + commission + surety)` em R$ e `% = margem / revenda × 100` (não sobre o arremate — é "lucro sobre venda"). Casos especiais: `revenda <= 0` ou vazio → margem oculta no Resumo e coluna oculta na matriz.
- **D-17:** Campo "Valor de revenda esperado" entra no **grid principal** ao lado de Comissão / Fiança / Parcelas. Vira o 4º item; layout do grid passa para `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (revenda fica como input BRL com formatação `formatBRLInput` reutilizada).
- **D-18:** Margem aparece em (a) sublabel do hero-stat do Resumo abaixo de "Custo inicial" como `Margem estimada: R$ X (Y%)`, e (b) coluna **"Margem %"** na matriz desktop (9ª coluna, à direita de "Parcela"); cards mobile ganham mais uma linha "Margem". Cor da margem: verde se ≥0, vermelho se <0 (reaproveita tokens `--tier-excellent-fg` / `--tier-over-market-fg`).

### Cronograma (D-19 a D-22)
- **D-19:** Posição na UI por viewport:
  - **Desktop (`md:` 768+)**: card novo **abaixo do Resumo** (depois dos botões PDF/WhatsApp), título "Cronograma de pagamento", visível por padrão se data leilão preenchida.
  - **Mobile (<768px)**: `<details>` expansível **dentro do card Resumo** (entre as MiniStats e os botões), padrão fechado, label "Ver cronograma de pagamento (N parcelas)".
- **D-20:** Sem data do leilão preenchida → placeholder uniforme nos dois layouts: "Informe a data do leilão para gerar o cronograma." com link/CTA que abre o `<details>` "Adicionar detalhes do arremate".
- **D-21:** Intervalo entre parcelas: campo numérico **dentro do `<details>` "Adicionar detalhes do arremate"**, ao lado da data do leilão. Label "Intervalo entre parcelas (dias)", default 30, range 1–365. Sublabel "Estimado — confirme com o edital".
- **D-22:** Aritmética de datas: simples soma de dias (`new Date(base + N×interval×86400000)`). Sem timezone (usa local). Formato exibido pt-BR `DD/MM/AAAA`. Estado e persistência em ISO `YYYY-MM-DD`. Sem horários. Cronograma é puro derivado — não persiste no Supabase, recalcula sempre via `useMemo`.

### Cronograma de parcelas — visual (D-23)
- **D-23:** Tabela simples com 3 colunas: **#** (numeração 1..N), **Vencimento** (DD/MM/AAAA), **Valor** (BRL). Realce visual da **próxima parcela** com vencimento ≥ hoje (background `bg-soft` + ícone "calendar"). Parcelas vencidas (vencimento < hoje, sem indicação de pagamento — só estimativa) em opacity 60%. Sem checkboxes "paguei" — visualização pura, conforme SPEC.

### PDF e WhatsApp (D-24 a D-25)
- **D-24:** PDF — adicionar seção "Cronograma de pagamento" abaixo do bloco principal. Tabela jsPDF com 3 colunas (#, Data, Valor). Limite: 30 parcelas couberem em 1 página adicional (validar com 30x — se overflow, reduzir font-size das linhas para 9pt). Se data leilão ausente, omitir seção (sem placeholder no PDF). Se revenda preenchida, adicionar 1 linha "Margem estimada: R$ X (Y%)" no bloco de resumo principal.
- **D-25:** WhatsApp — quando `revenda > 0`: 1 linha "💰 Margem estimada: R$ X (Y%)" no resumo (após "Custo inicial"). **Não** incluir tabela completa do cronograma na mensagem (limite de caracteres + leitura). Em vez disso, adicionar linha resumo "📅 Primeira parcela: DD/MM/AAAA · Última: DD/MM/AAAA" se data preenchida.

### Persistência (D-26)
- **D-26:** Estender `calc` JSON com `revendaEsperada?: number`, `intervaloDias?: number` (nullables). Settings ganha 3 colunas SQL novas: `viability_t1`, `viability_t2`, `viability_t3` (numeric, nullable, defaults aplicados em código se null). `handleLoad` passa a restaurar esses campos do calc; cálculos antigos sem eles ficam com defaults.

### Schema migration (D-27)
- **D-27:** Nova migration SQL `supabase/migrations/0002_add_viability_thresholds.sql` com:
  ```sql
  alter table public.auctioneer_settings
    add column if not exists viability_t1 numeric,
    add column if not exists viability_t2 numeric,
    add column if not exists viability_t3 numeric;
  ```
  Idempotente. Plan terá task human-action (autonomous: false) idêntica ao 01-02.

### Claude's Discretion
- Componentes auxiliares (`<ViabilityBadge>`, `<ScheduleTable>`, `<ScheduleCollapsible>`) — planner decide se ficam inline ou viram componentes dedicados em `src/components/`
- Wording exato do placeholder "Informe a data..." e CTA — planner pode refinar se ficar verboso
- Lógica de detecção "primeira parcela após hoje" para realce — implementação fica a critério, mas o highlight visual é mandatório

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/phases/02-viabilidade-e-cronograma/02-SPEC.md` — Locked requirements (com fórmula de margem corrigida em commit conjunto). **MUST read before planning.**

### Project-level
- `.planning/PROJECT.md` — Visão e stack
- `.planning/REQUIREMENTS.md` — Glossário (R6, R7); domínio de leilão judicial brasileiro
- `.planning/STATE.md` — Decisões travadas no projeto

### Fase 1 (consumida por Fase 2)
- `.planning/phases/01-cenarios-e-carta-fianca/01-CONTEXT.md` — Decisões D-01..D-11 que continuam válidas
- `.planning/phases/01-cenarios-e-carta-fianca/01-SPEC.md` — caso canônico numérico (avaliação=R$61.000, com=5%, fia=1%, 30x; fiança sobre saldo)

### Codebase entry points
- `src/lib/calc.js` — `calculate()` retorna `{ bid, commission, surety, ... }`. Margem = revenda − (bid + commission + surety). Adicionar `margin` ao retorno é opcional (decisão do planner) — pode ficar derivado em App.jsx.
- `src/lib/scenarios.js` — `tierFor()` e `TIER_LABELS` já exportados. **Refatorar** para aceitar thresholds e usar 4 tiers (excellent/good/marginal/over-market). `IDEAL_ZONE` pode ser deprecado/renomeado.
- `src/index.css` — Tokens `--tier-*-bg/fg` existentes. Renomear `caution`→`marginal`, `high-risk`→`over-market`. Remover `lime` (good antigo).
- `src/App.jsx` — UI principal; `<details>` "Adicionar detalhes do arremate" ganha campo de intervalo de parcelas; grid principal cresce para 4 colunas (revenda).
- `src/components/SettingsModal.jsx` — Adicionar 3 inputs de threshold abaixo do campo de fiança.
- `src/components/HistoryModal.jsx` — Sem mudanças relevantes (badge de modo já existe).
- `src/lib/data.js` — `fetchSettings`/`upsertSettings` precisam mapear `viability_t1/t2/t3` ↔ camelCase.
- `src/lib/pdf.js` — Adicionar tabela de cronograma + linha de margem.
- `src/lib/whatsapp.js` — Adicionar linha de margem + linha resumo do cronograma.
- `src/lib/format.js` — Reutilizar `brl`, `pct`, `formatBRLInput`. Adicionar helper `formatDateBR(iso)` se ainda não existe.
- `supabase/schema.sql` — Atualizar refletindo as 3 colunas novas (idempotência local).

### Reference
- Fórmula de margem (locked após discussão): `margem = revenda − (bid + commission + surety)`. Confere com lógica de "preço efetivo pago vs. preço de venda".

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Heatmap tokens em `src/index.css`** — base sólida; só renomear/consolidar para 4 tiers
- **`tierFor()` em `src/lib/scenarios.js`** — função pura, fácil estender com `thresholds = { t1, t2, t3 }` opcionais
- **Pattern de campo numérico com sublabel** já estabelecido na Fase 1 (Comissão / Fiança / Parcelas) — replicar para Threshold inputs e intervalo de parcelas
- **`<details>` "Adicionar detalhes do arremate"** — já comporta data leilão; só adicionar mais um input ao grid interno
- **`Field`, `MiniStat`, `IconBtn`** — todos reutilizáveis
- **Schema migration pattern** já estabelecido em 0001 — replicar formato

### Established Patterns
- Estado local com `useState` múltiplos — manter
- Cálculos derivados via `useMemo` — usar para `schedule = useMemo(buildSchedule(installments, dataLeilao, intervaloDias), [...])`
- Persistência: `calc` JSON estendido (nullable fields) + colunas dedicadas em `auctioneer_settings`
- Modo escuro via `rgb(var(--…))` — paleta de tier segue padrão

### Integration Points
- Grid principal de inputs: passa de 3 cols (`lg:grid-cols-3`) para 4 cols (`lg:grid-cols-4`) com revenda. Mobile/tablet stack normal.
- Settings: 3 inputs novos abaixo do campo de fiança padrão.
- Resumo: hero-stat ganha sublabel de margem (condicional); ScheduleTable é card novo abaixo no desktop, `<details>` no mobile.
- Matriz: 9ª coluna "Margem %" condicional. Cards mobile ganham mais uma linha do grid de 2 cols.
- PDF: nova seção "Cronograma de pagamento" + linha de margem no resumo.
- WhatsApp: linhas adicionais condicionais.

### Constraints
- Mobile-first ≥360px — confirmar que 4 colunas em `lg` ainda fica usável (≥1024px); abaixo disso colapsa para 2 ou 1
- Bundle não deve crescer mais que ~10KB (sem novas libs)
- Cálculo de datas sem libs externas (`date-fns` desnecessário — só soma de dias)
- WhatsApp ≤1500 caracteres mesmo com cronograma + margem

</code_context>

<specifics>
## Specific Ideas

- **Caso de teste numérico (estende o canônico da Fase 1):** avaliação=R$61.000, com=5%, fia=1%, 30x, **revenda=R$58.000**, **data leilão=2026-05-01**, intervalo=30 → linha 70% (arremate=R$42.700, commission=R$2.135, surety=R$320,25):
  - `total_efetivo = 42700 + 2135 + 320,25 = R$45.155,25`
  - `margem = 58000 − 45155,25 = R$12.844,75`
  - `margem % = 12844,75 / 58000 × 100 ≈ 22,15%`
  - Tier (default thresholds 70/85/95): 70 está exatamente em T1 → faixa "Excelente" se intervalo é `≤T1`, "Bom" se `<T1`. **Decisão de borda:** usar `<=` para Excelente (i.e., 70 inclusive ainda é Excelente). Documentar isso.
  - Cronograma: primeira parcela 31/05/2026, última 27/10/2028 (30 vencimentos, 30 dias cada)
- **Tier 70 inclusive ou exclusive em T1?** → **inclusive** (`pct <= T1` = Excelente). Mesmo critério para T2 e T3.
- **Sublabel da margem no hero-stat:** "Margem estimada: R$ 12.844,75 (22,1%)" — formato fixo.
- **Cor da margem no Resumo e na coluna:** se `margem > 0` → `text-tier-excellent-fg`; se `< 0` → `text-tier-over-market-fg`; se `= 0` → `text-fg-muted`.
- **Realce da próxima parcela** (≥ hoje): bg-soft + sutil border-left accent + ícone calendar. Itens passados (caso o usuário registre data antiga): opacity-60.

</specifics>

<deferred>
## Deferred Ideas

- **Margem líquida** (ITBI ~3%, custos de cartório, IR sobre ganho) — fora explicitamente; backlog
- **Sync com calendário externo** (Google/Apple) — backlog
- **Lembretes/notificações de parcelas** — backlog
- **Múltiplos valores de revenda por cenário** — fora; um só valor
- **Marcar parcelas como pagas** (checkbox por parcela) — fora; visualização pura nesta fase
- **Faixa de viabilidade visual gradiente entre cores** (em vez de discreta) — não-objetivo; mantemos discreto
- **Customização das 13 % da matriz** — backlog (já listado em Fase 1 deferred)
- **Comparador lado a lado de cenários** — Fase 3
- **Gráfico de composição do custo inicial** — Fase 3
- **Tooltips explicativos nos labels** — Fase 3

</deferred>

---

*Phase: 02-viabilidade-e-cronograma*
*Context gathered: 2026-04-27*
