import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, Alert, Platform } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth, type Transaction } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWallet, type AssetType } from '../context/WalletContext';

type RangeKey = 'month' | '3m' | '6m' | 'year';

type AnalyticsSectionKey = 'recentTx' | 'cashflow' | 'expenses' | 'allocation' | 'history';

const ANALYTICS_SECTIONS_VISIBLE_DEFAULT: Record<AnalyticsSectionKey, boolean> = {
  recentTx: true,
  cashflow: true,
  expenses: true,
  allocation: true,
  history: true,
};

function getTxTime(tx: Transaction): number {
  const raw = tx.created_at || tx.date;
  if (!raw) return 0;
  return new Date(raw).getTime();
}

function getFromTime(range: RangeKey): number {
  const now = new Date();
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (range === '3m') {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.getTime();
  }
  if (range === '6m') {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.getTime();
  }
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.getTime();
}

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t, formatCurrency } = useSettings();
  const { appState, deleteTransaction } = useAuth();
  const { portfolio } = useWallet();
  const [selectedRange, setSelectedRange] = useState<RangeKey>('month');
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [sectionVisible, setSectionVisible] = useState<Record<AnalyticsSectionKey, boolean>>(() => ({
    ...ANALYTICS_SECTIONS_VISIBLE_DEFAULT,
  }));

  const toggleSection = useCallback((key: AnalyticsSectionKey) => {
    setSectionVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const orb1Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.25 }] }));
  const orb2Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.2 }] }));

  const { transactions, history } = appState;

  const cashflow = useMemo(() => {
    const fromTime = getFromTime(selectedRange);
    const scoped = transactions.filter((tx) => getTxTime(tx) >= fromTime);
    const incomes = scoped.filter((tx) => tx.type === 'income');
    const expenses = scoped.filter((tx) => tx.type === 'expense');
    const totalIncome = incomes.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalExpense = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const net = totalIncome - totalExpense;

    const byCategoryMap: Record<string, number> = {};
    for (const tx of expenses) {
      const key = tx.category || t('other');
      byCategoryMap[key] = (byCategoryMap[key] || 0) + Number(tx.amount || 0);
    }
    const byCategory = Object.entries(byCategoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalIncome, totalExpense, net, byCategory };
  }, [transactions, selectedRange, t]);

  const allocation = useMemo(() => {
    const invs = portfolio?.investments || [];
    if (invs.length === 0) {
      return {
        hasData: false,
        totalCost: 0,
        totalValue: 0,
        totalPnL: 0,
        totalPnLPct: 0,
        rows: [] as Array<{ type: AssetType; cost: number; value: number; pct: number }>,
      };
    }

    const totalsByType: Record<AssetType, { cost: number; value: number }> = {
      stock: { cost: 0, value: 0 },
      crypto: { cost: 0, value: 0 },
      commodity: { cost: 0, value: 0 },
      index: { cost: 0, value: 0 },
    };
    let totalCost = 0;
    let totalValue = 0;

    for (const inv of invs) {
      totalsByType[inv.asset_type].cost += inv.cost_basis;
      totalsByType[inv.asset_type].value += inv.position_value;
      totalCost += inv.cost_basis;
      totalValue += inv.position_value;
    }

    const totalPnL = totalValue - totalCost;
    const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    const rows = (Object.keys(totalsByType) as AssetType[])
      .map((type) => ({
        type,
        cost: totalsByType[type].cost,
        value: totalsByType[type].value,
        pct: totalValue > 0 ? (totalsByType[type].value / totalValue) * 100 : 0,
      }))
      .filter((row) => row.value > 0 || row.cost > 0)
      .sort((a, b) => b.value - a.value);

    return { hasData: true, totalCost, totalValue, totalPnL, totalPnLPct, rows };
  }, [portfolio]);

  const historyData = useMemo(() => {
    const labels = history.length ? history.map((h) => h.date) : ['Now'];
    const values = history.length ? history.map((h) => h.value) : [0];
    const maxVal = values.length ? Math.max(...values, 1) : 1;
    return { labels, values, maxVal };
  }, [history]);

  const rangeOptions: Array<{ key: RangeKey; label: string }> = [
    { key: 'month', label: t('periodMonth') },
    { key: '3m', label: t('period3M') },
    { key: '6m', label: t('period6M') },
    { key: 'year', label: t('periodLastYear') },
  ];

  const handleDelete = useCallback(
    (id: string) => {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`${t('deleteTransaction')}\n${t('areYouSure')}`);
        if (confirmed) {
          deleteTransaction(id).then((ok) => {
            if (!ok) window.alert(t('deleteTransactionFailed'));
          });
        }
      } else {
        Alert.alert(t('deleteTransaction'), t('areYouSure'), [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              const ok = await deleteTransaction(id);
              if (!ok) Alert.alert(t('error'), t('deleteTransactionFailed'));
            },
          },
        ]);
      }
    },
    [t, deleteTransaction]
  );

  const sectionLabelKey: Record<AnalyticsSectionKey, string> = {
    recentTx: 'recentTransactions',
    cashflow: 'cashflowOverview',
    expenses: 'expensesByCategory',
    allocation: 'allocationBreakdown',
    history: 'netWorthHistory',
  };

  function renderCollapsedStrip(key: AnalyticsSectionKey) {
    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => toggleSection(key)}
        style={[
          styles.collapsedStrip,
          {
            backgroundColor: colors.cardBg,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.s200,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${t('analyticsTapToShow')}: ${t(sectionLabelKey[key])}`}
      >
        <View style={[styles.collapsedStripIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : `${colors.e500}12` }]}>
          <Ionicons name="eye-off-outline" size={20} color={colors.e600} />
        </View>
        <Text style={[styles.collapsedStripText, { color: colors.s700 }]} numberOfLines={2}>
          {t('analyticsTapToShow')} · {t(sectionLabelKey[key])}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.s400} />
      </TouchableOpacity>
    );
  }

  function renderSectionEye(key: AnalyticsSectionKey) {
    return (
      <TouchableOpacity
        onPress={() => toggleSection(key)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[styles.sectionVisibilityBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.s50 }]}
        accessibilityRole="button"
        accessibilityLabel={`${t('analyticsTapToHide')}: ${t(sectionLabelKey[key])}`}
      >
        <Ionicons name="eye-outline" size={22} color={colors.e600} />
      </TouchableOpacity>
    );
  }

  return (
    <>
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.orb1, orb1Style]} pointerEvents="none" />
      <Animated.View style={[styles.orb2, orb2Style]} pointerEvents="none" />

      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.s900} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: colors.e50 }]}>
          <Ionicons name="bar-chart" size={24} color={colors.e500} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.s900 }]}>{t('analytics')}</Text>
          <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('analyticsSubtitle')}</Text>
        </View>
      </View>

      {sectionVisible.recentTx ? (
        <Animated.View entering={FadeInDown.delay(20).duration(360)} style={styles.recentTxRow}>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => setTxModalVisible(true)}
            style={[styles.recentTxBtn, { backgroundColor: colors.cardBg, borderColor: colors.s200, marginBottom: 0, flex: 1 }]}
          >
            <View style={[styles.recentTxIcon, { backgroundColor: colors.e50 }]}>
              <Ionicons name="receipt-outline" size={18} color={colors.e600} />
            </View>
            <Text style={[styles.recentTxLabel, { color: colors.s900 }]}>{t('recentTransactions')}</Text>
            <View style={{ flex: 1 }} />
            {transactions.length > 0 ? (
              <View style={[styles.recentTxBadge, { backgroundColor: colors.e500 }]}>
                <Text style={styles.recentTxBadgeText}>{transactions.length}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={colors.s400} />
          </TouchableOpacity>
          {renderSectionEye('recentTx')}
        </Animated.View>
      ) : (
        renderCollapsedStrip('recentTx')
      )}

      {sectionVisible.cashflow ? (
      <Animated.View entering={FadeInDown.delay(40).duration(380)} style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <View style={styles.cardSectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: colors.s400 }]}>{t('cashflowOverview')}</Text>
          {renderSectionEye('cashflow')}
        </View>
        <View style={[styles.rangeRow, { backgroundColor: colors.s100 }]}>
          {rangeOptions.map((opt) => {
            const active = selectedRange === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => setSelectedRange(opt.key)}
                style={[styles.rangeBtn, active && { backgroundColor: colors.cardBg }]}
              >
                <Text style={[styles.rangeBtnText, { color: active ? colors.e600 : colors.s500 }]} numberOfLines={1}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(52,211,153,0.14)' : '#ECFDF5' }]}>
            <Text style={[styles.kpiLabel, { color: colors.s500 }]}>{t('totalIn')}</Text>
            <Text style={[styles.kpiValue, { color: colors.e600 }]}>{formatCurrency(cashflow.totalIncome)}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(248,113,113,0.14)' : '#FEF2F2' }]}>
            <Text style={[styles.kpiLabel, { color: colors.s500 }]}>{t('totalOut')}</Text>
            <Text style={[styles.kpiValue, { color: colors.red }]}>{formatCurrency(cashflow.totalExpense)}</Text>
          </View>
        </View>
        <View style={[styles.netChip, { backgroundColor: cashflow.net >= 0 ? '#10B981' : colors.red }]}>
          <Ionicons name={cashflow.net >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#fff" />
          <Text style={styles.netChipText}>
            {t('netSaved')}: {formatCurrency(cashflow.net)}
          </Text>
        </View>
      </Animated.View>
      ) : (
        renderCollapsedStrip('cashflow')
      )}

      {sectionVisible.expenses ? (
      <Animated.View entering={FadeInDown.delay(80).duration(380)} style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <View style={styles.cardSectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: colors.s400 }]}>{t('expensesByCategory')}</Text>
          {renderSectionEye('expenses')}
        </View>
        {cashflow.byCategory.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.s400 }]}>{t('noTransactionsYet')}</Text>
        ) : (
          cashflow.byCategory.map((row) => (
            <View key={row.category} style={styles.catRow}>
              <View style={styles.catLabelWrap}>
                <Text style={[styles.catLabel, { color: colors.s700 }]} numberOfLines={1}>{row.category}</Text>
                <Text style={[styles.catPct, { color: colors.s400 }]}>{row.pct.toFixed(1)}%</Text>
              </View>
              <Text style={[styles.catValue, { color: colors.s900 }]}>{formatCurrency(row.amount)}</Text>
              <View style={[styles.catBarBg, { backgroundColor: colors.s100 }]}>
                <LinearGradient
                  colors={['#F97316', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.catBarFill, { width: `${Math.max(3, row.pct)}%` }]}
                />
              </View>
            </View>
          ))
        )}
      </Animated.View>
      ) : (
        renderCollapsedStrip('expenses')
      )}

      {sectionVisible.allocation ? (
      <Animated.View entering={FadeInDown.delay(120).duration(380)} style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <View style={styles.cardSectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: colors.s400 }]}>{t('allocationBreakdown')}</Text>
          {renderSectionEye('allocation')}
        </View>
        {!allocation.hasData ? (
          <Text style={[styles.emptyText, { color: colors.s400 }]}>{t('noInvestmentsYet')}</Text>
        ) : (
          <>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: colors.s50 }]}>
                <Text style={[styles.kpiLabel, { color: colors.s500 }]}>{t('costBasis')}</Text>
                <Text style={[styles.kpiValue, { color: colors.s900 }]}>{formatCurrency(allocation.totalCost)}</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: colors.s50 }]}>
                <Text style={[styles.kpiLabel, { color: colors.s500 }]}>{t('marketValue')}</Text>
                <Text style={[styles.kpiValue, { color: colors.s900 }]}>{formatCurrency(allocation.totalValue)}</Text>
              </View>
            </View>
            <View style={[styles.netChip, { backgroundColor: allocation.totalPnL >= 0 ? '#10B981' : colors.red }]}>
              <Ionicons name={allocation.totalPnL >= 0 ? 'caret-up' : 'caret-down'} size={12} color="#fff" />
              <Text style={styles.netChipText}>
                {t('totalReturn')}: {allocation.totalPnL >= 0 ? '+' : ''}{formatCurrency(allocation.totalPnL)} ({allocation.totalPnLPct.toFixed(2)}%)
              </Text>
            </View>
            {allocation.rows.map((row) => (
              <View key={row.type} style={styles.allocRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.allocType, { color: colors.s700 }]}>{t(`${row.type}Type`)}</Text>
                  <Text style={[styles.allocSub, { color: colors.s400 }]}>
                    {t('costBasis')}: {formatCurrency(row.cost)} · {t('marketValue')}: {formatCurrency(row.value)}
                  </Text>
                </View>
                <Text style={[styles.allocPct, { color: colors.s900 }]}>{row.pct.toFixed(1)}%</Text>
              </View>
            ))}
          </>
        )}
      </Animated.View>
      ) : (
        renderCollapsedStrip('allocation')
      )}

      {sectionVisible.history ? (
      <Animated.View entering={FadeInDown.delay(160).duration(380)} style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <View style={styles.cardSectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: colors.s400 }]}>{t('netWorthHistory')}</Text>
          {renderSectionEye('history')}
        </View>
        <View style={styles.historyWrap}>
          {historyData.values.map((val, i) => {
            const width = historyData.maxVal > 0 ? (val / historyData.maxVal) * 100 : 0;
            const isLast = i === historyData.values.length - 1;
            return (
              <View key={`${historyData.labels[i]}-${i}`} style={styles.historyRow}>
                <Text style={[styles.historyLabel, { color: colors.s500 }]} numberOfLines={1}>{historyData.labels[i]}</Text>
                <View style={[styles.historyBarBg, { backgroundColor: colors.s100 }]}>
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.historyBarFill, { width: `${Math.max(3, width)}%` }]}
                  />
                </View>
                <Text style={[styles.historyValue, { color: isLast ? colors.e600 : colors.s700 }]}>{formatCurrency(val)}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
      ) : (
        renderCollapsedStrip('history')
      )}
    </Animated.ScrollView>

    <Modal visible={txModalVisible} animationType="slide" transparent>
      <Pressable style={styles.modalOverlay} onPress={() => setTxModalVisible(false)}>
        <Pressable style={[styles.txModalSheet, { backgroundColor: colors.cardBg }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.txModalHeader}>
            <Text style={[styles.txModalTitle, { color: colors.s900 }]}>{t('recentTransactions')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setTxModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={20} color={colors.s500} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.txModalScroll}>
            {transactions.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={36} color={colors.s300} />
                <Text style={[styles.emptyTitle, { color: colors.s500 }]}>{t('noTransactionsYet')}</Text>
                <Text style={[styles.emptySub, { color: colors.s400 }]}>{t('addIncomeAndExpenses')}</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const isInc = tx.type === 'income';
                const d = new Date((tx.created_at || tx.date) || 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const catLabel = tx.category ? t(tx.category) : '';
                return (
                  <View key={tx.id} style={[styles.txRow, { borderBottomColor: colors.s100 }]}>
                    <View style={[styles.txIcon, { backgroundColor: isInc ? colors.e50 : '#FEF3C7' }]}>
                      <Ionicons name={isInc ? 'arrow-down' : 'arrow-up'} size={16} color={isInc ? colors.e500 : '#D97706'} />
                    </View>
                    <View style={styles.txMid}>
                      <Text style={[styles.txDesc, { color: colors.s900 }]} numberOfLines={1}>{tx.description || tx.desc}</Text>
                      <Text style={[styles.txMeta, { color: colors.s400 }]}>{d}{catLabel ? ` · ${catLabel}` : ''}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isInc ? colors.e600 : colors.s900 }]}>
                      {isInc ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </Text>
                    <TouchableOpacity activeOpacity={0.6} onPress={() => handleDelete(tx.id)} style={[styles.delBtn, { backgroundColor: colors.s100 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={13} color={colors.s400} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.08)' },
  orb2: { position: 'absolute', bottom: 120, left: -60, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.06)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  recentTxRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 14,
  },
  recentTxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  sectionVisibilityBtn: {
    width: 48,
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitleInHeader: {
    flex: 1,
    marginBottom: 0,
  },
  collapsedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  collapsedStripIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedStripText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  recentTxIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recentTxLabel: { fontSize: 14, fontWeight: '700' },
  recentTxBadge: { minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  recentTxBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  rangeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  rangeBtnText: { fontSize: 11, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiBox: { flex: 1, borderRadius: 14, padding: 12 },
  kpiLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: '900' },
  netChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  netChipText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  emptyText: { fontSize: 13, fontWeight: '600' },

  catRow: { marginBottom: 10 },
  catLabelWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
  catPct: { fontSize: 11, fontWeight: '700' },
  catValue: { fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 6 },
  catBarBg: { height: 8, borderRadius: 999, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 999 },

  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  allocType: { fontSize: 13, fontWeight: '800' },
  allocSub: { fontSize: 11, marginTop: 2 },
  allocPct: { fontSize: 13, fontWeight: '900' },

  historyWrap: { gap: 10 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyLabel: { width: 44, fontSize: 11, fontWeight: '700' },
  historyBarBg: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  historyBarFill: { height: '100%', borderRadius: 999 },
  historyValue: { minWidth: 60, textAlign: 'right', fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  txModalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 430, padding: 24, paddingBottom: 48, maxHeight: '80%' },
  txModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txModalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  txModalScroll: { maxHeight: 500 },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  txIcon: { width: 42, height: 42, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  txMid: { flex: 1, minWidth: 0 },
  txDesc: { fontSize: 15, fontWeight: '600' },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800', marginRight: 6 },
  delBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
