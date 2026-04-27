# Phase 1: Cenários e Carta de Fiança — Specification

**Created:** 2026-04-27
**Ambiguity score:** 0.16
**Requirements:** 5 locked

## Goal

A calculadora deixa de operar apenas no modo "arremate fixo → custo" e passa a oferecer também o modo "avaliação → matriz de cenários de desconto", incluindo carta de fiança no cálculo do custo inicial e renomeando "Total à vista" para "Custo inicial".

## Background

Hoje, `src/lib/calc.js` recebe `{ arremate, commissionPct, installments }` e retorna `{ entry, commission, upfront, remaining, installment, total }` — apenas um cenário, sem carta de fiança. `src/App.jsx` apresenta o resultado como "Total à vista (no dia) = entrada + comissão". A planilha de referência usada por leiloeiros parte de **avaliação** e mostra 13 cenários de desconto (30%–100%) lado a lado, com **carta de fiança 5%** como linha separada e **custo inicial = entrada + leiloeiro + carta**. Essa lacuna obriga o usuário a fazer cálculo mental antes de digitar o arremate.

## Requirements

1. **Carta de fiança no cálculo**: `calculate()` aceita e considera percentual de carta de fiança no custo inicial.
   - Current: `calc.js` ignora carta de fiança; `upfront = entry + commission` apenas
   - Target: `calculate({ arremate, commissionPct, suretyPct, installments })` retorna campo `surety` (valor) e `upfront` passa a ser `entry + commission + surety`
   - Acceptance: teste unitário com `arremate=R$61.000, suretyPct=5` retorna `surety=R$3.050,00` e `upfront` reflete os três componentes; `suretyPct=0` produz `surety=0` sem alterar demais campos

2. **Configuração de carta de fiança**: usuário define percentual padrão e pode sobrescrever por cálculo.
   - Current: Settings tem apenas dados de perfil (nome/contato); não há campo de fiança
   - Target: Settings ganha campo "Carta de fiança padrão (%)" persistido no Supabase; tela principal mostra campo override sempre visível; default global se vazio: **1%**; valor `0` é aceito e desativa efetivamente a carta no cálculo
   - Acceptance: alterar valor em Settings persiste após reload; alterar override na tela principal não altera o default em Settings; novo cálculo carrega o default de Settings; com `suretyPct=0` a coluna "Carta fiança" da matriz exibe `R$ 0,00` e o "Custo inicial" se reduz a entrada+comissão

3. **Modo "Avaliação → Cenários"**: nova UI permite informar valor de avaliação e ver matriz clicável de cenários.
   - Current: app só aceita valor de arremate como entrada
   - Target: toggle no topo do form com dois modos — "Arremate fixo" (atual) e "Simular por avaliação" (novo); no segundo modo, input de avaliação renderiza tabela com colunas: %, Arrematação, Entrada (25%), Saldo a parcelar, Comissão, Carta fiança, **Custo inicial**, Parcela
   - Acceptance: com avaliação=R$61.000, comissão=5%, fiança=1%, parcelas=30, a linha de 70% mostra Arrematação=R$42.700,00, Entrada=R$10.675,00, Saldo=R$32.025,00, Comissão=R$2.135,00, Fiança=R$427,00, Custo inicial=R$13.237,00, Parcela=R$1.067,50

4. **Seleção de cenário**: clicar em uma linha da matriz "fixa" o cenário e renderiza o resumo detalhado existente.
   - Current: não existe matriz
   - Target: linha clicada vira o cenário ativo do painel "Resumo" (à direita / abaixo no mobile), habilitando os botões PDF, WhatsApp e Salvar com aquele arremate
   - Acceptance: clicar na linha de 70% preenche o painel Resumo com os mesmos valores da requirement 3; clicar em outra linha atualiza o painel; PDF gerado contém o arremate da linha selecionada

5. **Renomeação "Total à vista" → "Custo inicial"**: terminologia atualizada em todos os pontos visíveis ao usuário.
   - Current: rótulo "Total à vista (no dia)" aparece em `App.jsx` (hero-stat), no PDF (`src/lib/pdf.js`) e no WhatsApp (`src/lib/whatsapp.js`)
   - Target: todos os três pontos passam a exibir "Custo inicial"; sublabel atualizado para "Entrada + comissão + carta de fiança"
   - Acceptance: `grep -ri "Total à vista" src/` retorna zero resultados; PDF e WhatsApp gerados após a fase contêm "Custo inicial"

## Boundaries

