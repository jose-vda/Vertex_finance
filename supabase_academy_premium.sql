-- Vertex: Academia premium — perfil e RLS
-- Executar no SQL Editor do Supabase após rever políticas existentes.
-- Ver docs/academy-premium.md (grandfathering, webhooks).

-- 1) Tabela profiles (se ainda não existir, cria; se existir, adiciona colunas com ALTER abaixo)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz default now(),
  academy_unlocked_at timestamptz,
  academy_grandfathered boolean not null default false
);

-- Se a tabela já existia sem estas colunas:
alter table public.profiles
  add column if not exists academy_unlocked_at timestamptz;
alter table public.profiles
  add column if not exists academy_grandfathered boolean not null default false;

comment on column public.profiles.academy_unlocked_at is 'Preenchido pelo webhook (Stripe/RevenueCat) após compra validada.';
comment on column public.profiles.academy_grandfathered is 'Acesso vitalício grátis (ex.: utilizadores antes da data de corte).';

-- 2) Novo utilizador → linha em profiles (para leitura consistente em modo paid)

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

-- 3) RLS

alter table public.profiles enable row level security;

-- Utilizador autenticado lê só o próprio perfil
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Opcional: permitir ao utilizador criar a própria linha se o trigger falhou
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Não expor UPDATE ao cliente para campos de premium — só service role (Edge Function) atualiza
-- unlock. Se precisares de outros campos editáveis no perfil, cria política separada ou outra tabela.

-- 4) Grandfathering manual (exemplo): utilizadores registados antes de 2026-04-01
-- update public.profiles p
-- set academy_grandfathered = true
-- from auth.users u
-- where p.id = u.id and u.created_at < '2026-04-01T00:00:00Z';
