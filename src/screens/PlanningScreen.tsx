import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInLeft, FadeInUp, useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { PlanningWealthChart } from '../components/charts';
import { CURRENCY_OPTIONS } from '../context/SettingsContext';

/**
 * PMT = (FV - PV*(1+i)^n) / (((1+i)^n - 1) / i)
 * FV = goal, PV = current, i = monthly rate, n = months
 */
function calculatePMT(FV: number, PV: number, iMonthly: number, n: number): number | null {
  if (n <= 0 || !Number.isFinite(FV) || !Number.isFinite(PV) || !Number.isFinite(iMonthly)) return null;
  const onePlus = 1 + iMonthly;
  const onePlusN = Math.pow(onePlus, n);
  const numerator = FV - PV * onePlusN;
  const annuityFactor = (onePlusN - 1) / iMonthly;
  if (!Number.isFinite(annuityFactor) || annuityFactor <= 0) return null;
  return numerator / annuityFactor;
}

function annualToMonthly(annualPct: number): number {
  const annualDecimal = annualPct / 100;
  return Math.pow(1 + annualDecimal, 1 / 12) - 1;
}

/** Balance at end of month k: PV*(1+i)^k + PMT * (((1+i)^k - 1) / i) */
function balanceAtMonth(PV: number, PMT: number, i: number, k: number): number {
  if (k <= 0) return PV;
  if (i === 0 || !Number.isFinite(i)) return PV + PMT * k;
  const onePlusK = Math.pow(1 + i, k);
  return PV * onePlusK + PMT * ((onePlusK - 1) / i);
}

function calculateFV(PV: number, PMT: number, iMonthly: number, n: number): number {
  if (n <= 0) return PV;
  if (iMonthly === 0 || !Number.isFinite(iMonthly)) return PV + PMT * n;
  const onePlusN = Math.pow(1 + iMonthly, n);
  return PV * onePlusN + PMT * ((onePlusN - 1) / iMonthly);
}

type PlanningMode = 'goal' | 'projection';

