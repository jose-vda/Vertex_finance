-- Alertas de preço por ativo → disparam linha em app_notifications quando o preço observado
-- cumpre o alvo (comparação feita na app + RPC; o preço vem da mesma API que a carteira).
-- Executar no SQL Editor do Supabase após supabase_app_notifications.sql.

create table if not exists public.investment_price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_ticker text not null,
  asset_name text,
  asset_type text not null check (asset_type in ('stock', 'crypto', 'commodity', 'index')),
  target_price numeric(20, 8) not null check (target_price > 0),
  direction text not null check (direction in ('at_or_below', 'at_or_above')),
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists investment_price_alerts_user_active_idx
  on public.investment_price_alerts (user_id)
  where triggered_at is null;

create index if not exists investment_price_alerts_user_created_idx
  on public.investment_price_alerts (user_id, created_at desc);

comment on table public.investment_price_alerts is 'Metas de preço definidas pelo utilizador; disparam notificação in-app quando o preço observado cruza o alvo.';

alter table public.investment_price_alerts enable row level security;

drop policy if exists "price_alerts_select_own" on public.investment_price_alerts;
create policy "price_alerts_select_own"
  on public.investment_price_alerts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "price_alerts_insert_own" on public.investment_price_alerts;
create policy "price_alerts_insert_own"
  on public.investment_price_alerts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "price_alerts_update_own" on public.investment_price_alerts;
create policy "price_alerts_update_own"
  on public.investment_price_alerts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "price_alerts_delete_own" on public.investment_price_alerts;
create policy "price_alerts_delete_own"
  on public.investment_price_alerts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Compara alvo com preço observado (enviado pela app após fetch das cotações).
-- Insere em app_notifications com SECURITY DEFINER (cliente não tem INSERT em app_notifications).
create or replace function public.trigger_price_alert_if_met(
  p_alert_id uuid,
  p_observed_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.investment_price_alerts%rowtype;
  met boolean;
  obs numeric;
begin
  select * into r
  from public.investment_price_alerts
  where id = p_alert_id and user_id = auth.uid()
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if r.triggered_at is not null then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  obs := round(coalesce(p_observed_price, 0)::numeric, 8);
  if obs <= 0 then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'bad_price');
  end if;

  met := case r.direction
    when 'at_or_below' then obs <= r.target_price
    when 'at_or_above' then obs >= r.target_price
    else false
  end;

  if not met then
    return jsonb_build_object('ok', true, 'triggered', false);
  end if;

  update public.investment_price_alerts
  set triggered_at = now()
  where id = p_alert_id;

  insert into public.app_notifications (user_id, title, body, notification_type)
  values (
    r.user_id,
    'Price alert: ' || r.asset_ticker,
    coalesce(nullif(trim(r.asset_name), ''), r.asset_ticker)
      || ' reached your target. Current '
      || trim(to_char(obs, 'FM9999999999999990.99999999'))
      || ', target '
      || trim(to_char(r.target_price, 'FM9999999999999990.99999999'))
      || case r.direction when 'at_or_below' then ' (at or below).' else ' (at or above).' end,
    'price_alert'
  );

  return jsonb_build_object('ok', true, 'triggered', true);
end;
$$;

revoke all on function public.trigger_price_alert_if_met(uuid, numeric) from public;
grant execute on function public.trigger_price_alert_if_met(uuid, numeric) to authenticated;
