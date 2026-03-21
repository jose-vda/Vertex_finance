import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
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
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';
import {
  searchAssets,
  POPULAR_ASSETS,
  fetchAssetPrice,
  type AssetType,
  type SearchResult,
} from '../../lib/priceService';
import type { PriceAlertDirection, InvestmentPriceAlertRow } from '../../lib/priceAlerts';
import {
  fetchPriceAlertsForAsset,
  createPriceAlert,
  deletePriceAlert,
} from '../../lib/priceAlerts';

type BaseProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onAlertsChanged?: () => void;
};

export type PriceAlertModalProps =
  | (BaseProps & {
      mode: 'picker';
    })
  | (BaseProps & {
      mode?: 'asset';
      ticker: string;
      assetName: string;
      assetType: AssetType;
      currentPrice: number;
    });

function parseTargetInput(raw: string): number {
  const n = parseFloat(raw.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

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

const SPRING_SHEET = { damping: 19, stiffness: 320, mass: 0.72 } as const;

export function PriceAlertModal(props: PriceAlertModalProps) {
  const { visible, onClose, userId, onAlertsChanged } = props;
  const isPicker = props.mode === 'picker';
  const fixedAsset = !isPicker
    ? {
        ticker: props.ticker,
        assetName: props.assetName,
        assetType: props.assetType,
        currentPrice: props.currentPrice,
      }
    : null;

  const { height: winH } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { t, formatCurrency } = useSettings();

  const [pickerStep, setPickerStep] = useState<'search' | 'configure'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<{ result: SearchResult; currentPrice: number } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [direction, setDirection] = useState<PriceAlertDirection>('at_or_below');
  const [targetStr, setTargetStr] = useState('');
  const [list, setList] = useState<InvestmentPriceAlertRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const closingRef = useRef(false);
  const backdropOp = useSharedValue(0);
  const sheetY = useSharedValue(winH);
  const sheetScale = useSharedValue(0.96);

  const effectiveTicker = isPicker ? picked?.result.ticker ?? '' : fixedAsset!.ticker;
  const effectiveName = isPicker ? picked?.result.name ?? '' : fixedAsset!.assetName;
  const effectiveType = (isPicker ? picked?.result.type : fixedAsset!.assetType) as AssetType;
  const effectivePrice = isPicker ? picked?.currentPrice ?? 0 : fixedAsset!.currentPrice;

  const loadList = useCallback(async () => {
    if (!effectiveTicker || (isPicker && pickerStep !== 'configure')) {
      setList([]);
      return;
    }
    setLoadingList(true);
    const { data } = await fetchPriceAlertsForAsset(supabase, userId, effectiveTicker, effectiveType);
    setList(data);
    setLoadingList(false);
  }, [userId, effectiveTicker, effectiveType, isPicker, pickerStep]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    backdropOp.value = 0;
    sheetY.value = Math.min(winH * 0.45, 420);
    sheetScale.value = 0.94;
    requestAnimationFrame(() => {
      backdropOp.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      sheetY.value = withSpring(0, SPRING_SHEET);
      sheetScale.value = withSpring(1, { damping: 20, stiffness: 340, mass: 0.55 });
    });
    setTargetStr('');
    setDirection('at_or_below');
    setSavedFlash(false);
    if (isPicker) {
      setPickerStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setPicked(null);
    }
  }, [visible, isPicker, backdropOp, sheetY, sheetScale, winH]);

  useEffect(() => {
    if (!visible) return;
    if (isPicker && pickerStep === 'search') return;
    if (isPicker && !picked) return;
    if (!isPicker || picked) void loadList();
  }, [visible, isPicker, pickerStep, picked, loadList]);

  const runClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const drop = Math.min(winH * 0.5, 480);
    backdropOp.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
    sheetScale.value = withTiming(0.96, { duration: 240, easing: Easing.in(Easing.cubic) });
    sheetY.value = withTiming(
      drop,
      { duration: 320, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          closingRef.current = false;
          runOnJS(onClose)();
        }
      }
    );
  }, [backdropOp, onClose, sheetScale, sheetY, winH]);

  const requestClose = useCallback(() => {
    runClose();
  }, [runClose]);

  const onSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 1) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchAssets(q.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 380);
  };

  const pickAsset = async (asset: SearchResult) => {
    setPriceLoading(true);
    let p = 0;
    try {
      p = await fetchAssetPrice(asset.ticker, asset.type);
    } catch {
      p = 0;
    }
    setPicked({ result: asset, currentPrice: p });
    setPickerStep('configure');
    setPriceLoading(false);
  };

  const handleSave = async () => {
    const target = parseTargetInput(targetStr);
    if (!Number.isFinite(target) || target <= 0) {
      if (Platform.OS === 'web') window.alert(t('priceAlertInvalidPrice'));
      else Alert.alert(t('error'), t('priceAlertInvalidPrice'));
      return;
    }
    setSaving(true);
    const { ok, error } = await createPriceAlert(supabase, userId, {
      asset_ticker: effectiveTicker,
      asset_name: effectiveName || null,
      asset_type: effectiveType,
      target_price: target,
      direction,
    });
    setSaving(false);
    if (!ok) {
      if (Platform.OS === 'web') window.alert(error || t('saveTransactionFailed'));
      else Alert.alert(t('error'), error || t('saveTransactionFailed'));
      return;
    }
    setTargetStr('');
    await loadList();
    onAlertsChanged?.();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const handleDelete = async (id: string) => {
    const ok = await deletePriceAlert(supabase, userId, id);
    if (ok) {
      await loadList();
      onAlertsChanged?.();
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }, { scale: sheetScale.value }],
  }));

  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const typeColor = TYPE_COLORS[effectiveType] || colors.e500;
  const typeIcon = TYPE_ICONS[effectiveType] || 'ellipse-outline';

  const showConfigure = !isPicker || (pickerStep === 'configure' && picked);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={requestClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <View style={styles.flexEnd}>
          <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="box-none">
            <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              sheetAnimStyle,
              {
                backgroundColor: colors.cardBg,
                borderColor: border,
                maxHeight: Math.min(winH * 0.88, 640),
                shadowColor: colors.s900,
              },
            ]}
          >
            <View style={[styles.sheetGrab, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.18)' }]} />

            <View style={styles.sheetHeader}>
              {isPicker && pickerStep === 'configure' ? (
                <TouchableOpacity
                  onPress={() => {
                    setPickerStep('search');
                    setPicked(null);
                  }}
                  style={[
                    styles.iconBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                  ]}
                  hitSlop={12}
                >
                  <Ionicons name="chevron-back" size={22} color={colors.e600} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.sheetIcon, { backgroundColor: `${colors.e500}18` }]}>
                  <Ionicons name="notifications-outline" size={22} color={colors.e600} />
                </View>
              )}
              <Text style={[styles.sheetTitle, { color: colors.s900 }]} numberOfLines={1}>
                {isPicker && pickerStep === 'search' ? t('priceAlertPickAsset') : t('priceAlertModalTitle')}
              </Text>
              <TouchableOpacity
                onPress={requestClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Ionicons name="close" size={22} color={colors.e600} />
              </TouchableOpacity>
            </View>

            {isPicker && pickerStep === 'search' && (
              <Animated.View entering={FadeInDown.duration(360).springify().damping(16)} style={[styles.searchSection, { position: 'relative' }]}>
                <Text style={[styles.kicker, { color: colors.s400 }]}>{t('priceAlertSearchKicker')}</Text>
                <View style={[styles.searchBar, { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50 }]}>
                  <Ionicons name="search" size={18} color={colors.s400} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder={t('priceAlertSearchPlaceholder')}
                    placeholderTextColor={colors.s300}
                    style={[styles.searchInput, { color: colors.s900 }]}
                    autoCorrect={false}
                    autoCapitalize="characters"
                  />
                  {searching ? <ActivityIndicator size="small" color={colors.e500} /> : null}
                </View>

                <Text style={[styles.popularLabel, { color: colors.s400 }]}>{t('priceAlertPopular')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
                  {POPULAR_ASSETS.slice(0, 14).map((a) => (
                    <TouchableOpacity
                      key={`${a.ticker}-${a.type}`}
                      style={[
                        styles.popularChip,
                        {
                          borderColor: border,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        },
                      ]}
                      onPress={() => void pickAsset(a)}
                      disabled={priceLoading}
                    >
                      <Text style={[styles.popularTicker, { color: colors.s900 }]}>{a.ticker}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FlatList
                  data={searchResults}
                  keyExtractor={(item, i) => `${item.ticker}-${item.type}-${i}`}
                  keyboardShouldPersistTaps="handled"
                  style={styles.resultsList}
                  ListEmptyComponent={
                    searchQuery.trim().length >= 1 && !searching ? (
                      <Text style={[styles.emptySearch, { color: colors.s400 }]}>{t('priceAlertNoResults')}</Text>
                    ) : null
                  }
                  renderItem={({ item }) => {
                    const tc = TYPE_COLORS[item.type] || colors.e500;
                    const ti = TYPE_ICONS[item.type] || 'ellipse-outline';
                    return (
                      <TouchableOpacity
                        style={[styles.resultRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => void pickAsset(item)}
                        disabled={priceLoading}
                      >
                        <View style={[styles.resultIcon, { backgroundColor: `${tc}18` }]}>
                          <Ionicons name={ti as any} size={18} color={tc} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTicker, { color: colors.s900 }]}>{item.ticker}</Text>
                          <Text style={[styles.resultName, { color: colors.s400 }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.s300} />
                      </TouchableOpacity>
                    );
                  }}
                />
                {priceLoading ? (
                  <View
                    style={[
                      styles.priceLoading,
                      { backgroundColor: isDark ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.82)' },
                    ]}
                  >
                    <ActivityIndicator color={colors.e500} />
                    <Text style={[styles.priceLoadingText, { color: colors.s400 }]}>{t('loadingPrices')}</Text>
                  </View>
                ) : null}
              </Animated.View>
            )}

            {showConfigure && (
              <Animated.View entering={FadeInDown.duration(380).springify().damping(15)} style={styles.configureScroll}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={[styles.assetStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: border }]}>
                    <View style={[styles.assetStripIcon, { backgroundColor: `${typeColor}18` }]}>
                      <Ionicons name={typeIcon as any} size={22} color={typeColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assetStripTicker, { color: colors.s900 }]}>{effectiveTicker}</Text>
                      <Text style={[styles.assetStripSub, { color: colors.s500 }]} numberOfLines={1}>
                        {effectiveName} · {!effectivePrice || effectivePrice <= 0 ? '—' : formatCurrency(effectivePrice)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.label, { color: colors.s400 }]}>{t('priceAlertDirectionLabel')}</Text>
                  <View style={styles.dirRow}>
                    <TouchableOpacity
                      style={[
                        styles.dirChip,
                        { borderColor: border, backgroundColor: direction === 'at_or_below' ? `${colors.e500}22` : 'transparent' },
                      ]}
                      onPress={() => setDirection('at_or_below')}
                    >
                      <Ionicons name="arrow-down" size={16} color={direction === 'at_or_below' ? colors.e600 : colors.s400} />
                      <Text style={[styles.dirChipText, { color: direction === 'at_or_below' ? colors.e600 : colors.s500 }]}>
                        {t('priceAlertAtOrBelow')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.dirChip,
                        { borderColor: border, backgroundColor: direction === 'at_or_above' ? `${colors.e500}22` : 'transparent' },
                      ]}
                      onPress={() => setDirection('at_or_above')}
                    >
                      <Ionicons name="arrow-up" size={16} color={direction === 'at_or_above' ? colors.e600 : colors.s400} />
                      <Text style={[styles.dirChipText, { color: direction === 'at_or_above' ? colors.e600 : colors.s500 }]}>
                        {t('priceAlertAtOrAbove')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { color: colors.s400 }]}>{t('priceAlertTargetLabel')}</Text>
                  <TextInput
                    value={targetStr}
                    onChangeText={setTargetStr}
                    keyboardType="decimal-pad"
                    placeholder={t('priceAlertTargetPlaceholder')}
                    placeholderTextColor={colors.s300}
                    style={[styles.input, { color: colors.s900, borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50 }]}
                  />

                  {savedFlash ? (
                    <View style={[styles.savedBanner, { backgroundColor: `${colors.e500}14` }]}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.e600} />
                      <Text style={[styles.savedBannerText, { color: colors.e600 }]}>{t('priceAlertSaved')}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.e500 }, saving && { opacity: 0.7 }]}
                    onPress={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('priceAlertSave')}</Text>}
                  </TouchableOpacity>

                  <Text style={[styles.sectionLabel, { color: colors.s400 }]}>{t('priceAlertYourAlerts')}</Text>
                  {loadingList ? (
                    <ActivityIndicator color={colors.e500} style={{ marginVertical: 16 }} />
                  ) : (
                    <View style={styles.listBlock}>
                      {list.length === 0 ? (
                        <Text style={[styles.empty, { color: colors.s400 }]}>{t('priceAlertNoneForAsset')}</Text>
                      ) : (
                        list.map((row) => (
                          <View
                            key={row.id}
                            style={[styles.rowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.rowTitle, { color: colors.s900 }]}>
                                {formatCurrency(row.target_price)}{' '}
                                <Text style={{ color: colors.s400, fontWeight: '500' }}>
                                  {row.direction === 'at_or_below' ? t('priceAlertShortBelow') : t('priceAlertShortAbove')}
                                </Text>
                              </Text>
                              <Text style={[styles.rowMeta, { color: colors.s400 }]}>
                                {row.triggered_at ? t('priceAlertTriggered') : t('priceAlertActive')}
                              </Text>
                            </View>
                            {!row.triggered_at ? (
                              <TouchableOpacity onPress={() => void handleDelete(row.id)} hitSlop={12}>
                                <Ionicons name="trash-outline" size={20} color={colors.s400} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  flexEnd: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetGrab: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: { flex: 1, minHeight: 280 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', padding: 0 },
  popularLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  popularRow: { gap: 8, paddingBottom: 14, flexDirection: 'row' },
  popularChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  popularTicker: { fontSize: 13, fontWeight: '800' },
  resultsList: { flexGrow: 0, maxHeight: 280 },
  emptySearch: { textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTicker: { fontSize: 16, fontWeight: '800' },
  resultName: { fontSize: 13, marginTop: 2 },
  priceLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceLoadingText: { marginTop: 10, fontSize: 14 },
  configureScroll: { flex: 1, maxHeight: 520 },
  assetStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  assetStripIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetStripTicker: { fontSize: 17, fontWeight: '800' },
  assetStripSub: { fontSize: 13, marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  dirRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dirChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dirChipText: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  savedBannerText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  listBlock: { paddingBottom: 20 },
  empty: { fontSize: 14, paddingVertical: 12 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowMeta: { fontSize: 12, marginTop: 4 },
});
