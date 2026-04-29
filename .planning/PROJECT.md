# Calculadora de Leilão

App web para auxiliar usuários a calcular custos e viabilidade de arremates em leilões judiciais brasileiros.

**Stack:** React 18 + Vite, TailwindCSS, Supabase (auth + persistence), jsPDF.

## Current state — v1.1 shipped (2026-04-28)

App completo de **decisão pré-lance**: usuário parte do valor de avaliação do bem, simula 13 cenários de desconto, escolhe o lance ideal apoiado por badges de viabilidade (Excelente / Bom / Marginal / Acima do mercado), informa expectativa de revenda para ver margem bruta estimada, e gera cronograma de parcelas com datas. Tudo exportável em PDF e WhatsApp.

**v1.1 entregou:**
- Carta de fiança como campo first-class (sobre saldo a parcelar 75%, default 1%)
- Modo "Simular por avaliação" com matriz de 13 cenários e heatmap visual
- Renomeação "Total à vista" → "Custo inicial" (terminologia do mercado)
- Badge de viabilidade configurável (4 tiers)
- Margem bruta via campo "Revenda esperada"
- Cronograma de parcelas com datas estimadas (intervalo configurável)
- Comparador de até 3 cenários lado a lado
- Stacked bar de composição do custo inicial
- Tooltips ⓘ em 6 labels técnicos
- 2 migrations Supabase (default_surety_pct, viability_t1/t2/t3)

## Próxima milestone

Não definida. Pontos candidatos para discussão em `/gsd-new-milestone`:

- **Margem líquida** (ITBI ~3%, cartório, IR sobre ganho de revenda)
- **E2E tests** (Playwright/Cypress) — atualmente só unit tests
- **Performance** — code-splitting, bundle ~775KB
- **Onboarding/tour guiado** para novos usuários
- **Sync de cronograma** com Google Calendar / Apple Calendar
- **Comparador exportável** em PDF/WhatsApp
- **Customização das % da matriz** pelo usuário
- **Tooltips em mais labels** (atualmente 6)

<details>
<summary>Histórico anterior à v1.1</summary>

**Estado pré-v1.1 (Apr 2026):** App funcional com cálculo de arremate único (entrada 25% + comissão), histórico no Supabase, exportação PDF e WhatsApp, perfil/configurações por usuário. Calculadora operava no modelo "valor de arremate já decidido → custo".

**Lacuna identificada (motivou v1.1):** Usuários reais (referência: planilha "Calculadora De Viabilidade" usada por leiloeiros) precisavam decidir o lance antes de arrematar, partindo do valor de avaliação do bem e simulando múltiplos cenários de desconto. O app não suportava esse fluxo, e ignorava "carta de fiança" — componente real do custo inicial em muitos editais.

</details>
