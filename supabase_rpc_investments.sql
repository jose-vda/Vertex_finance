-- Atomic investment operations (buy/sell) for launch hardening.
-- Run in Supabase SQL Editor.

create or replace function public.buy_asset(
  p_asset_ticker text,
  p_asset_name text,
  p_asset_type text,
  p_quantity numeric,
  p_average_purchase_price numeric,
  p_purchase_currency text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost numeric;
  v_investment_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Invalid quantity';
  end if;
  if p_average_purchase_price is null or p_average_purchase_price <= 0 then
    raise exception 'Invalid price';
  end if;

  v_cost := p_quantity * p_average_purchase_price;

  insert into public.transactions (user_id, type, description, amount, category)
  values (
    v_user_id,
    'expense',
    format('Investment: %s', upper(coalesce(p_asset_ticker, 'ASSET'))),
    v_cost,
    'Investment'
  );

  insert into public.user_investments (
    user_id,
    asset_ticker,
    asset_name,
    asset_type,
    quantity,
    average_purchase_price,
    purchase_currency,
    notes
  ) values (
    v_user_id,
    upper(trim(coalesce(p_asset_ticker, ''))),
    nullif(trim(coalesce(p_asset_name, '')), ''),
    lower(trim(coalesce(p_asset_type, 'stock'))),
    p_quantity,
    p_average_purchase_price,
    upper(trim(coalesce(p_purchase_currency, 'USD'))),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_investment_id;

  return jsonb_build_object('ok', true, 'investment_id', v_investment_id, 'cost', v_cost);
end;
$$;

grant execute on function public.buy_asset(text, text, text, numeric, numeric, text, text) to authenticated;


create or replace function public.sell_asset(
  p_investment_id uuid,
  p_quantity_to_sell numeric,
  p_mode text,
  p_auto_price numeric default null,
  p_manual_price numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inv public.user_investments%rowtype;
  v_unit_price numeric;
  v_sale_amount numeric;
  v_remaining numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_quantity_to_sell is null or p_quantity_to_sell <= 0 then
    raise exception 'Invalid quantity to sell';
  end if;

  select * into v_inv
  from public.user_investments
  where id = p_investment_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Investment not found';
  end if;
  if p_quantity_to_sell > v_inv.quantity then
    raise exception 'Quantity exceeds position';
  end if;

  if lower(coalesce(p_mode, 'auto')) = 'manual' then
    v_unit_price := p_manual_price;
  else
    v_unit_price := p_auto_price;
  end if;

  if v_unit_price is null or v_unit_price <= 0 then
    raise exception 'Invalid sell price';
  end if;

  v_sale_amount := p_quantity_to_sell * v_unit_price;
  v_remaining := v_inv.quantity - p_quantity_to_sell;

  insert into public.transactions (user_id, type, description, amount, category)
  values (
    v_user_id,
    'income',
    format('Sale: %s', upper(v_inv.asset_ticker)),
    v_sale_amount,
    'Investment'
  );

  if v_remaining <= 0 then
    delete from public.user_investments where id = v_inv.id and user_id = v_user_id;
  else
    update public.user_investments
    set quantity = v_remaining,
        updated_at = now()
    where id = v_inv.id
      and user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'sale_amount', v_sale_amount,
    'remaining_quantity', greatest(v_remaining, 0)
  );
end;
$$;

grant execute on function public.sell_asset(uuid, numeric, text, numeric, numeric) to authenticated;
