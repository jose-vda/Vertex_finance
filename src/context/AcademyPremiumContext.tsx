import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAcademyAccessMode, type AcademyAccessMode } from '../constants/academyAccess';
import { useAuth } from './AuthContext';

export type AcademyPremiumContextValue = {
  accessMode: AcademyAccessMode;
  /** Em modo `free`, sempre true para utilizador autenticado. Em `paid`, true se comprou ou grandfathered. */
  isAcademyUnlocked: boolean;
  loading: boolean;
  refreshAcademyEntitlement: () => Promise<void>;
};

const AcademyPremiumContext = createContext<AcademyPremiumContextValue | null>(null);

async function fetchProfileEntitlement(userId: string): Promise<{ unlocked: boolean }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('academy_unlocked_at, academy_grandfathered')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[AcademyPremium] profiles fetch:', error.message);
    return { unlocked: false };
  }
  if (!data) {
    return { unlocked: false };
  }
  const unlocked = !!(data.academy_grandfathered === true || data.academy_unlocked_at != null);
  return { unlocked };
}

export function AcademyPremiumProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const accessMode = useMemo(() => getAcademyAccessMode(), []);
  const [loading, setLoading] = useState(accessMode === 'paid');
  const [isAcademyUnlocked, setIsAcademyUnlocked] = useState(accessMode === 'free');

  const runFetch = useCallback(async () => {
    if (accessMode === 'free') {
      setLoading(false);
      setIsAcademyUnlocked(!!user);
      return;
    }
    if (!user?.id) {
      setLoading(false);
      setIsAcademyUnlocked(false);
      return;
    }
    setLoading(true);
    const { unlocked } = await fetchProfileEntitlement(user.id);
    setIsAcademyUnlocked(unlocked);
    setLoading(false);
  }, [accessMode, user?.id]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const refreshAcademyEntitlement = useCallback(async () => {
    await runFetch();
  }, [runFetch]);

  const value = useMemo<AcademyPremiumContextValue>(
    () => ({
      accessMode,
      isAcademyUnlocked: accessMode === 'free' ? !!user : isAcademyUnlocked,
      loading: accessMode === 'free' ? false : loading,
      refreshAcademyEntitlement,
    }),
    [accessMode, user, isAcademyUnlocked, loading, refreshAcademyEntitlement]
  );

  return <AcademyPremiumContext.Provider value={value}>{children}</AcademyPremiumContext.Provider>;
}

export function useAcademyPremium() {
  const ctx = useContext(AcademyPremiumContext);
  if (!ctx) throw new Error('useAcademyPremium must be used within AcademyPremiumProvider');
  return ctx;
}
