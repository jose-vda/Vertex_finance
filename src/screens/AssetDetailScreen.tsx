import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useWallet, EnrichedInvestment } from '../context/WalletContext';
import { fetchHistoricalPrices, HistoricalPrice } from '../lib/priceService';
import { AssetType } from '../lib/priceService';
import { MainStackParamList } from '../navigation/types';
import { SellConfirmModal } from '../components/investments/SellConfirmModal';

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

const PERIODS = [
  { key: '1M', days: 30 },
  { key: '6M', days: 180 },
  { key: '1Y', days: 365 },
  { key: '5Y', days: 1825 },
  { key: 'ALL', days: 3650 },
];

/* ─── Animated Period Selector ─── */
function PeriodSelector({
  selected,
  onSelect,
  accentColor,
  colors,
  t,
}: {
  selected: string;
  onSelect: (key: string) => void;
  accentColor: string;
  colors: any;
  t: (k: string) => string;
}) {
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const layoutsRef = useRef<Record<string, { x: number; w: number }>>({});
  const SPRING_CONFIG = { damping: 14, stiffness: 320, mass: 0.55 };

  const onItemLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layoutsRef.current[key] = { x, w: width };
    if (key === selected) {
      indicatorX.value = x;
      indicatorW.value = width;
    }
  };

  useEffect(() => {
    const layout = layoutsRef.current[selected];
    if (!layout) return;
    indicatorX.value = withSpring(layout.x, SPRING_CONFIG);
    indicatorW.value = withSpring(layout.w, SPRING_CONFIG);
  }, [selected, indicatorW, indicatorX]);

  const handleSelect = (key: string) => {
    if (key === selected) return;
    const layout = layoutsRef.current[key];
    if (layout) {
      indicatorX.value = withSpring(layout.x, SPRING_CONFIG);
      indicatorW.value = withSpring(layout.w, SPRING_CONFIG);
    }
    onSelect(key);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: indicatorX.value,
    width: indicatorW.value,
    height: '100%',
    borderRadius: 12,
    backgroundColor: accentColor,
  }));

  return (
    <View style={[selectorStyles.container, { backgroundColor: colors.s100 }]}>
      <Animated.View style={indicatorStyle} />
      {PERIODS.map((p) => (
        <TouchableOpacity
          key={p.key}
          activeOpacity={0.92}
          onLayout={onItemLayout(p.key)}
          onPress={() => handleSelect(p.key)}
          style={selectorStyles.item}
        >
          <Text
            style={[
              selectorStyles.label,
              { color: selected === p.key ? '#FFFFFF' : colors.s500 },
            ]}
          >
            {t('chart' + p.key)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    position: 'relative',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

/* ─── Main Screen ─── */
export default function AssetDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AssetDetail'>>();
  const { colors } = useTheme();
  const { t, formatCurrency } = useSettings();
  const { sellInvestment } = useWallet();

  const inv = route.params?.investment as EnrichedInvestment | undefined;
  const preview = route.params?.assetPreview;
  const isPreviewMode = !inv && !!preview;
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [history, setHistory] = useState<HistoricalPrice[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellQtyStr, setSellQtyStr] = useState('');
  const [sellPriceMode, setSellPriceMode] = useState<'auto' | 'manual'>('auto');
  const [manualSellPriceStr, setManualSellPriceStr] = useState('');
  const [selling, setSelling] = useState(false);

  if (!inv && !preview) {
    return (
      <View style={[styles.scroll, { backgroundColor: colors.background, flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.s300} />
        <Text style={{ color: colors.s500, marginTop: 12, fontSize: 15 }}>{t('noHistoricalData')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.e500, fontWeight: '700' }}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subjectTicker = inv?.asset_ticker || preview!.ticker;
  const subjectType = (inv?.asset_type || preview!.type) as AssetType;
  const subjectName = inv?.asset_name || preview?.name || t(subjectType + 'Type');
  const subjectCurrentPrice = inv?.current_price ?? preview?.currentPrice ?? 0;
  const subjectPurchasePrice = inv?.average_purchase_price ?? 0;

  const screenWidth = Dimensions.get('window').width;
  const typeColor = TYPE_COLORS[subjectType] || colors.e500;
  const iconName = TYPE_ICONS[subjectType] || 'ellipse';
  const isPositive = (inv?.gain_loss ?? 0) >= 0;
  const isPriceUnavailable = subjectCurrentPrice <= 0;

  const periodDays = PERIODS.find((p) => p.key === selectedPeriod)?.days ?? 30;

  const loadHistory = useCallback(async (days: number) => {
    setLoadingHistory(true);
    try {
      const data = await fetchHistoricalPrices(subjectTicker, subjectType, days);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [subjectTicker, subjectType]);

  useEffect(() => {
    loadHistory(periodDays);
  }, [periodDays, loadHistory]);

  const chartData = useMemo(() => {
    if (history.length < 2) return [];
    // Permite mais pontos em períodos longos para não “esmagar” anos de histórico
    const maxPoints =
      periodDays <= 30 ? 40 :        // 1M
      periodDays <= 180 ? 70 :       // 6M
      periodDays <= 365 ? 90 :       // 1Y
      periodDays <= 1825 ? 140 :     // 5Y
      180;                           // ALL
    const step = Math.max(1, Math.floor(history.length / maxPoints));
    const filtered = history.filter((_, i) => i % step === 0 || i === history.length - 1);
    // Show ~4 evenly spaced labels
    const labelInterval = Math.max(1, Math.floor(filtered.length / 4));
    return filtered.map((h, i, arr) => {
      let label = '';
      if (i === 0 || i === arr.length - 1 || i % labelInterval === 0) {
        // For long periods show month/year, short periods show day/month
        if (periodDays > 365) {
          const [, m, d] = h.date.split('-');
          const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = `${months[parseInt(m)]} ${h.date.slice(2, 4)}`;
        } else {
          const [, m, d] = h.date.split('-');
          label = `${d}/${m}`;
        }
      }
      return {
        value: h.price,
        date: h.date,
        label,
        labelTextStyle: { color: colors.s400, fontSize: 8, width: 44 },
      };
    });
  }, [history, colors, periodDays]);

  // Purchase price reference line
  const purchasePriceData = useMemo(() => {
    if (isPreviewMode || chartData.length < 2 || subjectPurchasePrice <= 0) return [];
    return chartData.map(() => ({ value: subjectPurchasePrice }));
  }, [chartData, isPreviewMode, subjectPurchasePrice]);

  // Chart price change + high/low for selected period
  const periodStats = useMemo(() => {
    if (history.length < 2 || !history[0] || !history[history.length - 1]) return null;
    const first = history[0].price;
    const last = history[history.length - 1].price;
    const change = last - first;
    const pct = first > 0 ? (change / first) * 100 : 0;
    const prices = history.map((h) => h.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    return { change, pct, positive: change >= 0, high, low };
  }, [history]);

  const parsedSellQty = useMemo(() => {
    const qty = parseFloat((sellQtyStr || '').replace(',', '.'));
    return Number.isFinite(qty) ? qty : 0;
  }, [sellQtyStr]);
  const parsedManualPrice = useMemo(() => {
    const p = parseFloat((manualSellPriceStr || '').replace(',', '.'));
    return Number.isFinite(p) ? p : 0;
  }, [manualSellPriceStr]);
  const effectiveUnitSellPrice = sellPriceMode === 'manual' ? parsedManualPrice : Math.max(0, subjectCurrentPrice);
  const expectedCredit = Math.max(0, parsedSellQty * effectiveUnitSellPrice);

  const openSellModal = useCallback(() => {
    if (!inv) return;
    setSellQtyStr(String(inv.quantity));
    setSellPriceMode('auto');
    setManualSellPriceStr('');
    setShowSellModal(true);
  }, [inv]);

  const closeSellModal = useCallback(() => {
    if (selling) return;
    setShowSellModal(false);
  }, [selling]);

  const handleConfirmSell = useCallback(async () => {
    const notify = (message: string) => {
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert(t('error'), message);
    };

    if (!inv) return;
    if (!parsedSellQty || parsedSellQty <= 0) {
      notify(t('sellQuantityInvalid'));
      return;
    }
    if (parsedSellQty > inv.quantity) {
      notify(t('sellQuantityExceeds'));
      return;
    }
    if (sellPriceMode === 'manual' && (!parsedManualPrice || parsedManualPrice <= 0)) {
      notify(t('sellPriceInvalid'));
      return;
    }
    if (sellPriceMode === 'auto' && (!subjectCurrentPrice || subjectCurrentPrice <= 0)) {
      notify(t('sellPriceUnavailable'));
      return;
    }

    setSelling(true);
    const ok = await sellInvestment({
      id: inv.id,
      quantityToSell: parsedSellQty,
      mode: sellPriceMode,
      manualPrice: sellPriceMode === 'manual' ? parsedManualPrice : undefined,
    });
    setSelling(false);
    if (!ok) {
      notify(t('sellFailed'));
      return;
    }
    setShowSellModal(false);
    navigation.goBack();
  }, [inv, parsedSellQty, parsedManualPrice, sellPriceMode, subjectCurrentPrice, sellInvestment, navigation, t]);

  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value), subjectPurchasePrice || 0) : 0;
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value), subjectPurchasePrice || 0) : 0;
  const priceRange = maxPrice - minPrice || 1;
  const stepValue = priceRange / 4;
  const safeDataLength = Math.max(1, chartData.length - 1);
  const spacing = (screenWidth - 120) / safeDataLength;

  return (
    <View style={[styles.screenRoot, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.s900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.s900 }]} numberOfLines={1}>
          {isPreviewMode ? t('previewMode') : t('assetDetails')}
        </Text>
        {isPreviewMode ? (
          <View style={{ width: 24 }} />
        ) : (
          <TouchableOpacity activeOpacity={0.7} onPress={openSellModal}>
            <Ionicons name="cash-outline" size={22} color={colors.red} />
          </TouchableOpacity>
        )}
      </View>

      {/* Asset Hero Card */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.heroCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: `${typeColor}18` }]}>
              <Ionicons name={iconName as any} size={28} color={typeColor} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroTicker, { color: colors.s900 }]}>{subjectTicker}</Text>
              <Text style={[styles.heroName, { color: colors.s400 }]}>{subjectName}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                {t(subjectType + 'Type')}
              </Text>
            </View>
          </View>

          <View style={styles.heroPriceRow}>
            <Text style={[styles.heroPrice, { color: colors.s900 }]}>
              {isPriceUnavailable ? t('priceUnavailable') : formatCurrency(subjectCurrentPrice)}
            </Text>
            {!isPriceUnavailable && !isPreviewMode && (
              <View
                style={[
                  styles.gainBadge,
                  isPositive ? { backgroundColor: '#ECFDF5' } : { backgroundColor: '#FEF2F2' },
                ]}
              >
                <Ionicons
                  name={isPositive ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={isPositive ? '#059669' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.gainBadgeText,
                    { color: isPositive ? '#059669' : '#DC2626' },
                  ]}
                >
                  {isPositive ? '+' : ''}
                    {(inv?.gain_loss_pct ?? 0).toFixed(2)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Chart Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
          {/* Period Selector */}
          <PeriodSelector
            selected={selectedPeriod}
            onSelect={setSelectedPeriod}
            accentColor={typeColor}
            colors={colors}
            t={t}
          />

          {/* Period stats row: change + high/low */}
          {periodStats && !loadingHistory && (
            <>
              <View style={styles.periodStatsRow}>
                <View
                  style={[
                    styles.periodStatsBadge,
                    {
                      backgroundColor: periodStats.positive ? '#ECFDF5' : '#FEF2F2',
                    },
                  ]}
                >
                  <Ionicons
                    name={periodStats.positive ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={periodStats.positive ? '#059669' : '#DC2626'}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color: periodStats.positive ? '#059669' : '#DC2626',
                    }}
                  >
                    {periodStats.positive ? '+' : ''}
                    {periodStats.pct.toFixed(2)}%
                  </Text>
                </View>
                <Text style={[styles.periodStatsLabel, { color: colors.s400 }]}>
                  {formatCurrency(periodStats.change)}
                </Text>
              </View>
              <View style={styles.highLowRow}>
                <View style={styles.highLowItem}>
                  <Ionicons name="arrow-up" size={12} color="#059669" />
                  <Text style={[styles.highLowLabel, { color: colors.s400 }]}>{t('high')}</Text>
                  <Text style={[styles.highLowValue, { color: colors.s900 }]}>{formatCurrency(periodStats.high)}</Text>
                </View>
                <View style={[styles.highLowDivider, { backgroundColor: colors.s200 }]} />
                <View style={styles.highLowItem}>
                  <Ionicons name="arrow-down" size={12} color="#DC2626" />
                  <Text style={[styles.highLowLabel, { color: colors.s400 }]}>{t('low')}</Text>
                  <Text style={[styles.highLowValue, { color: colors.s900 }]}>{formatCurrency(periodStats.low)}</Text>
                </View>
              </View>
            </>
          )}

          {loadingHistory ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="large" color={typeColor} />
              <Text style={[styles.loadingText, { color: colors.s400 }]}>{t('loadingPrices')}</Text>
            </View>
          ) : chartData.length < 2 ? (
            <View style={styles.chartLoading}>
              <Ionicons name="analytics-outline" size={40} color={colors.s300} />
              <Text style={[styles.loadingText, { color: colors.s400 }]}>{t('noHistoricalData')}</Text>
            </View>
          ) : (
            <View style={styles.chartWrap}>
              <LineChart
                areaChart
                curved
                data={chartData}
                data2={purchasePriceData}
                height={200}
                width={screenWidth - 90}
                initialSpacing={15}
                endSpacing={15}
                spacing={spacing}
                color1={typeColor}
                thickness1={2.5}
                startFillColor1={typeColor}
                endFillColor1="transparent"
                startOpacity={0.15}
                endOpacity={0}
                color2={colors.s300}
                thickness2={isPreviewMode ? 0 : 1}
                strokeDashArray2={isPreviewMode ? undefined : [5, 5]}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={0}
                rulesColor={colors.s100}
                rulesType="dashed"
                dashWidth={3}
                dashGap={4}
                yAxisTextStyle={{ color: colors.s400, fontSize: 9 }}
                stepValue={stepValue}
                maxValue={maxPrice + priceRange * 0.1}
                mostNegativeValue={Math.max(0, minPrice - priceRange * 0.1)}
                hideDataPoints
                pointerConfig={{
                  pointerStripColor: typeColor,
                  pointerStripWidth: 1,
                  pointerStripUptoDataPoint: true,
                  pointerColor: typeColor,
                  radius: 5,
                  strokeDashArray: [2, 3],
                  pointerLabelWidth: 120,
                  pointerLabelHeight: 50,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items: any) => {
                    const item = items[0];
                    const dateStr = item?.date || '';
                    return (
                      <View style={styles.pointerLabel}>
                        {dateStr ? (
                          <Text style={styles.pointerDate}>{dateStr}</Text>
                        ) : null}
                        <Text style={styles.pointerText}>
                          {formatCurrency(item?.value ?? 0)}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: typeColor }]} />
                  <Text style={[styles.legendText, { color: colors.s500 }]}>{t('currentPrice')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDash, { backgroundColor: colors.s300 }]} />
                  <Text style={[styles.legendText, { color: colors.s500 }]}>{t('purchasePrice')}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Position Card */}
      {!isPreviewMode && inv && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={[styles.positionCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionLabel, { color: colors.s400 }]}>{t('yourPosition')}</Text>

            <View style={styles.positionGrid}>
              <View style={[styles.positionItem, { backgroundColor: colors.s50 }]}>
                <Text style={[styles.positionLabel, { color: colors.s400 }]}>{t('quantity')}</Text>
                <Text style={[styles.positionValue, { color: colors.s900 }]}>
                  {inv.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </Text>
                <Text style={[styles.positionSub, { color: colors.s400 }]}>{t('units')}</Text>
              </View>

              <View style={[styles.positionItem, { backgroundColor: colors.s50 }]}>
                <Text style={[styles.positionLabel, { color: colors.s400 }]}>{t('purchasePrice')}</Text>
                <Text style={[styles.positionValue, { color: colors.s900 }]}>
                  {formatCurrency(inv.average_purchase_price)}
                </Text>
                <Text style={[styles.positionSub, { color: colors.s400 }]}>{inv.purchase_currency}</Text>
              </View>

              <View style={[styles.positionItem, { backgroundColor: colors.s50 }]}>
                <Text style={[styles.positionLabel, { color: colors.s400 }]}>{t('invested')}</Text>
                <Text style={[styles.positionValue, { color: colors.s900 }]}>
                  {formatCurrency(inv.cost_basis)}
                </Text>
                <Text style={[styles.positionSub, { color: colors.s400 }]}>{t('costBasis')}</Text>
              </View>

              <View style={[styles.positionItem, { backgroundColor: colors.s50 }]}>
                <Text style={[styles.positionLabel, { color: colors.s400 }]}>{t('marketValue')}</Text>
                <Text style={[styles.positionValue, { color: colors.s900 }]}>
                  {formatCurrency(inv.position_value)}
                </Text>
                <Text style={[styles.positionSub, { color: colors.s400 }]}>{t('currentValue')}</Text>
              </View>
            </View>

            {/* Gain/Loss banner */}
            <LinearGradient
              colors={isPositive ? ['#ECFDF5', '#D1FAE5'] : ['#FEF2F2', '#FEE2E2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gainBanner}
            >
              <Ionicons
                name={isPositive ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={24}
                color={isPositive ? '#059669' : '#DC2626'}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gainBannerLabel, { color: isPositive ? '#065F46' : '#991B1B' }]}>
                  {t('totalReturn')}
                </Text>
                <Text style={[styles.gainBannerValue, { color: isPositive ? '#059669' : '#DC2626' }]}>
                  {isPositive ? '+' : ''}{formatCurrency(inv.gain_loss)} ({inv.gain_loss_pct.toFixed(2)}%)
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      )}

      {/* Delete button */}
      {!isPreviewMode && (
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.deleteBtn, { borderColor: colors.red }]}
            onPress={openSellModal}
          >
            <Ionicons name="cash-outline" size={18} color={colors.red} />
            <Text style={[styles.deleteBtnText, { color: colors.red }]}>{t('sellInvestment')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      </ScrollView>

      {!isPreviewMode && inv && (
        <SellConfirmModal
          visible={showSellModal}
          ticker={inv.asset_ticker}
          quantityOwned={inv.quantity}
          quantityValue={sellQtyStr}
          onQuantityChange={setSellQtyStr}
          mode={sellPriceMode}
          onModeChange={setSellPriceMode}
          manualPriceValue={manualSellPriceStr}
          onManualPriceChange={setManualSellPriceStr}
          currentPriceText={subjectCurrentPrice > 0 ? formatCurrency(subjectCurrentPrice) : t('priceUnavailable')}
          expectedCreditText={formatCurrency(expectedCredit)}
          selling={selling}
          onCancel={closeSellModal}
          onConfirm={handleConfirmSell}
          t={t}
          colors={colors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginHorizontal: 12,
    textAlign: 'center',
  },

  // Hero
  heroCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1, minWidth: 0 },
  heroTicker: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  heroName: { fontSize: 13, marginTop: 2 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  heroPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  heroPrice: { fontSize: 32, fontWeight: '900', letterSpacing: -1.2 },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 4,
  },
  gainBadgeText: { fontSize: 13, fontWeight: '700' },

  // Chart
  chartCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  periodStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 2,
  },
  periodStatsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  highLowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
    gap: 0,
  },
  highLowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  highLowDivider: {
    width: 1,
    height: 16,
  },
  highLowLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  highLowValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  chartLoading: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },
  chartWrap: { marginLeft: -10, alignItems: 'center', marginTop: 4 },
  pointerLabel: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pointerDate: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  pointerText: { color: 'white', fontWeight: '800', fontSize: 13 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDash: { width: 16, height: 2, borderRadius: 1 },
  legendText: { fontSize: 11, fontWeight: '600' },

  // Position
  positionCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  positionItem: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
  },
  positionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  positionValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  positionSub: { fontSize: 11, marginTop: 2 },

  // Gain banner
  gainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  gainBannerLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  gainBannerValue: { fontSize: 18, fontWeight: '900', marginTop: 2 },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.28)',
    zIndex: 30,
  },
  modalBackdropTouch: {
    flex: 1,
  },
  sellModalCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    borderRadius: 20,
    padding: 16,
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  sellModalTitle: { fontSize: 18, fontWeight: '800' },
  sellModalSubtitle: { fontSize: 12, marginTop: 3, marginBottom: 10 },
  sellFieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  sellInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sellModeRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  sellModeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  sellModeBtnText: { fontSize: 12, fontWeight: '800' },
  sellAutoPrice: { fontSize: 12, marginTop: 8, marginBottom: 2 },
  sellSummary: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  sellSummaryText: { fontSize: 12, fontWeight: '600' },
  sellActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sellCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sellCancelText: { fontSize: 13, fontWeight: '700' },
  sellConfirmBtn: {
    flex: 1.3,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sellConfirmText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
