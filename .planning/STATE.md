# State

**Current milestone:** v1.1 — Calculadora de viabilidade pré-lance
**Current phase:** 1 (specced, not yet planned)
**Last updated:** 2026-04-27

## Locked decisions

- Stack permanece React/Vite/Tailwind/Supabase — sem migração nesta milestone.
- Cálculos continuam puros no cliente (`src/lib/calc.js`) — sem backend de cálculo.
- Idioma da UI: pt-BR.
- "Total à vista" será renomeado para "Custo inicial" na Fase 1 (alinhamento com terminologia do mercado e da planilha de referência).
- Carta de fiança always-on, default = 1% do arremate, configurável por usuário (Settings) e por cálculo. Valor 0 desativa efetivamente. Sublabel no campo: "Use 0 se o edital não exigir."
- Faixa de descontos da matriz default: 30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100 (espelha a planilha de referência).
- "Zona de lance ideal" default destacada: 70%–85% do valor de avaliação.

## Open questions (carry into discuss-phase)

- Carta de fiança é obrigatória ou opt-in por cálculo? (proposta: toggle global em Settings + override por cálculo)
- Modo de cenários convive com modo arremate-fixo no mesmo schema do histórico, ou tipos separados?

## Blockers

Nenhum.
