-- ============================================================
-- Phase 1: adicionar default_surety_pct em auctioneer_settings
-- Cole no SQL Editor do Supabase e clique RUN.
-- Idempotente (if not exists) — pode rodar múltiplas vezes.
-- ============================================================

alter table public.auctioneer_settings
  add column if not exists default_surety_pct numeric;
