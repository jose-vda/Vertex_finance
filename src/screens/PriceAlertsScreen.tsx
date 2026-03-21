import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { supabase } from '../lib/supabase';
import { MainStackParamList } from '../navigation/types';
import { fetchAllPriceAlerts, deletePriceAlert, type InvestmentPriceAlertRow } from '../lib/priceAlerts';
import { fetchAssetPrice, type AssetType } from '../lib/priceService';
import { PriceAlertModal } from '../components/investments/PriceAlertModal';

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

const SPRING_IN = { damping: 17, stiffness: 280, mass: 0.72 } as const;
const SPRING_SOFT = { damping: 22, stiffness: 320, mass: 0.55 } as const;

/** Max rows shown before requiring “Show all alerts”. */
const PRICE_ALERTS_PREVIEW_LIMIT = 4;

export default function PriceAlertsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { t, formatCurrency } = useSettings();
  const { user } = useAuth();
  const { portfolio } = useWallet();
  const [items, setItems] = useState<InvestmentPriceAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const closingRef = useRef(false);
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(windowHeight);
  const sheetOpacity = useSharedValue(0);
  const sheetScale = useSharedValue(0.94);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await fetchAllPriceAlerts(supabase, user.id);
    if (error) {
      console.warn('[PriceAlertsScreen]', error.message);
    }
    setItems(data);
    setLoading(false);
  }, [user?.id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const playEnter = useCallback(() => {
    const travel = Math.min(windowHeight, 920);
    sheetTranslateY.value = travel;
    backdropOpacity.value = 0;
    sheetOpacity.value = 0;
    sheetScale.value = 0.92;
    requestAnimationFrame(() => {
      backdropOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
      sheetOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) });
      sheetTranslateY.value = withSpring(0, SPRING_IN);
      sheetScale.value = withSpring(1, SPRING_SOFT);
    });
  }, [backdropOpacity, sheetOpacity, sheetScale, sheetTranslateY, windowHeight]);

  useEffect(() => {
    playEnter();
  }, [playEnter]);

  const closeAnimated = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const travel = Math.min(windowHeight, 920);
    backdropOpacity.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
    sheetOpacity.value = withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) });
    sheetScale.value = withTiming(0.94, { duration: 240, easing: Easing.in(Easing.cubic) });
    sheetTranslateY.value = withTiming(
      travel,
      { duration: 340, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(navigation.goBack)();
      }
    );
  }, [backdropOpacity, navigation, sheetOpacity, sheetScale, sheetTranslateY, windowHeight]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeAnimated();
      return true;
    });
    return () => sub.remove();
  }, [closeAnimated]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetTranslateY.value }, { scale: sheetScale.value }],
  }));

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aDone = !!a.triggered_at;
      const bDone = !!b.triggered_at;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [items]);

  const hasMoreAlerts = sortedItems.length > PRICE_ALERTS_PREVIEW_LIMIT;
  const visibleAlertItems = useMemo(() => {
    if (showAllAlerts || sortedItems.length <= PRICE_ALERTS_PREVIEW_LIMIT) {
      return sortedItems;
    }
    return sortedItems.slice(0, PRICE_ALERTS_PREVIEW_LIMIT);
  }, [sortedItems, showAllAlerts]);

  const hiddenAlertsCount = Math.max(0, sortedItems.length - PRICE_ALERTS_PREVIEW_LIMIT);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmDelete = (row: InvestmentPriceAlertRow) => {
    const go = async () => {
      if (!user?.id) return;
      const ok = await deletePriceAlert(supabase, user.id, row.id);
      if (ok) await load();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(t('areYouSure'))) void go();
    } else {
      Alert.alert(t('areYouSure'), undefined, [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => void go() },
      ]);
    }
  };

  const panelBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const sheetBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const openAssetDetail = useCallback(
    async (item: InvestmentPriceAlertRow) => {
      const type = (item.asset_type || 'stock') as AssetType;
      const ticker = item.asset_ticker.trim();
      const upper = ticker.toUpperCase();

      // Same path as Wallet: use enriched position so current_price / P&L match the portfolio.
      const walletInv = portfolio?.investments.find(
        (i) => i.asset_ticker.trim().toUpperCase() === upper && i.asset_type === type
      );
      if (walletInv) {
        navigation.navigate('AssetDetail', { investment: walletInv });
        return;
      }

      // Alert on an asset you don’t hold: fetch quote so the detail screen isn’t “unavailable”.
      try {
        const price = await fetchAssetPrice(ticker, type);
        if (Number.isFinite(price) && price > 0) {
          navigation.navigate('AssetDetail', {
            assetPreview: {
              ticker: upper,
              name: item.asset_name,
              type,
              currentPrice: price,
            },
          });
          return;
        }
      } catch {
        /* fall through */
      }

      navigation.navigate('AssetDetail', {
        assetPreview: {
          ticker: upper,
          name: item.asset_name,
          type,
          currentPrice: null,
        },
      });
    },
    [navigation, portfolio]
  );

  const renderRow = (item: InvestmentPriceAlertRow, index: number, total: number) => {
    const type = (item.asset_type || 'stock') as AssetType;
    const typeColor = TYPE_COLORS[type] || colors.e500;
    const typeIcon = TYPE_ICONS[type] || 'ellipse-outline';
    const triggered = !!item.triggered_at;

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(Math.min(60 + index * 42, 320)).duration(380).springify().damping(16)}
      >
        <View style={styles.row}>
          <Pressable
            onPress={() => void openAssetDetail(item)}
            style={({ pressed }) => [styles.rowPressable, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel={t('priceAlertsOpenAssetA11y').replace('{{ticker}}', item.asset_ticker)}
          >
            <View style={[styles.typeIconWrap, { backgroundColor: `${typeColor}18` }]}>
              <Ionicons name={typeIcon as any} size={22} color={typeColor} />
            </View>
            <View style={styles.rowMain}>
              <View style={styles.rowTitleLine}>
                <Text style={[styles.ticker, { color: colors.s900 }]} numberOfLines={1}>
                  {item.asset_ticker}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: triggered
                        ? isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)'
                        : `${colors.e500}16`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: triggered ? colors.s400 : colors.e500 },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: triggered ? colors.s500 : colors.e600 },
                    ]}
                    numberOfLines={1}
                  >
                    {triggered ? t('priceAlertTriggered') : t('priceAlertActive')}
                  </Text>
                </View>
              </View>
              {item.asset_name ? (
                <Text style={[styles.assetName, { color: colors.s400 }]} numberOfLines={1}>
                  {item.asset_name}
                </Text>
              ) : null}
              <Text style={[styles.targetMeta, { color: colors.s500 }]}>
                <Text style={[styles.targetAmount, { color: colors.s900 }]}>
                  {formatCurrency(item.target_price)}
                </Text>
                {' · '}
                {item.direction === 'at_or_below' ? t('priceAlertShortBelow') : t('priceAlertShortAbove')}
              </Text>
            </View>
          </Pressable>
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.deleteBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.s400} />
          </TouchableOpacity>
        </View>
        {index < total - 1 ? <View style={[styles.separator, { backgroundColor: divider }]} /> : null}
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdropTint, backdropStyle]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAnimated} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          sheetAnimatedStyle,
          {
            backgroundColor: colors.background,
            paddingBottom: Math.max(14, insets.bottom),
            borderColor: sheetBorder,
          },
        ]}
      >
        <View style={[styles.orb1, { backgroundColor: `${colors.e500}12` }]} pointerEvents="none" />
        <View style={[styles.orb2, { backgroundColor: `${TYPE_COLORS.stock}10` }]} pointerEvents="none" />
        <Animated.View
          entering={FadeInDown.duration(340).springify().damping(14)}
          style={styles.handleWrap}
        >
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)' }]} />
        </Animated.View>
        <SafeAreaView style={[styles.safe, styles.safeFlex]} edges={['top']}>
          <Animated.View entering={FadeInDown.delay(40).duration(400).springify().damping(15)}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={closeAnimated}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.backBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name="arrow-back" size={22} color={colors.s900} />
              </TouchableOpacity>
              <View style={[styles.headerIcon, { backgroundColor: `${colors.e500}18` }]}>
                <Ionicons name="notifications-outline" size={22} color={colors.e600} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={[styles.screenTitle, { color: colors.s900 }]}>{t('priceAlertsScreenTitle')}</Text>
                <Text style={[styles.screenSubtitle, { color: colors.s500 }]} numberOfLines={2}>
                  {t('priceAlertsScreenSubtitle')}
                </Text>
              </View>
            </View>
          </Animated.View>

          {loading ? (
            <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.centered}>
              <ActivityIndicator size="large" color={colors.e500} />
              <Text style={[styles.loadingHint, { color: colors.s400 }]}>{t('priceAlertsLoading')}</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100).duration(420).springify().damping(16)} style={styles.scrollOuter}>
              <ScrollView
                style={styles.scrollFill}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.e500} />
                }
              >
                {sortedItems.length === 0 ? (
                  <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                    <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: panelBorder }]}>
                      <View style={[styles.emptyIconWrap, { backgroundColor: `${colors.e500}14` }]}>
                        <Ionicons name="notifications-outline" size={32} color={colors.e600} />
                      </View>
                      <Text style={[styles.emptyTitle, { color: colors.s900 }]}>{t('priceAlertsEmptyTitle')}</Text>
                      <Text style={[styles.emptySub, { color: colors.s500 }]}>{t('priceAlertsEmptySub')}</Text>
                    </View>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeInDown.delay(100).duration(380).springify().damping(15)}>
                    <View
                      style={[
                        styles.groupCard,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: panelBorder,
                          shadowColor: colors.s900,
                        },
                      ]}
                    >
                      <View style={[styles.panelHeader, { borderBottomColor: divider }]}>
                        <Text style={[styles.panelKicker, { color: colors.s400 }]}>{t('priceAlertsPanelKicker')}</Text>
                        <View style={[styles.countBadge, { backgroundColor: `${colors.e500}18` }]}>
                          <Text style={[styles.countBadgeText, { color: colors.e600 }]}>{sortedItems.length}</Text>
                        </View>
                      </View>
                      <View style={styles.panelBody}>
                        {visibleAlertItems.map((item, index) =>
                          renderRow(item, index, visibleAlertItems.length)
                        )}
                      </View>
                      {hasMoreAlerts ? (
                        <View style={[styles.listExpandFooter, { borderTopColor: divider }]}>
                          {!showAllAlerts ? (
                            <Pressable
                              onPress={() => setShowAllAlerts(true)}
                              style={({ pressed }) => [styles.listExpandBtn, pressed && { opacity: 0.72 }]}
                              accessibilityRole="button"
                              accessibilityLabel={`${t('priceAlertsShowAll')}. ${t('priceAlertsMoreCount').replace('{{count}}', String(hiddenAlertsCount))}`}
                            >
                              <View style={styles.listExpandBtnTextCol}>
                                <Text style={[styles.listExpandPrimary, { color: colors.e600 }]}>
                                  {t('priceAlertsShowAll')}
                                </Text>
                                <Text style={[styles.listExpandMeta, { color: colors.s400 }]}>
                                  {t('priceAlertsMoreCount').replace('{{count}}', String(hiddenAlertsCount))}
                                </Text>
                              </View>
                              <Ionicons name="chevron-down" size={20} color={colors.e600} />
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() => setShowAllAlerts(false)}
                              style={({ pressed }) => [styles.listExpandBtn, pressed && { opacity: 0.72 }]}
                              accessibilityRole="button"
                              accessibilityLabel={t('priceAlertsShowLess')}
                            >
                              <Text style={[styles.listExpandPrimary, { color: colors.e600 }]}>
                                {t('priceAlertsShowLess')}
                              </Text>
                              <Ionicons name="chevron-up" size={20} color={colors.e600} />
                            </Pressable>
                          )}
                        </View>
                      ) : null}
                    </View>
                  </Animated.View>
                )}
              </ScrollView>
            </Animated.View>
          )}
        </SafeAreaView>
      </Animated.View>

      {user?.id ? (
        <>
          <TouchableOpacity
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('priceAlertNewFabA11y')}
            onPress={() => setCreateModalVisible(true)}
            style={[
              styles.addFab,
              {
                bottom: Math.max(22, insets.bottom + 18),
                right: 22,
                backgroundColor: colors.e500,
                shadowColor: colors.s900,
              },
            ]}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <PriceAlertModal
            mode="picker"
            visible={createModalVisible}
            onClose={() => setCreateModalVisible(false)}
            userId={user.id}
            onAlertsChanged={() => void load()}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  addFab: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 14,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  backdropTint: { backgroundColor: 'rgba(15,23,42,0.42)' },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    minHeight: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  handleWrap: { alignItems: 'center' },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 6,
  },
  safe: { flex: 1 },
  safeFlex: { minHeight: 0 },
  scrollOuter: { flex: 1, minHeight: 0 },
  scrollFill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: { flex: 1, minWidth: 0 },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
  },
  loadingHint: { marginTop: 14, fontSize: 14, fontWeight: '500' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
  groupCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    marginTop: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  panelKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '800' },
  panelBody: {
    paddingHorizontal: 4,
    paddingBottom: 6,
    paddingTop: 4,
  },
  listExpandFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  listExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  listExpandBtnTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  listExpandPrimary: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  listExpandMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 10,
  },
  rowPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minWidth: 0,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ticker: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, flexShrink: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  assetName: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  targetMeta: { fontSize: 13, marginTop: 8, fontWeight: '500' },
  targetAmount: { fontWeight: '700' },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
    marginRight: 18,
  },
  orb1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    right: -80,
    opacity: 0.9,
  },
  orb2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 80,
    left: -70,
    opacity: 0.85,
  },
});
