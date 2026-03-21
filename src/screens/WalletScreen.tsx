import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useWallet, EnrichedInvestment, PortfolioAllocation } from '../context/WalletContext';
import { PressableScale } from '../components/PressableScale';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { MainStackParamList } from '../navigation/types';

const TYPE_ICONS: Record<string, string> = {
  stock: 'trending-up',
  crypto: 'logo-bitcoin',
  commodity: 'diamond-outline',
  index: 'stats-chart',
};

const TYPE_COLORS: Record<string, string> = {
  stock: '#3B82F6',
  crypto: '#F59E0B',
  commodity: '#10B981',
  index: '#8B5CF6',
};

/* ─── Lighten hex color for gradient ─── */
function lightenColor(hex: string, amount = 0.35): string {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c, 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* ─── Modern Pie Chart Section ─── */
function AllocationPieChart({
  allocations,
  totalValue,
  totalGainLoss,
  totalGainLossPct,
  formatCurrency,
  colors,
  isDark,
  t,
}: {
  allocations: PortfolioAllocation[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  formatCurrency: (n: number) => string;
  colors: any;
  isDark: boolean;
  t: (k: string) => string;
}) {
  if (allocations.length === 0) return null;

  const isPositive = totalGainLoss >= 0;
  const maxPct = Math.max(...allocations.map((x) => x.percentage));

  const pieData = allocations.map((a) => ({
    value: a.percentage,
    color: a.color,
    gradientCenterColor: lightenColor(a.color, 0.4),
    focused: a.percentage === maxPct,
  }));

  return (
    <View style={styles.pieContainer}>
      {/* Stat Cards Row */}
      <View style={styles.pieStatRow}>
        <View style={[styles.pieStatCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[styles.pieStatIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Ionicons name="wallet" size={16} color="#10B981" />
          </View>
          <Text style={[styles.pieStatLabel, { color: colors.s500 }]}>{t('totalPortfolioValue')}</Text>
          <Text style={[styles.pieStatValue, { color: colors.s900 }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalValue)}
          </Text>
        </View>
        <View style={[styles.pieStatCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[styles.pieStatIconWrap, { backgroundColor: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
            <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={16} color={isPositive ? '#10B981' : '#EF4444'} />
          </View>
          <Text style={[styles.pieStatLabel, { color: colors.s500 }]}>{t('totalReturn')}</Text>
          <Text style={[styles.pieStatValue, { color: isPositive ? '#059669' : '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit>
            {isPositive ? '+' : ''}{totalGainLossPct.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Ring Chart — thin, rounded, gradient, shadow */}
      <View style={styles.pieChartWrap}>
        <PieChart
          data={pieData}
          donut
          radius={100}
          innerRadius={78}
          innerCircleColor={colors.cardBg}
          isAnimated
          animationDuration={800}
          shadow
          shadowColor={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}
          shadowWidth={8}
          showGradient
          curvedStartEdges
          curvedEndEdges
          focusOnPress
          toggleFocusOnPress
          sectionAutoFocus
          centerLabelComponent={() => (
            <View style={styles.pieCenter}>
              <Ionicons name="pie-chart" size={20} color={colors.e500} style={{ marginBottom: 4 }} />
              <Text style={[styles.pieCenterValue, { color: colors.s900 }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalValue)}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Pill Legend */}
      <View style={styles.pieLegendModern}>
        {allocations.map((a) => (
          <View
            key={a.type}
            style={[
              styles.pieLegendPill,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <LinearGradient
              colors={[a.color, lightenColor(a.color, 0.3)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pieLegendDotGrad}
            />
            <View style={styles.pieLegendPillInfo}>
              <Text style={[styles.pieLegendPillLabel, { color: colors.s900 }]}>{a.label}</Text>
              <Text style={[styles.pieLegendPillValue, { color: colors.s500 }]}>
                {formatCurrency(a.value)} · {Math.round(a.percentage)}%
              </Text>
            </View>
            {/* Mini progress bar */}
            <View style={styles.pieLegendBarTrack}>
              <View
                style={[
                  styles.pieLegendBarFill,
                  { width: `${a.percentage}%`, backgroundColor: a.color },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ─── Main Screen ─── */
export default function WalletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { colors, isDark } = useTheme();
  const { t, formatCurrency } = useSettings();
  const {
    portfolio,
    loading,
    refreshing,
    refreshPrices,
    deleteInvestment,
  } = useWallet();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.25 }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.2 }],
  }));

  const onRefresh = useCallback(async () => {
    try {
      await refreshPrices();
    } catch (e) {
      console.error('[WalletScreen] refresh error:', e);
    }
  }, [refreshPrices]);

  const navigateToDetail = useCallback(
    (inv: EnrichedInvestment) => {
      navigation.navigate('AssetDetail', { investment: inv });
    },
    [navigation]
  );

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'1m' | '6m' | '1y' | '5y' | 'all'>('all');

  const hasInvestments = portfolio && portfolio.investments.length > 0;
  const isPositive = (portfolio?.totalGainLoss ?? 0) >= 0;

  const RETURNS_PERIODS = [
    { key: '1m' as const, label: 'monthly', days: 30 },
    { key: '6m' as const, label: 'semiannual', days: 180 },
    { key: '1y' as const, label: 'annual', days: 365 },
    { key: '5y' as const, label: 'fiveYears', days: 1825 },
    { key: 'all' as const, label: 'allTime', days: Infinity },
  ];

  // Filter by period, aggregate same tickers, group by type
  const periodData = useMemo(() => {
    if (!portfolio) return { groups: [], totalGain: 0, totalCost: 0, totalValue: 0, pct: 0, count: 0 };
    const now = Date.now();
    const period = RETURNS_PERIODS.find((p) => p.key === detailPeriod)!;
    const cutoff = period.days === Infinity ? 0 : now - period.days * 86400000;
    const filtered = portfolio.investments.filter((inv) => {
      const created = new Date(inv.created_at || 0).getTime();
      return created >= cutoff;
    });
    const totalCost = filtered.reduce((s, i) => s + i.cost_basis, 0);
    const totalValue = filtered.reduce((s, i) => s + i.position_value, 0);
    const totalGain = totalValue - totalCost;
    const pct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Aggregate and group
    const TYPE_ORDER = ['stock', 'crypto', 'commodity', 'index'];
    const typeMap = new Map<string, Map<string, { ticker: string; name: string; type: string; quantity: number; costBasis: number; positionValue: number; gainLoss: number }>>();
    for (const inv of filtered) {
      if (!typeMap.has(inv.asset_type)) typeMap.set(inv.asset_type, new Map());
      const tickerMap = typeMap.get(inv.asset_type)!;
      const existing = tickerMap.get(inv.asset_ticker);
      if (existing) {
        existing.quantity += inv.quantity;
        existing.costBasis += inv.cost_basis;
        existing.positionValue += inv.position_value;
        existing.gainLoss += inv.gain_loss;
      } else {
        tickerMap.set(inv.asset_ticker, {
          ticker: inv.asset_ticker,
          name: inv.asset_name || '',
          type: inv.asset_type,
          quantity: inv.quantity,
          costBasis: inv.cost_basis,
          positionValue: inv.position_value,
          gainLoss: inv.gain_loss,
        });
      }
    }
    const groups = TYPE_ORDER
      .filter((t) => typeMap.has(t))
      .map((t) => ({ type: t, assets: Array.from(typeMap.get(t)!.values()) }));

    return { groups, totalGain, totalCost, totalValue, pct, count: filtered.length };
  }, [portfolio, detailPeriod]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.e500}
          />
        }
      >
        <Animated.View style={[styles.orb1, orb1Style]} pointerEvents="none" />
        <Animated.View style={[styles.orb2, orb2Style]} pointerEvents="none" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.s900} />
          </TouchableOpacity>
          <View style={[styles.headerIcon, { backgroundColor: colors.e50 }]}>
            <Ionicons name="wallet" size={24} color={colors.e500} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.s900 }]}>{t('walletTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.s500 }]}>
              {t('walletSubtitle')}
            </Text>
          </View>
        </View>

        {!hasInvestments ? (
          /* ─── EMPTY STATE (minimal) ─── */
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[
              styles.emptyCardModern,
              {
                backgroundColor: colors.cardBg,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
              },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.e500}10` }]}>
              <Ionicons name="wallet-outline" size={22} color={colors.e500} />
            </View>
            <Text style={[styles.emptyTitleModern, { color: colors.s900 }]}>{t('noInvestmentsYet')}</Text>
            <Text style={[styles.emptySubModern, { color: colors.s400 }]}>{t('addYourFirstInvestment')}</Text>

            <View style={styles.emptyActionsCol}>
              <PressableScale onPress={() => navigation.navigate('AddInvestment')}>
                <View style={[styles.emptyPrimaryBtn, { backgroundColor: colors.e500 }]}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyPrimaryBtnText}>{t('addInvestment')}</Text>
                </View>
              </PressableScale>

              <Animated.View entering={FadeInDown.delay(120).duration(320)}>
                <PressableScale onPress={() => navigation.navigate('Planning')}>
                  <View
                    style={[
                      styles.emptyPlanningRow,
                      {
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,118,110,0.22)',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,118,110,0.04)',
                      },
                    ]}
                  >
                    <View style={[styles.emptyPlanningIcon, { backgroundColor: `${colors.e500}14` }]}>
                      <Ionicons name="calculator-outline" size={18} color={colors.e600} />
                    </View>
                    <Text style={[styles.emptyPlanningLabel, { color: colors.s700 }]}>{t('planning')}</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="chevron-forward" size={18} color={colors.s300} />
                  </View>
                </PressableScale>
              </Animated.View>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Modern Allocation Chart Card */}
            {portfolio!.investments.length > 0 && (
              <Animated.View entering={FadeInDown.delay(50).duration(400)}>
                <View style={[styles.card, styles.chartCardModern, { backgroundColor: colors.cardBg }]}>
                  {/* Card header with accent */}
                  <View style={styles.chartCardHeader}>
                    <View style={[styles.chartCardHeaderIcon, { backgroundColor: `${colors.e500}15` }]}>
                      <Ionicons name="pie-chart" size={14} color={colors.e500} />
                    </View>
                    <Text style={[styles.secLabel, { color: colors.s400, marginBottom: 0 }]}>
                      {t('portfolioAllocation')}
                    </Text>
                  </View>

                  <AllocationPieChart
                    allocations={portfolio!.allocations}
                    totalValue={portfolio!.totalValue}
                    totalGainLoss={portfolio!.totalGainLoss}
                    totalGainLossPct={portfolio!.totalGainLossPct}
                    formatCurrency={formatCurrency}
                    colors={colors}
                    isDark={isDark}
                    t={t}
                  />

                  {/* View investments & returns */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.cardActionBtn, { backgroundColor: `${colors.e500}10`, borderColor: `${colors.e500}30`, marginTop: 20 }]}
                    onPress={() => setDetailVisible(true)}
                  >
                    <Ionicons name="analytics-outline" size={16} color={colors.e600} />
                    <Text style={[styles.cardActionText, { color: colors.e600 }]}>{t('viewInvestments')}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={[styles.cardActionCount, { backgroundColor: colors.e500 }]}>
                      <Text style={styles.cardActionCountText}>{portfolio!.investments.length}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.e500} />
                  </TouchableOpacity>

                </View>
              </Animated.View>
            )}

            {/* Add Investment Button */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <PressableScale
                onPress={() => navigation.navigate('AddInvestment')}
              >
                <View style={[styles.addBtn, { borderColor: colors.e500 }]}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.e600} />
                  <Text style={[styles.addBtnText, { color: colors.e600 }]}>
                    {t('addInvestment')}
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>

            {/* Price alerts — manage all targets */}
            <Animated.View entering={FadeInDown.delay(240).duration(400)}>
              <PressableScale onPress={() => navigation.navigate('PriceAlerts')}>
                <View
                  style={[
                    styles.priceAlertsRow,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
                    },
                  ]}
                >
                  <View style={[styles.priceAlertsIcon, { backgroundColor: `${colors.e500}14` }]}>
                    <Ionicons name="notifications-outline" size={18} color={colors.e600} />
                  </View>
                  <Text style={[styles.priceAlertsLabel, { color: colors.s900 }]}>{t('priceAlertsManage')}</Text>
                  <View style={{ flex: 1 }} />
                  <Ionicons name="chevron-forward" size={18} color={colors.s300} />
                </View>
              </PressableScale>
            </Animated.View>

            {/* Planning Button — muted teal green (less fluorescent) */}
            <Animated.View entering={FadeInDown.delay(280).duration(400)}>
              <PressableScale
                onPress={() => navigation.navigate('Planning')}
              >
                <LinearGradient
                  colors={['#0F766E', '#115E59']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.planningBtn}
                >
                  <View style={styles.planningBtnIconWrap}>
                    <Ionicons name="calculator" size={16} color="#fff" />
                  </View>
                  <Text style={styles.planningBtnText}>{t('planning')}</Text>
                  <View style={{ flex: 1 }} />
                  <View style={styles.planningBtnArrow}>
                    <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.9)" />
                  </View>
                </LinearGradient>
              </PressableScale>
            </Animated.View>

          </>
        )}
      </Animated.ScrollView>

      {/* Unified Investments & Returns Modal */}
      <Modal visible={detailVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setDetailVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.cardBg }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.s900 }]}>{t('yourAssets')}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setDetailVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.modalCloseBtn, { backgroundColor: colors.s100 }]}
              >
                <Ionicons name="close" size={20} color={colors.s500} />
              </TouchableOpacity>
            </View>

            {/* Period tabs */}
            <View style={[styles.periodTabs, { backgroundColor: colors.s100 }]}>
              {RETURNS_PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  activeOpacity={0.7}
                  style={[styles.periodTab, detailPeriod === p.key && [styles.periodTabActive, { backgroundColor: colors.cardBg }]]}
                  onPress={() => setDetailPeriod(p.key)}
                >
                  <Text style={[styles.periodTabText, { color: colors.s400 }, detailPeriod === p.key && { color: colors.e600, fontWeight: '800' }]}>
                    {t(p.label)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {periodData.count > 0 ? (
                <>
                  {/* Returns hero */}
                  <View style={[styles.returnsHero, { backgroundColor: periodData.totalGain >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                    <Ionicons
                      name={periodData.totalGain >= 0 ? 'trending-up' : 'trending-down'}
                      size={24}
                      color={periodData.totalGain >= 0 ? '#059669' : '#DC2626'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.returnsHeroValue, { color: periodData.totalGain >= 0 ? '#059669' : '#DC2626' }]}>
                        {periodData.totalGain >= 0 ? '+' : ''}{formatCurrency(periodData.totalGain)}
                      </Text>
                      <Text style={[styles.returnsHeroSub, { color: colors.s400 }]}>
                        {formatCurrency(periodData.totalCost)} → {formatCurrency(periodData.totalValue)}
                      </Text>
                    </View>
                    <View style={[styles.returnsHeroPctBadge, { backgroundColor: periodData.totalGain >= 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                      <Text style={[styles.returnsHeroPct, { color: periodData.totalGain >= 0 ? '#059669' : '#DC2626' }]}>
                        {periodData.totalGain >= 0 ? '+' : ''}{periodData.pct.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* Investments grouped by type */}
                  {periodData.groups.map((group) => {
                    const typeColor = TYPE_COLORS[group.type] || colors.e500;
                    const typeIcon = TYPE_ICONS[group.type] || 'ellipse';
                    return (
                      <View key={group.type} style={styles.invGroup}>
                        <View style={styles.invGroupHeader}>
                          <View style={[styles.invGroupIcon, { backgroundColor: `${typeColor}18` }]}>
                            <Ionicons name={typeIcon as any} size={14} color={typeColor} />
                          </View>
                          <Text style={[styles.invGroupTitle, { color: typeColor }]}>{t(group.type + 'Type')}</Text>
                          <View style={[styles.invGroupLine, { backgroundColor: `${typeColor}20` }]} />
                        </View>
                        {group.assets.map((asset) => {
                          const positive = asset.gainLoss >= 0;
                          const pct = asset.costBasis > 0 ? ((asset.gainLoss / asset.costBasis) * 100) : 0;
                          const isPriceUnavailable = asset.positionValue <= 0 && asset.costBasis > 0;
                          return (
                            <TouchableOpacity
                              key={asset.ticker}
                              activeOpacity={0.7}
                              style={[styles.invAssetRow, { borderBottomColor: colors.s100 }]}
                              onPress={() => {
                                const match = portfolio?.investments.find((i) => i.asset_ticker === asset.ticker);
                                if (match) {
                                  setDetailVisible(false);
                                  navigateToDetail(match);
                                }
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.invAssetTicker, { color: colors.s900 }]}>{asset.ticker}</Text>
                                <Text style={[styles.invAssetName, { color: colors.s400 }]} numberOfLines={1}>
                                  {asset.name || t(asset.type + 'Type')} · {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} {t('units')}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                {isPriceUnavailable ? (
                                  <Text style={[styles.invAssetUnavailable, { color: colors.s400 }]}>
                                    {t('priceUnavailable')}
                                  </Text>
                                ) : (
                                  <>
                                    <Text style={[styles.invAssetValue, { color: positive ? '#059669' : '#DC2626' }]}>
                                      {positive ? '+' : ''}{formatCurrency(asset.gainLoss)}
                                    </Text>
                                    <View style={styles.invAssetGainRow}>
                                      <Ionicons name={positive ? 'caret-up' : 'caret-down'} size={9} color={positive ? '#059669' : '#DC2626'} />
                                      <Text style={[styles.invAssetGain, { color: positive ? '#059669' : '#DC2626' }]}>
                                        {positive ? '+' : ''}{pct.toFixed(1)}%
                                      </Text>
                                    </View>
                                  </>
                                )}
                              </View>
                              <Ionicons name="chevron-forward" size={14} color={colors.s300} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={styles.returnsEmpty}>
                  <Ionicons name="calendar-outline" size={36} color={colors.s300} />
                  <Text style={[styles.returnsEmptyText, { color: colors.s400 }]}>{t('noDataForPeriod')}</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20, paddingBottom: 120 },
  orb1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  orb2: {
    position: 'absolute',
    bottom: 120,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(52,211,153,0.06)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  card: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  chartCardModern: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    overflow: 'hidden',
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartCardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Modern Pie Chart
  pieContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
  },
  pieStatRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 8 },
  pieStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  pieStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieStatLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  pieStatValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  pieChartWrap: { alignItems: 'center', marginVertical: 6 },
  pieCenter: { alignItems: 'center', justifyContent: 'center', width: 120 },
  pieCenterValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  pieLegendModern: { width: '100%', gap: 8 },
  pieLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pieLegendDotGrad: { width: 12, height: 12, borderRadius: 6 },
  pieLegendPillInfo: { flex: 1, minWidth: 0 },
  pieLegendPillLabel: { fontSize: 13, fontWeight: '700' },
  pieLegendPillValue: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  pieLegendBarTrack: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  pieLegendBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  priceAlertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  priceAlertsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceAlertsLabel: { fontSize: 15, fontWeight: '700' },
  planningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowColor: '#115E59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  planningBtnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planningBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  planningBtnArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card action button
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardActionText: { fontSize: 13, fontWeight: '700' },
  cardActionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  cardActionCountText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Investments modal groups
  invGroup: { marginBottom: 20 },
  invGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  invGroupIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  invGroupTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  invGroupLine: { flex: 1, height: 1 },
  invAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginLeft: 36,
  },
  invAssetTicker: { fontSize: 14, fontWeight: '700' },
  invAssetName: { fontSize: 11, marginTop: 2 },
  invAssetValue: { fontSize: 14, fontWeight: '800' },
  invAssetGainRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  invAssetGain: { fontSize: 11, fontWeight: '700' },
  invAssetUnavailable: { fontSize: 11, fontWeight: '700', marginTop: 2 },

  // Empty state (minimal / clean)
  emptyCardModern: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitleModern: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubModern: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 22,
  },
  emptyActionsCol: { width: '100%', gap: 10 },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  emptyPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyPlanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyPlanningIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlanningLabel: { fontSize: 15, fontWeight: '700' },

  // Period tabs
  periodTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 18,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodTabText: { fontSize: 11, fontWeight: '600' },

  // Returns modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 430, padding: 24, paddingBottom: 48, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  returnsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
  },
  returnsHeroValue: { fontSize: 22, fontWeight: '900' },
  returnsHeroSub: { fontSize: 11, marginTop: 4 },
  returnsHeroPctBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  returnsHeroPct: { fontSize: 14, fontWeight: '800' },
  returnsEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  returnsEmptyText: { fontSize: 13, fontWeight: '500' },
});
