import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale, CurrencyCode, TranslationKey, translations } from '../constants/i18n';
import { ThemeMode, getColors } from '../constants/theme';

const STORAGE_LOCALE = '@vertex_locale';
const STORAGE_CURRENCY = '@vertex_currency';
const STORAGE_THEME = '@vertex_theme';

type SettingsContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  t: (key: TranslationKey | string) => string;
  formatCurrency: (n: number) => string;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [savedLocale, savedCurrency, savedTheme] = await Promise.all([
          AsyncStorage.getItem(STORAGE_LOCALE),
          AsyncStorage.getItem(STORAGE_CURRENCY),
          AsyncStorage.getItem(STORAGE_THEME),
        ]);
        if (!mounted) return;
        if (savedLocale === 'pt' || savedLocale === 'en') setLocaleState(savedLocale);
        if (savedCurrency === 'USD' || savedCurrency === 'EUR' || savedCurrency === 'GBP' || savedCurrency === 'BRL') setCurrencyState(savedCurrency);
        if (savedTheme === 'light' || savedTheme === 'dark') setThemeModeState(savedTheme);
      } catch (_) {
        // ignore storage errors
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    void AsyncStorage.setItem(STORAGE_LOCALE, l);
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    void AsyncStorage.setItem(STORAGE_CURRENCY, c);
  }, []);

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    void AsyncStorage.setItem(STORAGE_THEME, m);
  }, []);

  const t = useCallback(
    (key: TranslationKey | string) => {
      const loc = locale === 'pt' ? 'pt' : 'en';
      const dict = translations[loc];
      if (!dict) return String(key);
      const val = (dict as Record<string, unknown>)[key];
      return val != null ? String(val) : String(key);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (n: number) => {
      const num = Number(n);
      if (!Number.isFinite(num)) return '0';
      try {
        return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-US', {
          style: 'currency',
          currency: currency || 'USD',
          maximumFractionDigits: 0,
        }).format(num);
      } catch {
        return String(num);
      }
    },
    [locale, currency]
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      locale,
      setLocale,
      currency,
      setCurrency,
      themeMode,
      setThemeMode,
      t,
      formatCurrency,
    }),
    [locale, setLocale, currency, setCurrency, themeMode, setThemeMode, t, formatCurrency]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
];
