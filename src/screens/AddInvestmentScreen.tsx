import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useWallet, AssetType, PurchaseCurrency } from '../context/WalletContext';
import { searchAssets, POPULAR_ASSETS, SearchResult, fetchAssetPrice, fetchUsdBrlRate, fetchEurUsdRate, fetchHistoricalPrices, HistoricalPrice } from '../lib/priceService';
import { fmt } from '../constants/theme';
import { Toast } from '../components/Toast';
import { MainStackParamList } from '../navigation/types';
import { InlineIndexCard } from '../components/investments/InlineIndexCard';

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

const CURRENCIES: PurchaseCurrency[] = ['USD', 'BRL', 'EUR'];
const INLINE_PERIODS = [
  { key: '1M', days: 30 },
  { key: '6M', days: 180 },
  { key: '1Y', days: 365 },
  { key: '5Y', days: 1825 },
  { key: 'ALL', days: 3650 },
] as const;

export default function AddInvestmentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { colors } = useTheme();
  const { t } = useSettings();
  const { addInvestment } = useWallet();
  const { appState } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [quantityStr, setQuantityStr] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [currency, setCurrency] = useState<PurchaseCurrency>('USD');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loadingLivePrice, setLoadingLivePrice] = useState(false);
  const [livePriceError, setLivePriceError] = useState<string | null>(null);
  const [livePriceUpdatedAt, setLivePriceUpdatedAt] = useState<Date | null>(null);
  const livePriceReqRef = useRef(0);
  const [showInlineIndex, setShowInlineIndex] = useState(false);
  const [inlinePeriod, setInlinePeriod] = useState<(typeof INLINE_PERIODS)[number]['key']>('1M');
  const [inlineHistory, setInlineHistory] = useState<HistoricalPrice[]>([]);
  const [loadingInlineHistory, setLoadingInlineHistory] = useState(false);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 1) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchAssets(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // Select asset from search
  function selectAsset(asset: SearchResult) {
    setTicker(asset.ticker);
    setName(asset.name);
    setAssetType(asset.type);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }

  // Reset to search
  function resetSelection() {
    setTicker('');
    setName('');
    setShowSearch(true);
    setLivePrice(null);
    setLoadingLivePrice(false);
    setLivePriceError(null);
    setLivePriceUpdatedAt(null);
    setShowInlineIndex(false);
    setInlineHistory([]);
    setInlinePeriod('1M');
  }

  const convertFromUsd = useCallback(async (usdPrice: number, targetCurrency: PurchaseCurrency): Promise<number> => {
    if (targetCurrency === 'USD') return usdPrice;
    if (targetCurrency === 'BRL') {
      const usdBrl = await fetchUsdBrlRate();
      return usdPrice * usdBrl;
    }
    const eurUsd = await fetchEurUsdRate();
    if (!Number.isFinite(eurUsd) || eurUsd <= 0) throw new Error('Invalid FX rate');
    return usdPrice / eurUsd;
  }, []);

  const loadLivePrice = useCallback(async () => {
    const trimmedTicker = ticker.trim().toUpperCase();
    if (!trimmedTicker || showSearch) return;
    const reqId = ++livePriceReqRef.current;
    setLoadingLivePrice(true);
    setLivePriceError(null);
    try {
      const usdPrice = await fetchAssetPrice(trimmedTicker, assetType);
      const converted = await convertFromUsd(usdPrice, currency);
      if (reqId !== livePriceReqRef.current) return;
      if (!Number.isFinite(converted) || converted <= 0) throw new Error('Invalid live price');
      setLivePrice(converted);
      setLivePriceUpdatedAt(new Date());
    } catch {
      if (reqId !== livePriceReqRef.current) return;
      setLivePrice(null);
      setLivePriceError(t('unavailableFillManually'));
    } finally {
      if (reqId === livePriceReqRef.current) setLoadingLivePrice(false);
    }
  }, [ticker, showSearch, assetType, currency, convertFromUsd, t]);

  useEffect(() => {
    void loadLivePrice();
  }, [loadLivePrice]);

  const applyLivePriceToInput = useCallback(() => {
    if (!livePrice || !Number.isFinite(livePrice)) return;
    setPriceStr(livePrice.toFixed(livePrice >= 1 ? 2 : 6));
  }, [livePrice]);

  const toggleInlineIndex = useCallback(() => {
    const trimmedTicker = ticker.trim().toUpperCase();
    if (!trimmedTicker) return;
    setShowInlineIndex((prev) => !prev);
  }, [ticker]);

  const selectedInlineDays = useMemo(
    () => INLINE_PERIODS.find((p) => p.key === inlinePeriod)?.days ?? 30,
    [inlinePeriod]
  );

  const loadInlineHistory = useCallback(async () => {
    const trimmedTicker = ticker.trim().toUpperCase();
    if (!trimmedTicker || showSearch || !showInlineIndex) return;
    setLoadingInlineHistory(true);
    try {
      const data = await fetchHistoricalPrices(trimmedTicker, assetType, selectedInlineDays);
      setInlineHistory(data);
    } catch {
      setInlineHistory([]);
    } finally {
      setLoadingInlineHistory(false);
    }
  }, [ticker, showSearch, showInlineIndex, assetType, selectedInlineDays]);

  useEffect(() => {
    void loadInlineHistory();
  }, [loadInlineHistory]);

  const inlineChartData = useMemo(() => {
    if (inlineHistory.length < 2) return [];
    const maxPoints =
      selectedInlineDays <= 30 ? 36 :
      selectedInlineDays <= 180 ? 60 :
      selectedInlineDays <= 365 ? 80 :
      selectedInlineDays <= 1825 ? 120 : 160;
    const step = Math.max(1, Math.floor(inlineHistory.length / maxPoints));
    const filtered = inlineHistory.filter((_, i) => i % step === 0 || i === inlineHistory.length - 1);
    const labelInterval = Math.max(1, Math.floor(filtered.length / 4));
    return filtered.map((h, i, arr) => {
      let label = '';
      if (i === 0 || i === arr.length - 1 || i % labelInterval === 0) {
        if (selectedInlineDays > 365) {
          const [, m] = h.date.split('-');
          const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = `${months[parseInt(m, 10)]} ${h.date.slice(2, 4)}`;
        } else {
          const [, m, d] = h.date.split('-');
          label = `${d}/${m}`;
        }
      }
      return {
        value: h.price,
        date: h.date,
        label,
        labelTextStyle: { color: colors.s400, fontSize: 8, width: 40 },
      };
    });
  }, [inlineHistory, selectedInlineDays, colors.s400]);

  const inlineStats = useMemo(() => {
    if (inlineHistory.length < 2) return null;
    const first = inlineHistory[0].price;
    const last = inlineHistory[inlineHistory.length - 1].price;
    const change = last - first;
    const pct = first > 0 ? (change / first) * 100 : 0;
    const prices = inlineHistory.map((h) => h.price);
    return {
      positive: change >= 0,
      pct,
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }, [inlineHistory]);

  async function handleSave() {
    const trimmedTicker = ticker.trim().toUpperCase();
    if (!trimmedTicker) {
      Alert.alert(t('error'), t('assetTicker') + ' required');
      return;
    }
    const qty = parseFloat(quantityStr.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(t('error'), t('quantity') + ' invalid');
      return;
    }
    const price = parseFloat(priceStr.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      Alert.alert(t('error'), t('avgPurchasePrice') + ' invalid');
      return;
    }

    setSaving(true);
    try {
      const result = await addInvestment({
        asset_ticker: trimmedTicker,
        asset_name: name.trim() || null,
        asset_type: assetType,
        quantity: qty,
        average_purchase_price: price,
        purchase_currency: currency,
        notes: notes.trim() || null,
      });
      if (result === 'insufficient_balance') {
        const costBasis = qty * price;
        const msg = t('insufficientBalanceMsg')
          .replace('%1', fmt(appState.netWorth))
          .replace('%2', fmt(costBasis));
        Alert.alert(t('insufficientBalance'), msg);
      } else if (result === true) {
        setToastVisible(true);
        setTimeout(() => navigation.goBack(), 600);
      } else {
        Alert.alert(t('error'), t('investmentSaveFailed'));
      }
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || t('investmentSaveFailed'));
    } finally {
      setSaving(false);
    }
  }

  // Popular assets grouped by type
  const popularByType = {
    stock: POPULAR_ASSETS.filter((a) => a.type === 'stock').slice(0, 4),
    index: POPULAR_ASSETS.filter((a) => a.type === 'index').slice(0, 4),
    crypto: POPULAR_ASSETS.filter((a) => a.type === 'crypto').slice(0, 4),
    commodity: POPULAR_ASSETS.filter((a) => a.type === 'commodity').slice(0, 4),
  };

  function renderSearchResult({ item }: { item: SearchResult }) {
    const iconName = TYPE_ICONS[item.type] || 'ellipse';
    const typeColor = TYPE_COLORS[item.type] || colors.e500;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.resultRow, { borderBottomColor: colors.s100 }]}
        onPress={() => selectAsset(item)}
      >
        <View style={[styles.resultIcon, { backgroundColor: `${typeColor}18` }]}>
          <Ionicons name={iconName as any} size={20} color={typeColor} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTicker, { color: colors.s900 }]}>{item.ticker}</Text>
          <Text style={[styles.resultName, { color: colors.s400 }]} numberOfLines={1}>
            {item.name}
            {item.exchange ? ` · ${item.exchange}` : ''}
          </Text>
        </View>
        <View style={[styles.resultTypeBadge, { backgroundColor: `${typeColor}18` }]}>
          <Text style={[styles.resultTypeText, { color: typeColor }]}>
            {t(item.type + 'Type')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const inlineColor = TYPE_COLORS[assetType] || colors.e500;

  return (
    <KeyboardAvoidingView
      style={[styles.kav, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={[styles.scroll, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.s900} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.s900 }]}>{t('addInvestment')}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Available balance banner */}
          <View style={[styles.balanceBanner, { backgroundColor: colors.e50 }]}>
            <Ionicons name="wallet-outline" size={18} color={colors.e600} />
            <Text style={[styles.balanceLabel, { color: colors.e600 }]}>{t('availableToInvest')}:</Text>
            <Text style={[styles.balanceValue, { color: colors.e600 }]}>{fmt(appState.netWorth)}</Text>
          </View>

          {showSearch ? (
            /* ─── SEARCH MODE ─── */
            <Animated.View entering={FadeIn.duration(300)}>
              {/* Search bar */}
              <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]}>
                <Ionicons name="search" size={20} color={colors.s400} />
                <TextInput
                  style={[styles.searchInput, { color: colors.s900 }]}
                  placeholder={t('searchPlaceholder')}
                  placeholderTextColor={colors.s400}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus
                  returnKeyType="search"
                />
                {searching && <ActivityIndicator size="small" color={colors.e500} />}
                {searchQuery.length > 0 && !searching && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                    <Ionicons name="close-circle" size={20} color={colors.s400} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search results */}
              {searchResults.length > 0 ? (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={[styles.resultsCard, { backgroundColor: colors.cardBg }]}
                >
                  <Text style={[styles.sectionLabel, { color: colors.s400 }]}>{t('searchResults')}</Text>
                  {searchResults.map((item) => (
                    <React.Fragment key={`${item.ticker}-${item.type}`}>
                      {renderSearchResult({ item })}
                    </React.Fragment>
                  ))}
                </Animated.View>
              ) : searchQuery.length > 0 && !searching ? (
                <View style={[styles.emptyResults, { backgroundColor: colors.cardBg }]}>
                  <Ionicons name="search-outline" size={32} color={colors.s300} />
                  <Text style={[styles.emptyText, { color: colors.s400 }]}>{t('noResultsFound')}</Text>
                </View>
              ) : (
                /* Popular assets */
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                  <Text style={[styles.sectionLabel, { color: colors.s400 }]}>{t('popularAssets')}</Text>

                  {([
                    { key: 'stock', icon: 'trending-up', color: '#3B82F6', label: t('stocks') },
                    { key: 'crypto', icon: 'logo-bitcoin', color: '#F59E0B', label: t('crypto') },
                    { key: 'index', icon: 'stats-chart', color: '#8B5CF6', label: t('indices') },
                    { key: 'commodity', icon: 'diamond-outline', color: '#10B981', label: t('commodities') },
                  ] as const).map((section) => {
                    const isOpen = expandedType === section.key;
                    const assets = popularByType[section.key];
                    return (
                      <View key={section.key} style={[styles.popularSection, { backgroundColor: colors.cardBg }]}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.popularHeader}
                          onPress={() => setExpandedType(isOpen ? null : section.key)}
                        >
                          <Ionicons name={section.icon as any} size={16} color={section.color} />
                          <Text style={[styles.popularTitle, { color: colors.s900 }]}>{section.label}</Text>
                          <View style={{ flex: 1 }} />
                          <Text style={[styles.popularCount, { color: colors.s400 }]}>{assets.length}</Text>
                          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.s400} />
                        </TouchableOpacity>
                        {isOpen && (
                          <View style={styles.popularGrid}>
                            {assets.map((asset) => (
                              <TouchableOpacity
                                key={asset.ticker}
                                activeOpacity={0.7}
                                style={[styles.popularChip, { borderColor: colors.s200, backgroundColor: colors.s50 }]}
                                onPress={() => selectAsset(asset)}
                              >
                                <Text style={[styles.popularChipTicker, { color: colors.s900 }]}>{asset.ticker}</Text>
                                <Text style={[styles.popularChipName, { color: colors.s400 }]} numberOfLines={1}>{asset.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </Animated.View>
              )}
            </Animated.View>
          ) : (
            /* ─── FORM MODE ─── */
            <Animated.View entering={FadeInDown.duration(400)}>
              {/* Selected asset card */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.selectedCard, { backgroundColor: colors.cardBg, borderColor: colors.e500 }]}
                onPress={resetSelection}
              >
                <View style={[styles.selectedIcon, { backgroundColor: `${TYPE_COLORS[assetType]}18` }]}>
                  <Ionicons name={TYPE_ICONS[assetType] as any} size={24} color={TYPE_COLORS[assetType]} />
                </View>
                <View style={styles.selectedInfo}>
                  <Text style={[styles.selectedTicker, { color: colors.s900 }]}>{ticker}</Text>
                  <Text style={[styles.selectedName, { color: colors.s400 }]}>{name || t(assetType + 'Type')}</Text>
                </View>
                <View style={[styles.changeBadge, { backgroundColor: colors.e50 }]}>
                  <Ionicons name="swap-horizontal" size={14} color={colors.e600} />
                  <Text style={[styles.changeText, { color: colors.e600 }]}>{t('change')}</Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.livePriceCard, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]}>
                <View style={styles.livePriceTopRow}>
                  <Text style={[styles.livePriceLabel, { color: colors.s500 }]}>{t('currentPriceShort')}</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => void loadLivePrice()} disabled={loadingLivePrice}>
                    <Text style={[styles.livePriceRefresh, { color: colors.e600 }]}>
                      {loadingLivePrice ? t('refreshing') : t('refresh')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {loadingLivePrice ? (
                  <ActivityIndicator size="small" color={colors.e500} />
                ) : livePrice !== null ? (
                  <>
                    <Text style={[styles.livePriceValue, { color: colors.s900 }]}>
                      {currency} {fmt(livePrice)}
                    </Text>
                    <Text style={[styles.livePriceTime, { color: colors.s400 }]}>
                      {livePriceUpdatedAt ? `${t('updatedAt')}: ${livePriceUpdatedAt.toLocaleTimeString()}` : t('updatedNow')}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.useLivePriceBtn, { backgroundColor: colors.e500 }]}
                      onPress={applyLivePriceToInput}
                    >
                      <Text style={styles.useLivePriceBtnText}>{t('useCurrentPrice')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.viewIndexBtn, { borderColor: colors.e500 }]}
                      onPress={toggleInlineIndex}
                    >
                      <Text style={[styles.viewIndexBtnText, { color: colors.e600 }]}>
                        {showInlineIndex ? t('viewLess') : t('viewIndex')}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.livePriceError, { color: colors.s400 }]}>
                    {livePriceError || t('unavailableFillManually')}
                  </Text>
                )}
              </View>

              {showInlineIndex && (
                <Animated.View
                  entering={FadeInDown.duration(240)}
                  exiting={FadeOutUp.duration(180)}
                >
                  <InlineIndexCard
                    visible={showInlineIndex}
                    periods={INLINE_PERIODS}
                    selectedPeriod={inlinePeriod}
                    onChangePeriod={(key) => setInlinePeriod(key as (typeof INLINE_PERIODS)[number]['key'])}
                    loading={loadingInlineHistory}
                    data={inlineChartData}
                    stats={inlineStats}
                    color={inlineColor}
                    colors={colors}
                    t={t}
                    fmt={fmt}
                  />
                </Animated.View>
              )}

              <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]}>
                <View style={styles.rowCompact}>
                  <View style={styles.colCompact}>
                    <Text style={[styles.label, { color: colors.s500 }]}>{t('quantity')}</Text>
                    <TextInput
                      style={[styles.input, styles.inputCompact, { backgroundColor: colors.s50, color: colors.s900, borderColor: colors.s200 }]}
                      placeholder={t('quantityPlaceholder')}
                      placeholderTextColor={colors.s400}
                      value={quantityStr}
                      onChangeText={setQuantityStr}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.colCompact}>
                    <Text style={[styles.label, { color: colors.s500 }]}>{t('avgPurchasePrice')}</Text>
                    <TextInput
                      style={[styles.input, styles.inputCompact, { backgroundColor: colors.s50, color: colors.s900, borderColor: colors.s200 }]}
                      placeholder={t('pricePlaceholder')}
                      placeholderTextColor={colors.s400}
                      value={priceStr}
                      onChangeText={setPriceStr}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Purchase Currency */}
                <Text style={[styles.label, { color: colors.s500 }]}>{t('purchaseCurrency')}</Text>
                <View style={styles.currencyRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.7}
                      style={[
                        styles.currencyBtn,
                        styles.currencyBtnCompact,
                        { borderColor: colors.s200, backgroundColor: colors.s50 },
                        currency === c && { backgroundColor: colors.e500, borderColor: colors.e500 },
                      ]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.currencyBtnText,
                          styles.currencyBtnTextCompact,
                          { color: colors.s500 },
                          currency === c && { color: '#fff' },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Notes */}
                <Text style={[styles.label, { color: colors.s500 }]}>{t('notes')} ({t('optional')})</Text>
                <TextInput
                  style={[styles.input, styles.inputCompact, styles.textArea, { backgroundColor: colors.s50, color: colors.s900, borderColor: colors.s200 }]}
                  placeholder={t('notesPlaceholder')}
                  placeholderTextColor={colors.s400}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.saveBtn, { backgroundColor: colors.e500 }, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>{t('saveInvestment')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        <Toast
          visible={toastVisible}
          message={t('investmentSaved')}
          onHide={() => setToastVisible(false)}
          accentColor={colors.e500}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 13, fontWeight: '600' },
  balanceValue: { fontSize: 15, fontWeight: '800', marginLeft: 'auto' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },

  // Results
  resultsCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultTicker: { fontSize: 15, fontWeight: '700' },
  resultName: { fontSize: 12, marginTop: 1 },
  resultTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resultTypeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Empty
  emptyResults: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Popular
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  popularSection: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularTitle: { fontSize: 14, fontWeight: '700' },
  popularCount: { fontSize: 12, fontWeight: '600', marginRight: 4 },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  popularChip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  popularChipTicker: { fontSize: 14, fontWeight: '800' },
  popularChipName: { fontSize: 11, marginTop: 2 },

  // Selected asset
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInfo: { flex: 1, minWidth: 0 },
  selectedTicker: { fontSize: 18, fontWeight: '800' },
  selectedName: { fontSize: 13, marginTop: 2 },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  changeText: { fontSize: 11, fontWeight: '600' },
  livePriceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  livePriceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  livePriceLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  livePriceRefresh: { fontSize: 12, fontWeight: '700' },
  livePriceValue: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  livePriceTime: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  livePriceError: { fontSize: 13, lineHeight: 19 },
  useLivePriceBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  useLivePriceBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  viewIndexBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  viewIndexBtnText: { fontSize: 12, fontWeight: '700' },
  inlineIndexCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  inlinePeriodsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  inlinePeriodBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  inlinePeriodBtnText: { fontSize: 11, fontWeight: '800' },
  inlineLoadingWrap: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineLoadingText: { fontSize: 12, fontWeight: '600' },
  inlineStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlineHighLowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 0,
  },
  inlineHighLowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inlineHighLowDivider: {
    width: 1,
    height: 16,
  },
  inlineHighLowLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  inlineHighLowValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  inlineChartWrap: { marginLeft: -10, alignItems: 'center', marginTop: 2 },
  inlinePointerLabel: {
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
  inlinePointerDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  inlinePointerText: { color: 'white', fontWeight: '800', fontSize: 13 },

  // Form
  card: { borderRadius: 22, padding: 16, borderWidth: 1 },
  rowCompact: { flexDirection: 'row', gap: 10 },
  colCompact: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 2 },
  input: { borderRadius: 12, paddingHorizontal: 12, fontSize: 14, marginBottom: 10, borderWidth: 1 },
  inputCompact: { minHeight: 44, paddingVertical: 10 },
  textArea: { minHeight: 56, textAlignVertical: 'top' },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  currencyBtn: { borderRadius: 999, borderWidth: 1.5 },
  currencyBtnCompact: { paddingVertical: 8, paddingHorizontal: 14 },
  currencyBtnText: { fontWeight: '600' },
  currencyBtnTextCompact: { fontSize: 12 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
