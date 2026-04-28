-- ============================================================
-- Phase 2: thresholds de viabilidade em auctioneer_settings
-- Cole no SQL Editor do Supabase e clique RUN.
-- Idempotente (if not exists) — pode rodar múltiplas vezes.
-- Defaults aplicados em código (70/85/95) quando colunas estão NULL.
-- ============================================================

alter table public.auctioneer_settings
  add column if not exists viability_t1 numeric,
  add column if not exists viability_t2 numeric,
  add column if not exists viability_t3 numeric;
