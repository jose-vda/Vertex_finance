export type ThemeMode = 'light' | 'dark';

/** Modo claro: tons “surface” sem branco puro em grandes áreas — menos brilho, melhor hierarquia. */
const colorsLight = {
  e500: '#10B981',
  e400: '#34D399',
  e600: '#059669',
  e50: '#ECFDF5',
  e100: '#D1FAE5',
  s900: '#0B1220',
  s800: '#1E293B',
  s700: '#334155',
  s500: '#64748B',
  s400: '#94A3B8',
  s300: '#CBD5E1',
  s200: '#D4DAE3',
  s100: '#E2E6ED',
  s50: '#EEF1F6',
  white: '#FAFBFC',
  red: '#EF4444',
  amber: '#F59E0B',
  amberDark: '#D97706',
  background: '#E6E9EF',
  cardBg: '#F3F5F9',
  tabBarBg: '#ECEFF4',
};

const colorsDark = {
  e500: '#34D399',
  e400: '#6EE7B7',
  e600: '#10B981',
  e50: '#064E3B',
  e100: '#065F46',
  s900: '#F1F5F9',
  s800: '#E2E8F0',
  s700: '#CBD5E1',
  s500: '#94A3B8',
  s400: '#64748B',
  s300: '#475569',
  s200: '#334155',
  s100: '#1E293B',
  s50: '#0F172A',
  white: '#0F172A',
  red: '#F87171',
  amber: '#FBBF24',
  amberDark: '#F59E0B',
  background: '#0F172A',
  cardBg: '#1E293B',
  tabBarBg: '#1E293B',
};

export function getColors(mode: ThemeMode) {
  return mode === 'dark' ? colorsDark : colorsLight;
}

/** @deprecated Use getColors(themeMode) or useTheme() instead */
export const colors = colorsLight;

export const INCOME_CATS = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other'];
export const EXPENSE_CATS = ['Housing', 'Food', 'Transport', 'Health', 'Entertainment', 'Shopping', 'Education', 'Investment', 'Other'];

export const MILESTONES = [
  { pct: 10, label: 'Financial Seedling', icon: 'leaf', sub: 'The first seed of wealth is planted.' },
  { pct: 25, label: 'Steady Climber', icon: 'trending-up', sub: 'Ascending the mountain with purpose.' },
  { pct: 50, label: 'Wealth Builder', icon: 'briefcase', sub: "You're halfway to the summit!" },
  { pct: 75, label: 'Portfolio Master', icon: 'shield', sub: 'Your financial fortress stands strong.' },
  { pct: 100, label: 'Financial Legend', icon: 'star', sub: 'You reached the peak. Legendary!' },
];

export const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