export default function PlanningScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { appState } = useAuth();
  const { t, formatCurrency, currency } = useSettings();
  const currentNetWorth = appState.netWorth;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });
  const orb1Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.25 }] }));
  const orb2Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.2 }] }));

  const [mode, setMode] = useState<PlanningMode>('goal');

  // Mode 1: Goal based (calculate required monthly contribution)
  const [goalStr, setGoalStr] = useState('');
  const [currentStr, setCurrentStr] = useState('');
  const [monthsStr, setMonthsStr] = useState('');
  const [annualRateStr, setAnnualRateStr] = useState('');

  // Mode 2: Projection based (calculate final wealth)
  const [monthlyStr, setMonthlyStr] = useState('');
  const [projectionCurrentStr, setProjectionCurrentStr] = useState('');
  const [projectionMonthsStr, setProjectionMonthsStr] = useState('');
  const [projectionRateStr, setProjectionRateStr] = useState('');

  const goalResult = useMemo(() => {
    const FV = parseFloat(String(goalStr).replace(/,/g, '.') || '0');
    const PVRaw = parseFloat(String(currentStr).replace(/,/g, '.') || '0');
    const PV = Number.isFinite(PVRaw) && PVRaw > 0 ? PVRaw : currentNetWorth;
    const nRaw = parseFloat(String(monthsStr).replace(/,/g, '.') || '0');
    const n = Math.min(600, Math.max(0, Math.floor(Number.isFinite(nRaw) ? nRaw : 0)));
    const annualPct = parseFloat(String(annualRateStr).replace(/,/g, '.') || '0');
    if (!Number.isFinite(FV) || FV <= 0 || n <= 0) return null;
    const i = Number.isFinite(annualPct) ? annualToMonthly(annualPct) : 0;
    const PMT = calculatePMT(FV, PV, i, n);
    if (PMT === null || !Number.isFinite(PMT) || PMT < 0) return null;
    const totalInvested = PMT * n;
    const totalInterest = FV - PV - totalInvested;
    const evolution: number[] = [];
    const semJuros: number[] = [];
    for (let k = 0; k <= n; k++) {
      const b = balanceAtMonth(PV, PMT, i, k);
      evolution.push(Number.isFinite(b) ? b : PV + PMT * k);
      semJuros.push(PV + PMT * k);
    }
    if (evolution.length < 2) return null;
    return { PMT, totalInvested, totalInterest, evolution, semJuros, n, finalWealth: FV };
  }, [goalStr, currentStr, monthsStr, annualRateStr, currentNetWorth]);

  const projectionResult = useMemo(() => {
    const PMTRaw = parseFloat(String(monthlyStr).replace(/,/g, '.') || '0');
    const PMT = Number.isFinite(PMTRaw) ? PMTRaw : 0;
    const PVRaw = parseFloat(String(projectionCurrentStr).replace(/,/g, '.') || '0');
    const PV = Number.isFinite(PVRaw) && PVRaw >= 0 ? PVRaw : currentNetWorth;
    const nRaw = parseFloat(String(projectionMonthsStr).replace(/,/g, '.') || '0');
    const n = Math.min(600, Math.max(0, Math.floor(Number.isFinite(nRaw) ? nRaw : 0)));
    const annualPct = parseFloat(String(projectionRateStr).replace(/,/g, '.') || '0');
    if (!Number.isFinite(PMT) || PMT <= 0 || n <= 0) return null;
    const i = Number.isFinite(annualPct) ? annualToMonthly(annualPct) : 0;
    const FV = calculateFV(PV, PMT, i, n);
    if (!Number.isFinite(FV) || FV < 0) return null;
    const totalInvested = PMT * n;
    const totalInterest = FV - PV - totalInvested;
    const evolution: number[] = [];
    const semJuros: number[] = [];
    for (let k = 0; k <= n; k++) {
      const b = balanceAtMonth(PV, PMT, i, k);
      evolution.push(Number.isFinite(b) ? b : PV + PMT * k);
      semJuros.push(PV + PMT * k);
    }
    if (evolution.length < 2) return null;
    return { PMT, totalInvested, totalInterest, evolution, semJuros, n, finalWealth: FV };
  }, [monthlyStr, projectionCurrentStr, projectionMonthsStr, projectionRateStr, currentNetWorth]);

  const activeResult = mode === 'goal' ? goalResult : projectionResult;

  return (
    <KeyboardAvoidingView
      style={[styles.kav, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.orb1, orb1Style, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)' }]} pointerEvents="none" />
        <Animated.View style={[styles.orb2, orb2Style, { backgroundColor: isDark ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.05)' }]} pointerEvents="none" />

        {/* Back button */}
        <Animated.View entering={FadeInLeft.duration(400).springify()}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.s700} />
            <Text style={[styles.backBtnText, { color: colors.s700 }]}>{t('investmentsTab')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(500).springify()} style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.e500}15` }]}>
            <Ionicons name="calculator" size={24} color={colors.e500} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.s900 }]}>{t('planningTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('planningSubtitle')}</Text>
          </View>
        </Animated.View>

        {/* Mode Toggle */}
        <Animated.View entering={FadeInDown.delay(30).duration(350)} style={[styles.modeWrap, { backgroundColor: colors.s100 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.modeBtn,
              mode === 'goal' && { backgroundColor: colors.e500 },
            ]}
            onPress={() => setMode('goal')}
          >
            <Ionicons name="flag-outline" size={15} color={mode === 'goal' ? '#fff' : colors.s500} />
            <Text style={[styles.modeBtnText, { color: mode === 'goal' ? '#fff' : colors.s500 }]}>{t('planningGoalMode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.modeBtn,
              mode === 'projection' && { backgroundColor: colors.e500 },
            ]}
            onPress={() => setMode('projection')}
          >
            <Ionicons name="analytics-outline" size={15} color={mode === 'projection' ? '#fff' : colors.s500} />
            <Text style={[styles.modeBtnText, { color: mode === 'projection' ? '#fff' : colors.s500 }]}>{t('planningProjectionMode')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Form Card */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          {mode === 'goal' ? (
            <>
              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('goalTarget')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="flag" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder="0"
                  placeholderTextColor={colors.s400}
                  value={goalStr}
                  onChangeText={setGoalStr}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('currentWealth')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="wallet" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder={String(currentNetWorth)}
                  placeholderTextColor={colors.s400}
                  value={currentStr}
                  onChangeText={setCurrentStr}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('monthsCount')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="calendar" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder="ex: 60"
                  placeholderTextColor={colors.s400}
                  value={monthsStr}
                  onChangeText={setMonthsStr}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.fieldSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('annualRate')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="trending-up" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder={t('rateHint')}
                  placeholderTextColor={colors.s400}
                  value={annualRateStr}
                  onChangeText={setAnnualRateStr}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('monthlyInvestment')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="cash-outline" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder="0"
                  placeholderTextColor={colors.s400}
                  value={monthlyStr}
                  onChangeText={setMonthlyStr}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('currentWealth')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="wallet" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder={String(currentNetWorth)}
                  placeholderTextColor={colors.s400}
                  value={projectionCurrentStr}
                  onChangeText={setProjectionCurrentStr}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('monthsCount')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="calendar" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder="ex: 120"
                  placeholderTextColor={colors.s400}
                  value={projectionMonthsStr}
                  onChangeText={setProjectionMonthsStr}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.fieldSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

              <Text style={[styles.fieldLabel, { color: colors.s500 }]}>{t('annualRate')}</Text>
              <View style={[styles.fieldInputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.s50, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.s200 }]}>
                <View style={[styles.fieldIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="trending-up" size={16} color={colors.e500} />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: colors.s900 }]}
                  placeholder={t('rateHint')}
                  placeholderTextColor={colors.s400}
                  value={projectionRateStr}
                  onChangeText={setProjectionRateStr}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          )}
        </Animated.View>

        {/* Results */}
        {activeResult && (
          <>
            {/* Monthly Investment — gradient card */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultCard}
              >
                <View style={styles.resultTop}>
                  <View style={styles.resultIconWrap}>
                    <Ionicons name="rocket" size={18} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={styles.resultLabel}>
                    {mode === 'goal' ? t('monthlyInvestment') : t('planningFinalWealth')}
                  </Text>
                </View>
                <Text style={styles.resultValue}>
                  {formatCurrency(mode === 'goal' ? activeResult.PMT : activeResult.finalWealth)}
                </Text>
                <Text style={styles.resultSub}>
                  {activeResult.n} {t('monthsCount').toLowerCase()}
                </Text>
              </LinearGradient>
            </Animated.View>

            {/* Summary — two side-by-side cards */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.summaryIconCircle, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                  <Ionicons name="wallet" size={18} color="#3B82F6" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.s500 }]}>{t('totalInvested')}</Text>
                <Text style={[styles.summaryValue, { color: colors.s900 }]}>{formatCurrency(activeResult.totalInvested)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.summaryIconCircle, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <Ionicons name="sparkles" size={18} color="#10B981" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.s500 }]}>{t('totalInterest')}</Text>
                <Text style={[styles.summaryValue, { color: colors.e600 }]}>{formatCurrency(activeResult.totalInterest)}</Text>
              </View>
            </Animated.View>

            {/* Chart */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.chartHeader}>
                <View style={[styles.chartIconWrap, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="analytics" size={16} color={colors.e500} />
                </View>
                <Text style={[styles.chartTitle, { color: colors.s500 }]}>{t('wealthEvolution')}</Text>
              </View>
              <PlanningWealthChart
                seriesComJuros={activeResult.evolution}
                seriesSemJuros={activeResult.semJuros}
                totalMonths={activeResult.n}
                formatCurrency={formatCurrency}
                currencySymbol={CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol ?? 'R$'}
              />
            </Animated.View>
          </>
        )}
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 120 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999 },
  orb2: { position: 'absolute', bottom: 100, left: -60, width: 200, height: 200, borderRadius: 999 },

  /* Back button */
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 16,
  },
  backBtnText: { fontSize: 14, fontWeight: '600' },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  modeWrap: {
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  modeBtnText: { fontSize: 12, fontWeight: '700' },

  /* Form Card */
  formCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldIconWrap: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingRight: 14,
  },
  fieldSeparator: { height: 1, marginVertical: 14, borderRadius: 1 },

  /* Result Card (Gradient) */
  resultCard: {
    borderRadius: 22,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  resultIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
  },
  resultValue: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  resultSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  /* Summary Cards — side by side */
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },

  /* Chart Card */
  chartCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  chartIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
});
