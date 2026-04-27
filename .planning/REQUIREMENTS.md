# Requirements

## Funcionais

- **R1** Calcular custos de um arremate (entrada, comissão, parcelamento) a partir do valor de arremate. _(implementado)_
- **R2** Persistir cálculos no histórico por usuário autenticado. _(implementado)_
- **R3** Exportar resumo em PDF e mensagem WhatsApp. _(implementado)_
- **R4** Suportar **carta de fiança** como componente configurável do custo inicial. _(pendente — Fase 1)_
- **R5** Permitir decisão de lance via simulação de **múltiplos cenários de desconto** sobre o valor de avaliação. _(pendente — Fase 1)_
- **R6** Sinalizar **viabilidade** de um cenário (faixa de desconto, margem potencial vs. revenda). _(pendente — Fase 2)_
- **R7** Gerar **cronograma de pagamento** das parcelas com datas estimadas. _(pendente — Fase 2)_
- **R8** Permitir **comparação lado a lado** de cenários e visualização da composição do custo inicial. _(pendente — Fase 3)_

## Não-funcionais

- **N1** Mobile-first; layout responsivo a partir de 360px de largura.
- **N2** Cálculos puros e instantâneos (sem round-trip de servidor).
- **N3** Conteúdo em pt-BR; valores monetários em BRL com formatação local.
- **N4** Compatível com modo escuro existente (contraste WCAG AA).
- **N5** Sem regressões no PDF / WhatsApp / histórico existentes.

## Glossário

- **Arremate:** valor pelo qual o bem é arrematado (lance vencedor).
- **Avaliação:** valor de mercado declarado no edital.
- **Entrada:** percentual pago no dia do leilão (default 25% do arremate).
- **Comissão do leiloeiro:** percentual do arremate pago ao leiloeiro (default 5%).
- **Carta de fiança:** garantia bancária do **saldo a parcelar** (75% do arremate). Default 1%, configurável; usar 0 se edital não exigir. Fórmula: `surety = saldo × suretyPct/100`.
- **Custo inicial:** entrada + comissão + carta de fiança — total desembolsado no dia.
- **Saldo a parcelar:** arremate − entrada (geralmente 75% do arremate).
