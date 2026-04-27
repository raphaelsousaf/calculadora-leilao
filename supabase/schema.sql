-- ============================================================
-- Calculadora de Leilão — schema inicial
-- Cole tudo no SQL Editor do Supabase e clique RUN
-- ============================================================

-- 1. PROFILES (dados do usuário, criado automaticamente no signup)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  whatsapp    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. AUCTIONEER_SETTINGS (dados que aparecem no PDF/WhatsApp)
create table if not exists public.auctioneer_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  nome        text,
  telefone    text,
  email       text,
  documento   text,
  default_surety_pct numeric,
  updated_at  timestamptz not null default now()
);

-- 3. CALCULATIONS (histórico de cálculos salvos)
create table if not exists public.calculations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  calc        jsonb not null,
  meta        jsonb not null default '{}'::jsonb,
  saved_at    timestamptz not null default now()
);
create index if not exists calculations_user_idx on public.calculations(user_id, saved_at desc);

-- 4. ROW LEVEL SECURITY — usuário só vê/edita os próprios dados
alter table public.profiles            enable row level security;
alter table public.auctioneer_settings enable row level security;
alter table public.calculations        enable row level security;

drop policy if exists "own profile select" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "own settings all" on public.auctioneer_settings;
create policy "own settings all" on public.auctioneer_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own calcs all" on public.calculations;
create policy "own calcs all" on public.calculations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. TRIGGER — cria a row em profiles automaticamente no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, whatsapp)
  values (new.id, new.raw_user_meta_data->>'whatsapp');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. TRIGGER — atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.auctioneer_settings;
create trigger settings_touch before update on public.auctioneer_settings
  for each row execute function public.touch_updated_at();
