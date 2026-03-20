import React, { createContext, useContext, useMemo } from 'react';
import { getColors, type ThemeMode } from '../constants/theme';
import { useSettings } from './SettingsContext';

type ThemeContextType = {
  colors: ReturnType<typeof getColors>;
  isDark: boolean;
  themeMode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useSettings();
  const value = useMemo(
    () => ({
      colors: getColors(themeMode),
      isDark: themeMode === 'dark',
      themeMode,
    }),
    [themeMode]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
