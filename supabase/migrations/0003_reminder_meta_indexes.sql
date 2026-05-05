-- ============================================================
-- Phase 3: índices para a feature de Lembretes de Leilão.
-- Cole no SQL Editor do Supabase e clique RUN.
-- Idempotente — pode rodar múltiplas vezes.
--
-- meta.reminder, meta.outcome, meta.outcomeAskedAt e meta.finalBid
-- são gravados pelo app dentro do JSONB existente — nada a alterar
-- no schema de calculations além desses índices de leitura.
-- ============================================================

create index if not exists idx_calculations_meta_outcome
  on public.calculations ((meta->>'outcome'));

create index if not exists idx_calculations_meta_data_leilao
  on public.calculations ((meta->>'dataLeilao'));
