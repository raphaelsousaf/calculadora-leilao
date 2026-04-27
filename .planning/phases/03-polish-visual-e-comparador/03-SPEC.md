# Phase 3: Polish Visual e Comparador — Specification

**Created:** 2026-04-27
**Ambiguity score:** 0.19
**Requirements:** 4 locked

## Goal

A interface da calculadora ganha uma camada de comunicação visual: composição do custo inicial em gráfico, comparador lado a lado de até 3 cenários, tooltips explicativos nos labels técnicos e indicador de % do custo inicial sobre o arremate.

## Background

Após Fases 1 e 2, o app já é um assessor funcional, mas a apresentação ainda é majoritariamente numérica. Usuários novos (compradores menos experientes) têm dificuldade de entender para onde vai cada real do custo inicial e de comparar 2-3 lances que estão considerando. A Fase 3 não adiciona poder de cálculo, mas reduz fricção cognitiva e ajuda a decisão final.

## Requirements

1. **Composição visual do custo inicial**: gráfico mostra a divisão entre entrada, comissão e carta de fiança.
   - Current: painel Resumo mostra os três valores como linhas separadas, sem visualização proporcional
   - Target: gráfico de barra empilhada horizontal (ou donut) abaixo do "Custo inicial" com 3 segmentos coloridos rotulados; cores derivadas das variáveis CSS do tema; tooltip por segmento mostra valor e %
   - Acceptance: com fiança=5% e comissão=5%, segmentos representam Entrada≈70.6%, Comissão≈14.7%, Fiança≈14.7% do custo inicial; cores funcionam em modo claro e escuro

2. **Comparador de até 3 cenários**: usuário pode "fixar" cenários e vê-los lado a lado.
   - Current: só um cenário ativo no painel Resumo de cada vez
   - Target: na matriz da Fase 1, ícone de "fixar" por linha; até 3 linhas fixadas aparecem em painel comparativo com colunas alinhadas (Arremate, Custo inicial, Parcela, Margem%, Badge); botão "Limpar comparação"; tentativa de fixar 4ª mostra toast "máximo 3 cenários"
   - Acceptance: fixar 3 cenários (60%, 70%, 80%) renderiza painel com 3 colunas alinhadas; fixar 4º produz toast e não adiciona; remover um e fixar outro funciona; limpar comparação esvazia o painel

3. **Tooltips de clareza**: labels técnicos ganham explicação acessível sob hover/tap.
   - Current: labels como "Comissão do leiloeiro", "Carta de fiança", "Saldo a parcelar" não têm explicação
   - Target: ícone "ⓘ" ao lado dos labels-chave (Comissão, Carta de fiança, Custo inicial, Saldo a parcelar, Entrada, Margem) abrindo tooltip com 1-2 frases em pt-BR, navegável por teclado e leitor de tela; texto dos tooltips em arquivo central (`src/lib/tooltips.js`) para fácil revisão
   - Acceptance: 6 labels têm ícone ⓘ; cada tooltip tem ≤140 caracteres; tooltips passam validação de leitor de tela (atributos `aria-describedby` ou pattern equivalente); funcional em mobile (tap toggle)

4. **% do custo inicial sobre o arremate**: indicador percentual ajuda a contextualizar o custo inicial.
   - Current: painel Resumo mostra "Custo inicial: R$ X" sem proporção
   - Target: sub-rótulo "(Y% do arremate sai no dia)" abaixo do valor de "Custo inicial", calculado dinamicamente; aparece também na matriz como coluna ou tooltip
   - Acceptance: arremate=R$42.700, custo inicial=R$14.945 → sublabel exibe "35,0% do arremate sai no dia"; valor recalculado quando %comissão ou %fiança mudam

## Boundaries

**In scope:**
- Gráfico stacked bar OU donut (escolha em discuss-phase) — uma única visualização, sem alternar
- Comparador limitado a exatamente 3 slots
- Tooltips em 6 labels específicos definidos na requirement 3
- Indicador "% do arremate sai no dia" no painel Resumo e na matriz
- Arquivo central de textos de tooltips para revisão futura
- Compatibilidade com modo escuro e mobile

