-- Vertex: interessados em notificação quando uma funcionalidade estiver pronta (ex.: contas bancárias)
-- Executar no SQL Editor do Supabase.
-- Depois, quando lançares a funcionalidade, corre o script: node scripts/notify-feature-launch.mjs
-- (com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no ambiente). Ver docs/feature-notify-bank-accounts.md

create table if not exists public.feature_notify_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature_key text not null,
  expo_push_token text,
  platform text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notified_at timestamptz,
  constraint feature_notify_signups_user_feature unique (user_id, feature_key)
);

create index if not exists feature_notify_signups_feature_pending_idx
  on public.feature_notify_signups (feature_key)
  where notified_at is null;

comment on table public.feature_notify_signups is 'Utilizadores que pediram aviso push quando feature_key (ex. bank_accounts) estiver disponível.';
comment on column public.feature_notify_signups.expo_push_token is 'Token Expo Push; pode ser null (web, simulador ou permissão negada) — o interesse fica registado.';

-- updated_at automático
create or replace function public.set_feature_notify_signups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_feature_notify_signups_updated on public.feature_notify_signups;
create trigger tr_feature_notify_signups_updated
  before update on public.feature_notify_signups
  for each row
  execute procedure public.set_feature_notify_signups_updated_at();

alter table public.feature_notify_signups enable row level security;

drop policy if exists "feature_notify_select_own" on public.feature_notify_signups;
create policy "feature_notify_select_own"
  on public.feature_notify_signups for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "feature_notify_insert_own" on public.feature_notify_signups;
create policy "feature_notify_insert_own"
  on public.feature_notify_signups for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "feature_notify_update_own" on public.feature_notify_signups;
create policy "feature_notify_update_own"
  on public.feature_notify_signups for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "feature_notify_delete_own" on public.feature_notify_signups;
create policy "feature_notify_delete_own"
  on public.feature_notify_signups for delete
  to authenticated
  using (auth.uid() = user_id);
