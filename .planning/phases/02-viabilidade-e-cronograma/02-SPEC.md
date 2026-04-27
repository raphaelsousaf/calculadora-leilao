# Phase 2: Viabilidade e Cronograma — Specification

**Created:** 2026-04-27
**Ambiguity score:** 0.18
**Requirements:** 4 locked

## Goal

A calculadora deixa de ser apenas uma calculadora e passa a sinalizar **viabilidade** de cada cenário (faixa de desconto, margem potencial vs. valor de revenda esperado) e gera **cronograma de parcelas** com datas estimadas, incorporado ao PDF e WhatsApp.

## Background

Após a Fase 1, o usuário consegue ver múltiplos cenários, mas precisa decidir qual lance fazer sem nenhum sinal de "este cenário é bom" — só números. A planilha de referência destaca visualmente a faixa 70%–85%, mas não calcula margem real. Além disso, o app hoje informa apenas "30x de R$ X,XX" sem datas, dificultando que o comprador planeje fluxo de caixa. Adicionar viabilidade + cronograma transforma o app de calculadora em assessor de decisão.

## Requirements

1. **Faixa de desconto sinalizada**: cada cenário recebe uma classificação visual baseada em % do arremate sobre avaliação.
   - Current: matriz da Fase 1 mostra apenas realce estático em 70%–85%
   - Target: cada linha da matriz e o painel Resumo ganham um badge com label e cor — `≤70%: "Excelente"` (verde), `70–85%: "Bom"` (amarelo), `85–95%: "Marginal"` (laranja), `>95%: "Acima do mercado"` (vermelho); thresholds configuráveis em Settings
   - Acceptance: cenário com 70% mostra badge "Excelente"; com 85% mostra "Bom"; com 95% mostra "Marginal"; alterar thresholds em Settings reclassifica imediatamente sem reload

2. **Margem potencial via valor de revenda**: usuário informa expectativa de revenda; app calcula margem bruta.
   - Current: não há campo de revenda
   - Target: campo opcional "Valor esperado de revenda" no form principal; quando preenchido, painel Resumo mostra `Margem bruta = revenda − (arremate + comissão + carta de fiança)` (i.e., revenda menos total efetivo pago, sem dupla contagem do saldo) em R$ e % (`% = margem / revenda × 100`); matriz mostra coluna "Margem %"
   - Acceptance: com avaliação=R$61.000, lance=70% (arremate=R$42.700, comissão=R$2.135, fiança=R$320,25), revenda=R$58.000 → total_pago=R$45.155,25, margem=R$12.844,75, margem%≈22,15%; sem revenda preenchido, campos de margem ficam ocultos (não exibe "—" ou zero)

3. **Cronograma de parcelas com datas**: parcelas ganham datas estimadas a partir da data do leilão.
   - Current: app exibe apenas valor da parcela e quantidade
   - Target: novo painel "Cronograma" com tabela de N parcelas (data de vencimento estimada = data leilão + 30, 60, 90… dias); intervalo padrão 30 dias, configurável por cálculo; se data do leilão não preenchida, painel exibe placeholder "Informe a data do leilão para gerar o cronograma"
   - Acceptance: data leilão = 2026-05-01, 30x → primeira parcela em 2026-05-31, última em 2028-10-27; alterar intervalo para 45 dias recalcula todas as datas

4. **Cronograma e margem no PDF e WhatsApp**: exportações refletem os novos campos.
   - Current: PDF e WhatsApp não mostram cronograma nem margem
   - Target: PDF ganha seção "Cronograma de pagamento" com tabela completa; mensagem WhatsApp ganha resumo "Margem estimada: R$ X (Y%)" quando aplicável e link/menção ao cronograma no PDF anexo; nenhum dos dois quebra quando margem ou cronograma estão ausentes
   - Acceptance: PDF gerado contém tabela de N linhas com data/valor; WhatsApp gerado contém linha "Margem estimada" se revenda preenchida, oculta caso contrário

## Boundaries

**In scope:**
- Badges de viabilidade (4 faixas) na matriz e no painel Resumo
- Thresholds de faixas configuráveis em Settings (com defaults sensatos)
- Campo "Valor esperado de revenda" e cálculo de margem bruta
- Coluna "Margem %" na matriz quando revenda preenchida
- Painel de cronograma com datas estimadas
- Intervalo entre parcelas configurável por cálculo (default 30 dias)
- Inclusão de cronograma no PDF e margem no WhatsApp
- Persistência de `revendaEsperada` e `intervaloDias` no histórico