**Out of scope:**
- Mais de 3 cenários no comparador — limite fixo
- Customização do gráfico pelo usuário — cores e tipo são fixos
- Tooltips em todos os labels — apenas os 6 técnicos
- Animações elaboradas — apenas transições suaves padrão do app
- Exportação do comparador em PDF/WhatsApp — backlog (apenas visualização in-app)
- Tradução / i18n dos tooltips — pt-BR único nesta fase
- Tour guiado / onboarding — backlog separado

## Constraints

- Sem novas dependências pesadas: gráfico implementado em SVG/CSS puro ou com biblioteca já presente; nada que adicione >30KB ao bundle.
- Tooltips precisam ser acessíveis por teclado (focus + Enter/Escape) e leitor de tela.
- Layout do comparador deve ser usável em viewport ≥360px (scroll horizontal aceitável; nunca quebra de coluna).
- Gráfico e tooltips não bloqueiam operações principais (PDF, WhatsApp, Salvar).
- Estado do comparador é local à sessão; **não** persiste no histórico nem no Supabase.

## Acceptance Criteria

- [ ] Gráfico de composição do custo inicial renderiza com 3 segmentos rotulados
- [ ] Cores do gráfico mantêm contraste WCAG AA em modo claro e escuro
- [ ] Botão "fixar" em cada linha da matriz adiciona ao comparador (até 3)
- [ ] 4ª tentativa de fixar mostra toast "máximo 3 cenários" e não adiciona
- [ ] Comparador mostra colunas alinhadas: Arremate, Custo inicial, Parcela, Margem%, Badge
- [ ] Botão "Limpar comparação" esvazia o painel
- [ ] Comparador é usável em viewport 360px (sem quebra de layout)
- [ ] 6 labels (Comissão, Carta de fiança, Custo inicial, Saldo a parcelar, Entrada, Margem) têm ícone ⓘ
- [ ] Tooltips são abertos por hover (desktop), tap (mobile) e foco (teclado)
- [ ] Tooltip fecha com Escape ou clique fora; texto associado por `aria-describedby`
- [ ] Textos de tooltip estão em `src/lib/tooltips.js` (não inline)
- [ ] Sublabel "% do arremate sai no dia" aparece no painel Resumo e atualiza dinamicamente
- [ ] Bundle final cresce ≤30KB em relação ao final da Fase 2
- [ ] Estado do comparador NÃO persiste após reload (verificável)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                          |
|--------------------|-------|------|--------|----------------------------------------------------------------|
| Goal Clarity       | 0.83  | 0.75 | ✓      | Cada melhoria tem comportamento testável                       |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Limite de 3 cenários e 6 labels explícitos                     |
| Constraint Clarity | 0.70  | 0.65 | ✓      | Limite de bundle e acessibilidade explícitos                   |
| Acceptance Criteria| 0.78  | 0.70 | ✓      | 14 critérios pass/fail                                         |
| **Ambiguity**      | 0.19  | ≤0.20| ✓      | Escolha bar vs donut deferida ao discuss-phase (intencional)   |

## Interview Log

| Round | Perspective     | Question summary                                | Decision locked                                                |
|-------|-----------------|-------------------------------------------------|----------------------------------------------------------------|
| auto  | Researcher      | O que falta após F1+F2 para reduzir fricção?    | Visualização proporcional + comparação + glossário in-context  |
| auto  | Simplifier      | Limite do comparador?                           | 3 fixo — qualquer mais polui mobile                            |
| auto  | Boundary Keeper | Tooltips em todos os labels?                    | Não — só 6 técnicos                                            |
| auto  | Failure Analyst | Onde a fase pode degradar performance?          | Bundle — limite ≤30KB de aumento, sem libs pesadas             |

*Auto-derived from prior conversation analysis. Tipo de gráfico (bar vs donut) deixado em aberto para discuss-phase escolher conforme exploração visual.*

---

*Phase: 03-polish-visual-e-comparador*
*Spec created: 2026-04-27*
*Next step: /gsd:discuss-phase 3 — decisões de implementação (tipo de gráfico, padrão de tooltip acessível, layout do comparador no mobile)*
