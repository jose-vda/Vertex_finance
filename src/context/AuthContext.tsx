import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as Linking from 'expo-linking';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  created_at: string;
  desc?: string;
  date?: string;
};

export type HistoryPoint = { date: string; value: number };

type AppState = {
  transactions: Transaction[];
  netWorth: number;
  goal: number;
  goal_reason: string | null;
  goal_years: number | null;
  goal_set_at: string | null;
  goal_edit_count: number;
  history: HistoryPoint[];
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  appState: AppState;
  recoveryMode: boolean;
  setRecoveryMode: (value: boolean) => void;
  loadUserData: () => Promise<void>;
  addTransaction: (tx: { type: 'income' | 'expense'; desc: string; amount: number; category: string }) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  saveGoal: (goal: number, goal_reason?: string | null, goal_years?: number | null, fromEdit?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultState: AppState = { transactions: [], netWorth: 0, goal: 0, goal_reason: null, goal_years: null, goal_set_at: null, goal_edit_count: 0, history: [] };
const INITIAL_LOAD_TIMEOUT_MS = 8000;
const MAX_HISTORY_POINTS = 14;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    async function handleRecoveryUrl(url: string) {
      if (!url || !url.includes('type=recovery')) return;
      const hash = url.split('#')[1];
      if (!hash) return;
      try {
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          setRecoveryMode(true);
        }
      } catch (e) {
        console.error('Recovery URL parse error', e);
      }
    }
    Linking.getInitialURL().then((url) => {
      if (url) handleRecoveryUrl(url);
    });
    const sub = Linking.addEventListener('url', (event) => {
      handleRecoveryUrl(event.url);
    });
    return () => sub.remove();
  }, []);

  const loadUserData = useCallback(async (onLoaded?: () => void) => {
    let u;
    try {
      const res = await supabase.auth.getUser();
      u = res?.data?.user ?? null;
    } catch {
      onLoaded?.();
      return;
    }
    if (!u) {
      onLoaded?.();
      return;
    }
    try {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false });
      const transactions: Transaction[] = (txs || []).map((t: any) => ({
        ...t,
        desc: t.description,
        date: t.created_at,
      }));

      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle();

      if (settingsError) {
        console.error('[loadUserData] Failed to load user_settings:', settingsError.message, settingsError.details);
      }

      let goal = 0,
        goal_reason: string | null = null,
        goal_years: number | null = null,
        goal_set_at: string | null = null,
        goal_edit_count = 0,
        history: HistoryPoint[] = [];
      if (settings) {
        goal = Number(settings.goal) || 0;
        goal_reason = (settings as { goal_reason?: string }).goal_reason ?? null;
        const rawYears = (settings as { goal_years?: number }).goal_years;
        goal_years = typeof rawYears === 'number' && rawYears > 0 ? rawYears : null;
        const rawSetAt = (settings as { goal_set_at?: string | null }).goal_set_at;
        goal_set_at = rawSetAt != null && rawSetAt !== '' ? String(rawSetAt) : null;
        const rawCount = (settings as { goal_edit_count?: number }).goal_edit_count;
        goal_edit_count = typeof rawCount === 'number' && rawCount >= 0 ? rawCount : 0;
        const raw = settings.history;
        history = Array.isArray(raw) ? raw : [];
      }

      const netWorth = transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);

      setAppState({ transactions, netWorth, goal, goal_reason, goal_years, goal_set_at, goal_edit_count, history });
      onLoaded?.();
    } catch (e) {
      console.error('Load error', e);
      onLoaded?.();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, INITIAL_LOAD_TIMEOUT_MS);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        const s = data?.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await loadUserData(() => {
            if (!cancelled) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;
      setSession(s);
      setUser(s?.user ?? null);
      // USER_UPDATED é disparado ao mudar avatar/metadata — não recarregar tudo
      if (event === 'USER_UPDATED') return;
      if (s?.user) {
        setLoading(true);
        await loadUserData(() => {
          if (!cancelled) setLoading(false);
        });
      } else {
        setAppState(defaultState);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [loadUserData]);

  const saveSettings = useCallback(async (overrides?: Partial<AppState>) => {
    if (!user) return;
    const state = overrides ? { ...appState, ...overrides } : appState;
    const payload = {
      user_id: user.id,
      goal: state.goal,
      goal_reason: state.goal_reason,
      goal_years: state.goal_years,
      goal_set_at: state.goal_set_at,
      goal_edit_count: state.goal_edit_count,
      net_worth: state.netWorth,
      history: state.history ?? [],
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
      if (!error) return;
      console.error(`[saveSettings] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }, [user, appState]);

  const addTransaction = useCallback(
    async (tx: { type: 'income' | 'expense'; desc: string; amount: number; category: string }) => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: tx.type,
          description: tx.desc,
          amount: tx.amount,
          category: tx.category,
        })
        .select()
        .single();
      if (error) {
        console.error('Add transaction error:', error.message, error.details);
        return false;
      }
      const newTx: Transaction = {
        id: data.id,
        type: data.type,
        description: data.description ?? tx.desc,
        amount: Number(data.amount),
        category: data.category ?? tx.category,
        created_at: data.created_at ?? new Date().toISOString(),
        desc: tx.desc,
        date: data.created_at ?? new Date().toISOString(),
      };
      const newNet = appState.netWorth + (tx.type === 'income' ? tx.amount : -tx.amount);
      const label = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newHistory = [...appState.history, { date: label, value: newNet }].slice(-MAX_HISTORY_POINTS);
      const newTransactions = [newTx, ...appState.transactions];
      setAppState({
        transactions: newTransactions,
        netWorth: newNet,
        goal: appState.goal,
        goal_reason: appState.goal_reason,
        goal_years: appState.goal_years,
        goal_set_at: appState.goal_set_at,
        goal_edit_count: appState.goal_edit_count,
        history: newHistory,
      });
      saveSettings({ transactions: newTransactions, netWorth: newNet, history: newHistory });
      return true;
    },
    [user, appState, saveSettings]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      const tx = appState.transactions.find((t) => t.id === id);
      if (!tx || !user) return false;
      const { error, count } = await supabase.from('transactions').delete({ count: 'exact' }).eq('id', id).eq('user_id', user.id);
      if (error || count === 0) {
        console.error('[deleteTransaction] error:', error?.message ?? 'No rows deleted (check RLS policy)');
        return false;
      }
      const newNet = appState.netWorth + (tx.type === 'income' ? -Number(tx.amount) : Number(tx.amount));
      const label = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newHistory = [...appState.history, { date: label, value: newNet }].slice(-MAX_HISTORY_POINTS);
      const newTxList = appState.transactions.filter((t) => t.id !== id);
      setAppState({ transactions: newTxList, netWorth: newNet, goal: appState.goal, goal_reason: appState.goal_reason, goal_years: appState.goal_years, goal_set_at: appState.goal_set_at, goal_edit_count: appState.goal_edit_count, history: newHistory });
      saveSettings({ transactions: newTxList, netWorth: newNet, history: newHistory });
      return true;
    },
    [user, appState, saveSettings]
  );

  const saveGoal = useCallback(
    async (goal: number, goal_reason?: string | null, goal_years?: number | null, fromEdit?: boolean) => {
      if (!user || goal <= 0) return;
      const reason = goal_reason !== undefined ? goal_reason : appState.goal_reason;
      const years = goal_years !== undefined ? goal_years : appState.goal_years;
      const currentCount = appState.goal_edit_count;
      if (fromEdit && currentCount >= 3) return;
      const newCount = fromEdit ? currentCount + 1 : currentCount;
      const setAt = new Date().toISOString();

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            goal,
            goal_reason: reason,
            goal_years: years,
            goal_set_at: setAt,
            goal_edit_count: newCount,
            net_worth: appState.netWorth,
            history: appState.history ?? [],
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('[saveGoal] Failed to save goal to database:', error.message, error.details);
        throw new Error(error.message);
      }

      setAppState((s) => ({ ...s, goal, goal_reason: reason ?? s.goal_reason, goal_years: years ?? s.goal_years, goal_set_at: setAt, goal_edit_count: newCount }));
    },
    [user, appState.netWorth, appState.history, appState.goal_reason, appState.goal_years, appState.goal_edit_count]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAppState(defaultState);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user,
      loading,
      appState,
      recoveryMode,
      setRecoveryMode,
      loadUserData,
      addTransaction,
      deleteTransaction,
      saveGoal,
      signOut,
    }),
    [session, user, loading, appState, recoveryMode, loadUserData, addTransaction, deleteTransaction, saveGoal, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Helpers used by screens
export function tInc(transactions: Transaction[]) {
  return transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
}
export function tExp(transactions: Transaction[]) {
  return transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
}
export function nSav(transactions: Transaction[]) {
  return tInc(transactions) - tExp(transactions);
}
export function goalPct(netWorth: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((netWorth / goal) * 100));
}
