import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssetType } from './priceService';

export type PriceAlertDirection = 'at_or_below' | 'at_or_above';

export type InvestmentPriceAlertRow = {
  id: string;
  user_id: string;
  asset_ticker: string;
  asset_name: string | null;
  asset_type: AssetType;
  target_price: number;
  direction: PriceAlertDirection;
  triggered_at: string | null;
  created_at: string;
};

/** Junta ativos da carteira com ativos que têm alertas ativos (para o mesmo fetch de preços). */
export function mergeAssetKeysForFetch(
  fromInvestments: { ticker: string; type: AssetType }[],
  fromAlerts: { ticker: string; type: AssetType }[]
): { ticker: string; type: AssetType }[] {
  const map = new Map<string, { ticker: string; type: AssetType }>();
  for (const a of [...fromInvestments, ...fromAlerts]) {
    const t = String(a.ticker || '').trim();
    if (!t) continue;
    const ty = String(a.type || 'stock').toLowerCase() as AssetType;
    const k = `${t.toUpperCase()}|${ty}`;
    if (!map.has(k)) map.set(k, { ticker: t, type: ty });
  }
  return Array.from(map.values());
}

export async function fetchActivePriceAlertAssetKeys(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ticker: string; type: AssetType }[]> {
  try {
    const { data, error } = await supabase
      .from('investment_price_alerts')
      .select('asset_ticker, asset_type')
      .eq('user_id', userId)
      .is('triggered_at', null);
    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist')
      ) {
        return [];
      }
      return [];
    }
    const rows = (data ?? []) as { asset_ticker: string; asset_type: string }[];
    return rows.map((r) => ({
      ticker: String(r.asset_ticker).trim(),
      type: String(r.asset_type).toLowerCase() as AssetType,
    }));
  } catch {
    return [];
  }
}

/** Após obter cotações, avalia alertas pendentes (uma chamada RPC por linha). */
export async function evaluateActivePriceAlerts(
  supabase: SupabaseClient,
  userId: string,
  prices: Record<string, number>
): Promise<void> {
  try {
    const { data: rows, error } = await supabase
      .from('investment_price_alerts')
      .select('id, asset_ticker')
      .eq('user_id', userId)
      .is('triggered_at', null);
    if (error || !rows?.length) return;

    for (const row of rows as { id: string; asset_ticker: string }[]) {
      const t = row.asset_ticker;
      const p =
        prices[t] ??
        prices[String(t).toUpperCase()] ??
        prices[String(t).toLowerCase()] ??
        0;
      if (!Number.isFinite(p) || p <= 0) continue;

      const { error: rpcErr } = await supabase.rpc('trigger_price_alert_if_met', {
        p_alert_id: row.id,
        p_observed_price: p,
      });
      if (rpcErr) {
        console.warn('[priceAlerts] trigger_price_alert_if_met:', rpcErr.message);
      }
    }
  } catch (e) {
    console.warn('[priceAlerts] evaluateActivePriceAlerts:', e);
  }
}

export async function fetchPriceAlertsForAsset(
  supabase: SupabaseClient,
  userId: string,
  ticker: string,
  assetType: AssetType
): Promise<{ data: InvestmentPriceAlertRow[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('investment_price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_ticker', ticker.toUpperCase())
      .eq('asset_type', assetType)
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    const mapped = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      asset_ticker: row.asset_ticker,
      asset_name: row.asset_name,
      asset_type: row.asset_type as AssetType,
      target_price: Number(row.target_price),
      direction: row.direction as PriceAlertDirection,
      triggered_at: row.triggered_at,
      created_at: row.created_at,
    }));
    return { data: mapped, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function fetchAllPriceAlerts(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: InvestmentPriceAlertRow[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('investment_price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    const mapped = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      asset_ticker: row.asset_ticker,
      asset_name: row.asset_name,
      asset_type: row.asset_type as AssetType,
      target_price: Number(row.target_price),
      direction: row.direction as PriceAlertDirection,
      triggered_at: row.triggered_at,
      created_at: row.created_at,
    }));
    return { data: mapped, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function createPriceAlert(
  supabase: SupabaseClient,
  userId: string,
  params: {
    asset_ticker: string;
    asset_name: string | null;
    asset_type: AssetType;
    target_price: number;
    direction: PriceAlertDirection;
  }
): Promise<{ ok: boolean; error: string | null }> {
  if (!Number.isFinite(params.target_price) || params.target_price <= 0) {
    return { ok: false, error: 'invalid_price' };
  }
  const { error } = await supabase.from('investment_price_alerts').insert({
    user_id: userId,
    asset_ticker: params.asset_ticker.toUpperCase(),
    asset_name: params.asset_name,
    asset_type: params.asset_type,
    target_price: params.target_price,
    direction: params.direction,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deletePriceAlert(
  supabase: SupabaseClient,
  userId: string,
  alertId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('investment_price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId);
  return !error;
}