**In scope:**
- Campo carta de fiança em `calc.js`, Settings, e form principal (override)
- Toggle de modo "Arremate fixo" / "Simular por avaliação"
- Matriz de cenários renderizada com 13 linhas default (30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100)
- Realce visual de "zona ideal" (70%–85%) na matriz — fundo destacado, sem bloqueio funcional
- Renomeação completa "Total à vista" → "Custo inicial" (UI + PDF + WhatsApp)
- Persistência do default de fiança em Supabase Settings
- Histórico continua salvando o cálculo do cenário ativo (sem alterar schema, só adicionar campo `suretyPct`)

**Out of scope:**
- Indicador de viabilidade / margem / faixas verde-amarelo-vermelho — Fase 2
- Cronograma de parcelas com datas — Fase 2
- Comparador lado a lado de múltiplos cenários — Fase 3
- Gráfico de composição do custo inicial — Fase 3
- Tooltips explicativos nos labels — Fase 3
- Faixas de cenários customizáveis pelo usuário — backlog (default fixo basta)
- Substituição da carta de fiança por seguro garantia — backlog (single mecanismo nesta fase)
- Migração de cálculos antigos no histórico — não retroativo (cálculos antigos exibem `surety=R$0,00`)

## Constraints

- `calculate()` deve continuar puro e síncrono — nenhuma chamada de rede.
- Schema do Supabase `calculations` deve aceitar `calc.suretyPct` e `calc.surety` sem migração destrutiva (campos JSON em coluna existente, ou nova coluna nullable).
- Layout da matriz precisa funcionar em viewport ≥360px (scroll horizontal aceitável).
- Ordem das colunas na matriz deve seguir a planilha de referência: %, Arrematação, Entrada, Saldo, Comissão, Carta fiança, Custo inicial, Parcela.
- A renomeação "Custo inicial" se aplica também ao modal "Salvar cálculo" e ao histórico.

## Acceptance Criteria

- [ ] `calculate()` aceita `suretyPct` e retorna `surety` corretamente para `0%`, `5%` e `10%`
- [ ] Settings persiste `defaultSuretyPct` por usuário e o app o usa como default em novos cálculos
- [ ] Toggle de modo está visível e troca entre "Arremate fixo" e "Simular por avaliação" sem perda de dados do meta (comprador/lote/etc.)
- [ ] Matriz renderiza exatamente 13 linhas com os percentuais 30/35/50/55/60/65/70/75/80/85/88/90/100
- [ ] Linha 70%–85% da matriz tem destaque visual distinto das demais
- [ ] Clicar em linha da matriz preenche o painel Resumo e habilita PDF/WhatsApp/Salvar
- [ ] Os 8 valores da linha 70% conferem com o caso de teste (avaliação=R$61.000, com=5%, fia=1%, 30x)
- [ ] `grep -ri "Total à vista" src/` retorna 0 ocorrências
- [ ] PDF e WhatsApp exibem "Custo inicial" e incluem linha "Carta de fiança"
- [ ] Histórico aceita salvar e recarregar um cálculo gerado pelo modo "avaliação → cenários" sem perda de informação do cenário escolhido
- [ ] Layout da matriz é utilizável em viewport de 360px (scroll horizontal admissível, sem quebra de coluna)
- [ ] Modo escuro mantém contraste WCAG AA no realce da zona ideal

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                  |
|--------------------|-------|------|--------|--------------------------------------------------------|
| Goal Clarity       | 0.88  | 0.75 | ✓      | Caso numérico testável fixa o comportamento esperado   |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Out-of-scope explícito separa Fase 1 das Fases 2/3     |
| Constraint Clarity | 0.78  | 0.65 | ✓      | Schema Supabase e layout 360px constrangem decisões    |
| Acceptance Criteria| 0.82  | 0.70 | ✓      | 11 critérios pass/fail                                 |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      |                                                        |

## Interview Log

| Round | Perspective     | Question summary                              | Decision locked                                                  |
|-------|-----------------|-----------------------------------------------|------------------------------------------------------------------|
| auto  | Researcher      | O que existe hoje em calc.js / Settings?      | calc.js = arremate único sem fiança; Settings = só perfil        |
| auto  | Simplifier      | Mínimo viável para destravar fluxo da planilha? | Carta fiança + matriz clicável + renomeação                    |
| auto  | Boundary Keeper | O que NÃO entra na Fase 1?                    | Viabilidade, cronograma, comparador, gráfico, tooltips           |
| auto  | Failure Analyst | Onde a fase pode quebrar PDF / histórico?     | Schema retro-compat; cálculos antigos exibem `surety=0`           |

*Auto-derived from prior conversation analysis (planilha de referência + análise de gaps). User confirmed escolha "C" (bootstrap mínimo) em 2026-04-27.*

---

*Phase: 01-cenarios-e-carta-fianca*
*Spec created: 2026-04-27*
*Next step: /gsd:discuss-phase 1 — decisões de implementação (estrutura de estado do toggle, schema de persistência do cenário, layout responsivo da matriz)*