**Out of scope:**
- Cálculo de margem **líquida** (impostos, ITBI, custos de revenda) — fora; só margem bruta nesta fase
- Calendário interativo / lembretes / notificações — fora; só visualização estática
- Integração com calendário externo (Google/Apple) — backlog
- Múltiplos valores de revenda por cenário — fora; um só valor
- Customização visual avançada das cores das faixas — fora; cores fixas com contraste validado
- Comparador lado a lado — Fase 3
- Gráficos de composição — Fase 3

## Constraints

- Datas calculadas usando aritmética simples de dias (sem timezones / horários); formato ISO `YYYY-MM-DD` no estado, formato pt-BR (`DD/MM/AAAA`) na UI.
- PDF não pode crescer mais que 1 página adicional para cronograma de até 30 parcelas.
- Mensagem WhatsApp não pode ultrapassar 1.500 caracteres mesmo com margem incluída.
- Faixas e badges devem manter contraste WCAG AA em modo claro e escuro.
- Cálculo de margem não pode ser exibido com revenda preenchida = 0 (ambíguo); só ativa com valor > 0.

## Acceptance Criteria

- [ ] Badge de viabilidade aparece em cada linha da matriz e no painel Resumo
- [ ] Os 4 thresholds default (70/85/95) são configuráveis em Settings e persistem
- [ ] Alterar threshold em Settings reclassifica cenários sem reload
- [ ] Campo "Valor esperado de revenda" é opcional e fica oculto/sem efeito quando vazio
- [ ] Margem bruta = revenda − (arremate + comissão + carta de fiança), exibida em R$ e %
- [ ] Coluna "Margem %" aparece na matriz somente quando revenda > 0
- [ ] Painel cronograma exige data do leilão preenchida; sem ela, exibe placeholder
- [ ] Cronograma com N=30 e intervalo=30 produz N linhas com datas progressivas corretas
- [ ] Alterar intervalo para 45 dias recalcula todas as datas
- [ ] PDF inclui seção "Cronograma de pagamento" quando data do leilão preenchida
- [ ] WhatsApp inclui linha "Margem estimada" quando revenda preenchida; oculta caso contrário
- [ ] Cálculo carregado do histórico restaura `revendaEsperada` e `intervaloDias`
- [ ] Modo escuro mantém contraste AA nas 4 cores das faixas

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                       |
|--------------------|-------|------|--------|-------------------------------------------------------------|
| Goal Clarity       | 0.85  | 0.75 | ✓      | Faixas/thresholds + fórmula de margem fixam comportamento   |
| Boundary Clarity   | 0.82  | 0.70 | ✓      | Margem líquida e calendário externo explicitamente fora     |
| Constraint Clarity | 0.72  | 0.65 | ✓      | Limites de PDF/WhatsApp e contraste AA                      |
| Acceptance Criteria| 0.78  | 0.70 | ✓      | 13 critérios pass/fail                                      |
| **Ambiguity**      | 0.18  | ≤0.20| ✓      |                                                             |

## Interview Log

| Round | Perspective     | Question summary                                  | Decision locked                                              |
|-------|-----------------|---------------------------------------------------|--------------------------------------------------------------|
| auto  | Researcher      | Após Fase 1, o que falta para virar "assessor"?   | Sinalização de viabilidade + cronograma datado               |
| auto  | Simplifier      | Margem bruta basta?                               | Sim — líquida (ITBI/impostos) é fora desta fase              |
| auto  | Boundary Keeper | Cronograma com lembretes / sync de calendário?    | Não — apenas visualização estática                           |
| auto  | Failure Analyst | Como margem se comporta com revenda vazia?        | Campo oculto, não exibe "0" ou "—"                           |

*Auto-derived from prior conversation analysis. Thresholds default (70/85/95) escolhidos por consistência com a planilha de referência (zona destacada 70–85).*

---

*Phase: 02-viabilidade-e-cronograma*
*Spec created: 2026-04-27*
*Next step: /gsd:discuss-phase 2 — decisões de implementação (paleta WCAG, layout do cronograma no PDF, modelo de persistência dos thresholds)*
