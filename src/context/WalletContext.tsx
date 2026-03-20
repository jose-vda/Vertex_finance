import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { fetchAllPrices, fetchUsdBrlRate } from '../lib/priceService';

export type AssetType = 'stock' | 'crypto' | 'commodity' | 'index';
export type PurchaseCurrency = 'USD' | 'BRL' | 'EUR';

export type Investment = {
  id: string;
  asset_ticker: string;
  asset_name: string | null;
  asset_type: AssetType;
  quantity: number;
  average_purchase_price: number;
  purchase_currency: PurchaseCurrency;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EnrichedInvestment = Investment & {
  current_price: number;
  position_value: number;
  cost_basis: number;
  gain_loss: number;
  gain_loss_pct: number;
};

export type PortfolioAllocation = {
  type: AssetType;
  label: string;
  value: number;
  percentage: number;
  color: string;
};

export type PortfolioSummary = {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  allocations: PortfolioAllocation[];
  investments: EnrichedInvestment[];
  usdBrlRate: number;
};

export type SellPriceMode = 'auto' | 'manual';

type WalletContextType = {
  investments: Investment[];
  portfolio: PortfolioSummary | null;
  loading: boolean;
  refreshing: boolean;
  loadInvestments: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  addInvestment: (inv: Omit<Investment, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean | 'insufficient_balance'>;
  updateInvestment: (id: string, inv: Partial<Omit<Investment, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteInvestment: (id: string) => Promise<boolean>;
  sellInvestment: (params: {
    id: string;
    quantityToSell: number;
    mode: SellPriceMode;
    manualPrice?: number;
  }) => Promise<boolean>;
  achievedMilestones: string[];
};

const ALLOCATION_COLORS: Record<AssetType, string> = {
  crypto: '#F59E0B',
  stock: '#3B82F6',
  commodity: '#10B981',
  index: '#8B5CF6',
};

const ALLOCATION_LABELS: Record<AssetType, string> = {
  crypto: 'Crypto',
  stock: 'Stocks',
  commodity: 'Commodities',
  index: 'Indices',
};

const INVESTMENT_MILESTONES = [
  { id: 'first_stock', condition: (invs: Investment[]) => invs.some((i) => i.asset_type === 'stock') },
  { id: 'first_crypto', condition: (invs: Investment[]) => invs.some((i) => i.asset_type === 'crypto') },
  { id: 'first_commodity', condition: (invs: Investment[]) => invs.some((i) => i.asset_type === 'commodity') },
  { id: 'first_index', condition: (invs: Investment[]) => invs.some((i) => i.asset_type === 'index') },
  {
    id: 'diversified_portfolio',
    condition: (invs: Investment[]) => {
      const types = new Set(invs.map((i) => i.asset_type));
      return types.size >= 2;
    },
  },
  {
    id: 'fully_diversified',
    condition: (invs: Investment[]) => {
      const types = new Set(invs.map((i) => i.asset_type));
      return types.size >= 3;
    },
  },
  { id: 'five_assets', condition: (invs: Investment[]) => invs.length >= 5 },
  { id: 'ten_assets', condition: (invs: Investment[]) => invs.length >= 10 },
];

function preciseMultiply(a: number, b: number): number {
  const sa = a.toFixed(10);
  const sb = b.toFixed(10);
  const da = (sa.split('.')[1] || '').length;
  const db = (sb.split('.')[1] || '').length;
  const factor = Math.pow(10, da + db);
  const ia = Math.round(a * Math.pow(10, da));
  const ib = Math.round(b * Math.pow(10, db));
  return (ia * ib) / factor;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, appState, addTransaction } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [usdBrlRate, setUsdBrlRate] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id;

  const reloadInvestmentsOnly = useCallback(async (): Promise<Investment[]> => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('user_investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[WalletContext] reload-only error:', error.message);
      return [];
    }
    const invs: Investment[] = (data || []).map((row: any) => ({
      id: row.id,
      asset_ticker: row.asset_ticker,
      asset_name: row.asset_name,
      asset_type: row.asset_type as AssetType,
      quantity: parseFloat(row.quantity) || 0,
      average_purchase_price: parseFloat(row.average_purchase_price) || 0,
      purchase_currency: (row.purchase_currency || 'USD') as PurchaseCurrency,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    setInvestments(invs);
    return invs;
  }, [userId]);

  const loadInvestments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[WalletContext] load error:', error.message);
        return;
      }
      const invs: Investment[] = (data || []).map((row: any) => ({
        id: row.id,
        asset_ticker: row.asset_ticker,
        asset_name: row.asset_name,
        asset_type: row.asset_type as AssetType,
        quantity: parseFloat(row.quantity) || 0,
        average_purchase_price: parseFloat(row.average_purchase_price) || 0,
        purchase_currency: (row.purchase_currency || 'USD') as PurchaseCurrency,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      setInvestments(invs);

      if (invs.length > 0) {
        const assets = invs.map((i) => ({
          ticker: String(i.asset_ticker).trim(),
          type: String(i.asset_type).toLowerCase() as AssetType,
        }));
        const uniqueAssets = assets.filter(
          (a, idx, arr) => arr.findIndex((b) => b.ticker.toUpperCase() === a.ticker.toUpperCase()) === idx
        );
        const [fetchedPrices, rate] = await Promise.all([
          fetchAllPrices(uniqueAssets),
          fetchUsdBrlRate().catch(() => usdBrlRate),
        ]);
        setPrices(fetchedPrices);
        setUsdBrlRate(rate);
      }
    } catch (e) {
      console.error('[WalletContext] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshPricesForInvestments = useCallback(async (invs: Investment[]) => {
    if (invs.length === 0) {
      setPrices({});
      return;
    }
    const assets = invs.map((i) => ({
      ticker: String(i.asset_ticker).trim(),
      type: String(i.asset_type).toLowerCase() as AssetType,
    }));
    const uniqueAssets = assets.filter(
      (a, idx, arr) => arr.findIndex((b) => b.ticker.toUpperCase() === a.ticker.toUpperCase()) === idx
    );
    const [fetchedPrices, rate] = await Promise.all([
      fetchAllPrices(uniqueAssets),
      fetchUsdBrlRate().catch(() => usdBrlRate),
    ]);
    setPrices(fetchedPrices);
    setUsdBrlRate(rate);
  }, [usdBrlRate]);

  const refreshPrices = useCallback(async () => {
    if (investments.length === 0) return;
    setRefreshing(true);
    try {
      await refreshPricesForInvestments(investments);
    } catch (e) {
      console.error('[WalletContext] refresh prices error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [investments, refreshPricesForInvestments]);

  useEffect(() => {
    let cancelled = false;
    if (userId) {
      loadInvestments().then(() => {
        if (cancelled) return; // Prevent state updates after unmount
      });
    } else {
      setInvestments([]);
      setPrices({});
    }
    return () => { cancelled = true; };
  }, [userId, loadInvestments]);

  const portfolio = useMemo<PortfolioSummary | null>(() => {
    if (investments.length === 0) return null;

    let totalValue = 0;
    let totalCost = 0;
    const byType: Record<AssetType, number> = { stock: 0, crypto: 0, commodity: 0, index: 0 };

    const enriched: EnrichedInvestment[] = investments.map((inv) => {
      const ticker = String(inv.asset_ticker || '').trim();
      const currentPrice = prices[inv.asset_ticker] ?? prices[ticker] ?? prices[ticker.toUpperCase()] ?? prices[ticker.toLowerCase()] ?? 0;
      const positionValue = preciseMultiply(inv.quantity, currentPrice);
      const costBasis = preciseMultiply(inv.quantity, inv.average_purchase_price);
      const gainLoss = positionValue - costBasis;
      const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      totalValue += positionValue;
      totalCost += costBasis;
      byType[inv.asset_type] = (byType[inv.asset_type] || 0) + positionValue;

      return {
        ...inv,
        current_price: currentPrice,
        position_value: positionValue,
        cost_basis: costBasis,
        gain_loss: gainLoss,
        gain_loss_pct: gainLossPct,
      };
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const allocations: PortfolioAllocation[] = (['crypto', 'stock', 'commodity', 'index'] as AssetType[])
      .filter((type) => byType[type] > 0)
      .map((type) => ({
        type,
        label: ALLOCATION_LABELS[type],
        value: byType[type],
        percentage: totalValue > 0 ? (byType[type] / totalValue) * 100 : 0,
        color: ALLOCATION_COLORS[type],
      }));

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPct,
      allocations,
      investments: enriched,
      usdBrlRate,
    };
  }, [investments, prices, usdBrlRate]);

  const achievedMilestones = useMemo(() => {
    return INVESTMENT_MILESTONES.filter((m) => m.condition(investments)).map((m) => m.id);
  }, [investments]);

  const addInvestment = useCallback(
    async (inv: Omit<Investment, 'id' | 'created_at' | 'updated_at'>): Promise<boolean | 'insufficient_balance'> => {
      if (!userId) return false;

      const costBasis = preciseMultiply(inv.quantity, inv.average_purchase_price);

      if (appState.netWorth < costBasis) {
        return 'insufficient_balance';
      }

      // Preferred path: atomic backend RPC (buy + expense transaction)
      const { data: rpcData, error: rpcError } = await supabase.rpc('buy_asset', {
        p_asset_ticker: inv.asset_ticker.toUpperCase(),
        p_asset_name: inv.asset_name,
        p_asset_type: inv.asset_type,
        p_quantity: inv.quantity,
        p_average_purchase_price: inv.average_purchase_price,
        p_purchase_currency: inv.purchase_currency,
        p_notes: inv.notes,
      });
      if (!rpcError && rpcData?.ok) {
        const invs = await reloadInvestmentsOnly();
        void refreshPricesForInvestments(invs);
        return true;
      }

      // Fallback path (legacy): two-step client operation
      const txOk = await addTransaction({
        type: 'expense',
        desc: `Investment: ${inv.asset_ticker.toUpperCase()}`,
        amount: costBasis,
        category: 'Investment',
      });
      if (!txOk) return false;

      const { error } = await supabase.from('user_investments').insert({
        user_id: userId,
        asset_ticker: inv.asset_ticker.toUpperCase(),
        asset_name: inv.asset_name,
        asset_type: inv.asset_type,
        quantity: inv.quantity,
        average_purchase_price: inv.average_purchase_price,
        purchase_currency: inv.purchase_currency,
        notes: inv.notes,
      });
      if (error) {
        console.error('[WalletContext] add error:', error.message);
        // Rollback: re-add the cost as income since the investment failed
        const rollbackOk = await addTransaction({
          type: 'income',
          desc: `Rollback: ${inv.asset_ticker.toUpperCase()}`,
          amount: costBasis,
          category: 'Investment',
        });
        if (!rollbackOk) {
          console.error('[WalletContext] rollback income failed after addInvestment error');
        }
        return false;
      }
      const invs = await reloadInvestmentsOnly();
      void refreshPricesForInvestments(invs);
      return true;
    },
    [userId, appState.netWorth, addTransaction, loadInvestments, reloadInvestmentsOnly, refreshPrices, refreshPricesForInvestments]
  );

  const updateInvestment = useCallback(
    async (id: string, updates: Partial<Omit<Investment, 'id' | 'created_at' | 'updated_at'>>) => {
      if (!userId) return false;
      const { error } = await supabase
        .from('user_investments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);
      if (error) {
        console.error('[WalletContext] update error:', error.message);
        return false;
      }
      const invs = await reloadInvestmentsOnly();
      void refreshPricesForInvestments(invs);
      return true;
    },
    [userId, loadInvestments, reloadInvestmentsOnly, refreshPrices, refreshPricesForInvestments]
  );

  const deleteInvestment = useCallback(
    async (id: string) => {
      if (!userId) return false;

      const enriched = portfolio?.investments.find((i) => i.id === id);

      // Create sale transaction FIRST to avoid data inconsistency
      if (enriched && enriched.position_value > 0) {
        const txOk = await addTransaction({
          type: 'income',
          desc: `Sale: ${enriched.asset_ticker}`,
          amount: enriched.position_value,
          category: 'Investment',
        });
        if (!txOk) {
          console.error('[WalletContext] failed to create sale transaction');
          return false;
        }
      }

      const { error } = await supabase
        .from('user_investments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) {
        console.error('[WalletContext] delete error:', error.message);
        // Compensate credited sale if delete failed
        if (enriched && enriched.position_value > 0) {
          const compensateOk = await addTransaction({
            type: 'expense',
            desc: `Rollback sale: ${enriched.asset_ticker}`,
            amount: enriched.position_value,
            category: 'Investment',
          });
          if (!compensateOk) {
            console.error('[WalletContext] rollback expense failed after deleteInvestment error');
          }
        }
        return false;
      }

      const invs = await reloadInvestmentsOnly();
      void refreshPricesForInvestments(invs);
      return true;
    },
    [userId, portfolio, addTransaction, loadInvestments, reloadInvestmentsOnly, refreshPrices, refreshPricesForInvestments]
  );

  const sellInvestment = useCallback(
    async ({ id, quantityToSell, mode, manualPrice }: { id: string; quantityToSell: number; mode: SellPriceMode; manualPrice?: number }) => {
      if (!userId) return false;
      if (!Number.isFinite(quantityToSell) || quantityToSell <= 0) return false;

      const enriched = portfolio?.investments.find((i) => i.id === id);
      if (!enriched) return false;
      if (quantityToSell > enriched.quantity) return false;

      const unitPrice =
        mode === 'manual'
          ? (Number.isFinite(manualPrice) ? Number(manualPrice) : NaN)
          : enriched.current_price;

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        console.error('[WalletContext] invalid sell unit price');
        return false;
      }

      const saleAmount = preciseMultiply(quantityToSell, unitPrice);
      if (!Number.isFinite(saleAmount) || saleAmount <= 0) return false;

      // Preferred path: atomic backend RPC (income transaction + position mutation)
      const { data: rpcData, error: rpcError } = await supabase.rpc('sell_asset', {
        p_investment_id: id,
        p_quantity_to_sell: quantityToSell,
        p_mode: mode,
        p_auto_price: mode === 'auto' ? unitPrice : null,
        p_manual_price: mode === 'manual' ? unitPrice : null,
      });
      if (!rpcError && rpcData?.ok) {
        const invs = await reloadInvestmentsOnly();
        void refreshPricesForInvestments(invs);
        return true;
      }

      // Fallback path (legacy): two-step client operation
      const txOk = await addTransaction({
        type: 'income',
        desc: `Sale: ${enriched.asset_ticker}`,
        amount: saleAmount,
        category: 'Investment',
      });
      if (!txOk) {
        console.error('[WalletContext] failed to create sale transaction');
        return false;
      }

      const remainingQty = enriched.quantity - quantityToSell;
      if (remainingQty <= 0) {
        const { error } = await supabase
          .from('user_investments')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) {
          console.error('[WalletContext] sell delete error:', error.message);
          const compensateOk = await addTransaction({
            type: 'expense',
            desc: `Rollback sale: ${enriched.asset_ticker}`,
            amount: saleAmount,
            category: 'Investment',
          });
          if (!compensateOk) {
            console.error('[WalletContext] rollback expense failed after sell delete error');
          }
          return false;
        }
      } else {
        const { error } = await supabase
          .from('user_investments')
          .update({ quantity: remainingQty })
          .eq('id', id)
          .eq('user_id', userId);
        if (error) {
          console.error('[WalletContext] sell update error:', error.message);
          const compensateOk = await addTransaction({
            type: 'expense',
            desc: `Rollback sale: ${enriched.asset_ticker}`,
            amount: saleAmount,
            category: 'Investment',
          });
          if (!compensateOk) {
            console.error('[WalletContext] rollback expense failed after sell update error');
          }
          return false;
        }
      }

      const invs = await reloadInvestmentsOnly();
      void refreshPricesForInvestments(invs);
      return true;
    },
    [userId, portfolio, addTransaction, loadInvestments, reloadInvestmentsOnly, refreshPrices, refreshPricesForInvestments]
  );

  const value = useMemo<WalletContextType>(
    () => ({
      investments,
      portfolio,
      loading,
      refreshing,
      loadInvestments,
      refreshPrices,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      sellInvestment,
      achievedMilestones,
    }),
    [investments, portfolio, loading, refreshing, loadInvestments, refreshPrices, addInvestment, updateInvestment, deleteInvestment, sellInvestment, achievedMilestones]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
