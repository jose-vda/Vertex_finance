import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedScrollHandler,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { MILESTONES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth, goalPct } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWallet } from '../context/WalletContext';

const springConfig = { damping: 18, stiffness: 120 };
const staggerDelay = 70;

/* ── Animated Ring Progress ── */
const RING_SIZE = 120;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ pct, colors }: { pct: number; colors: any }) {
  const progress = useSharedValue(0);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    progress.value = withDelay(300, withSpring(Math.min(100, pct) / 100, { damping: 20, stiffness: 60 }));
    glow.value = withRepeat(withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pct]);

  const ringProps = useAnimatedProps(() => {
    const dash = interpolate(progress.value, [0, 1], [RING_CIRCUMFERENCE, 0]);
    return { strokeDashoffset: dash };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.05 }],
  }));

  const counterStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1.05, 1]);
    return { transform: [{ scale }], opacity: interpolate(progress.value, [0, 0.15], [0, 1]) };
  });

  return (
    <View style={ringStyles.wrap}>
      {/* Glow behind ring */}
      <Animated.View style={[ringStyles.glowCircle, glowStyle, { backgroundColor: `${colors.e500}20` }]} />

      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {/* Fill */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="#10B981"
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={ringProps}
        />
      </Svg>

      {/* Center content */}
      <Animated.View style={[ringStyles.center, counterStyle]}>
        <Text style={[ringStyles.pctValue, { color: colors.s900 }]}>{pct}</Text>
        <Text style={[ringStyles.pctSymbol, { color: colors.e500 }]}>%</Text>
      </Animated.View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ringStyles = StyleSheet.create({
  wrap: { width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center' },
  glowCircle: {
    position: 'absolute',
    width: RING_SIZE + 20,
    height: RING_SIZE + 20,
    borderRadius: (RING_SIZE + 20) / 2,
  },
  center: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pctValue: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
  pctSymbol: { fontSize: 16, fontWeight: '800', marginLeft: 1 },
});

function CurrentCardPulse({ children, style }: { children: React.ReactNode; style: any }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.02, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

const iconMap: Record<string, string> = {
  leaf: 'leaf',
  'trending-up': 'trending-up',
  briefcase: 'briefcase',
  shield: 'shield',
  star: 'star',
};

const REASON_KEYS = ['retirement', 'house', 'trip', 'emergency', 'business', 'other'] as const;
const REASON_I18N: Record<string, string> = {
  retirement: 'goalReasonRetirement',
  house: 'goalReasonHouse',
  trip: 'goalReasonTrip',
  emergency: 'goalReasonEmergency',
  business: 'goalReasonBusiness',
  other: 'goalReasonOther',
};

function getGoalReasonLabel(goalReason: string | null, t: (k: string) => string): string {
  if (!goalReason) return '';
  const key = REASON_KEYS.find((k) => k === goalReason);
  return key ? t(REASON_I18N[key]) : goalReason;
}

function getTimeElapsedYears(goalSetAt: string | null): number {
  if (!goalSetAt) return 0;
  const start = new Date(goalSetAt);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  const ms = now.getTime() - start.getTime();
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

const milestoneKey = (pct: number) => `m${pct}` as const;

function AnimatedProgressFill({
  progressPct,
  trackWidth,
}: {
  progressPct: number;
  color: string;
  trackWidth: number;
}) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withSpring((progressPct / 100) * trackWidth, springConfig);
  }, [progressPct, trackWidth]);
  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));
  return (
    <Animated.View
      style={[
        styles.msProgressFill,
        trackWidth <= 0 && { width: 0 },
        trackWidth > 0 && animatedStyle,
      ]}
    >
      <LinearGradient colors={['#10B981', '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export default function MilestonesScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { appState } = useAuth();
  const { t, formatCurrency } = useSettings();
  const { portfolio } = useWallet();
  const { netWorth: bankNetWorth, goal, goal_reason, goal_years, goal_set_at } = appState;
  const netWorth = bankNetWorth + (portfolio?.totalValue ?? 0);
  const pct = goalPct(netWorth, goal);
  const toGo = Math.max(0, (goal || 0) - netWorth);
  const goalName = getGoalReasonLabel(goal_reason, t) || t('financialGoal');

  const elapsedYears = goal_set_at && goal_years ? getTimeElapsedYears(goal_set_at) : 0;
  const timePct = goal_years && goal_years > 0 ? Math.min(100, (elapsedYears / goal_years) * 100) : 0;

  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const glassCardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16,185,129,0.15)';
  const brandGreen = '#10B981';
  const brandGreenBright = '#34D399';

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });
  const orb1Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.25 }] }));
  const orb2Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.2 }] }));

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.orb1, orb1Style, { backgroundColor: 'rgba(16,185,129,0.08)' }]} pointerEvents="none" />
      <Animated.View style={[styles.orb2, orb2Style, { backgroundColor: 'rgba(52,211,153,0.06)' }]} pointerEvents="none" />

      {/* ── Premium Goal Card ── */}
      <Animated.View entering={FadeInDown.delay(50).duration(500)} style={[styles.glassCard, { backgroundColor: glassCardBg, borderColor: glassBorder }]}>
        {/* Decorative gradient accent at top */}
        <LinearGradient
          colors={[`${brandGreen}18`, `${brandGreenBright}08`, 'transparent']}
          style={styles.cardGradientAccent}
        />

        {/* Header row: reason chip + goal label */}
        <View style={styles.cardHeader}>
          <View style={[styles.goalReasonChip, { backgroundColor: `${colors.e500}12` }]}>
            <Ionicons name="flag" size={12} color={colors.e500} />
            <Text style={[styles.goalReasonChipText, { color: colors.e500 }]}>{goalName}</Text>
          </View>
          {goal_years != null && (
            <View style={[styles.goalDeadlineChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Ionicons name="time-outline" size={11} color={colors.s400} />
              <Text style={[styles.goalDeadlineChipText, { color: colors.s400 }]}>{goal_years} {t('goalYears')}</Text>
            </View>
          )}
        </View>

        {/* Hero section: Ring + value column */}
        <View style={styles.heroSection}>
          <ProgressRing pct={pct} colors={{ ...colors, isDark }} />
          <View style={styles.heroInfo}>
            <Text style={[styles.heroLabel, { color: colors.s400 }]}>{t('finalGoal').toUpperCase()}</Text>
            <Text style={[styles.heroValue, { color: colors.s900 }]}>{formatCurrency(goal || 0)}</Text>
            <View style={styles.heroMetaRow}>
              <View style={[styles.heroMetaDot, { backgroundColor: brandGreen }]} />
              <Text style={[styles.heroMetaText, { color: colors.s500 }]}>{formatCurrency(netWorth)}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <View style={[styles.heroMetaDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />
              <Text style={[styles.heroMetaText, { color: colors.s400 }]}>{formatCurrency(toGo)} {t('toGo')}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

        {/* Time progress */}
        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <View style={styles.progressLabelRow}>
              <Ionicons name="hourglass-outline" size={12} color={colors.s400} />
              <Text style={[styles.progressLabelLeft, { color: colors.s500 }]}>{t('timeProgress')}</Text>
            </View>
            {goal_years != null && goal_set_at ? (
              <Text style={[styles.progressLabelRight, { color: colors.e500 }]}>{Math.floor(elapsedYears)}/{goal_years} {t('goalYears')}</Text>
            ) : null}
          </View>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.progressFillWrap}>
              <LinearGradient
                colors={['#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressGradient, { width: `${Math.min(100, timePct)}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Wealth progress */}
        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <View style={styles.progressLabelRow}>
              <Ionicons name="trending-up-outline" size={12} color={colors.s400} />
              <Text style={[styles.progressLabelLeft, { color: colors.s500 }]}>{t('currentProgress')}</Text>
            </View>
            <Text style={[styles.progressLabelRight, { color: colors.e500 }]}>{pct}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.progressFillWrap}>
              <LinearGradient
                colors={[brandGreen, brandGreenBright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressGradient, { width: `${Math.min(100, pct)}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Footer insight */}
        <View style={[styles.cardFooter, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(16,185,129,0.04)' }]}>
          <View style={[styles.footerIconWrap, { backgroundColor: `${colors.e500}15` }]}>
            <Ionicons name="sparkles" size={14} color={colors.e500} />
          </View>
          <Text style={[styles.footerText, { color: colors.s500 }]}>
            <Text style={[styles.footerBold, { color: colors.s800 }]}>{t('dailyInsight')}: </Text>
            {t('dailyInsightDefault')}
          </Text>
        </View>
      </Animated.View>

      {/* ── Wealth Ladder — Timeline ── */}
      <Animated.View entering={FadeIn.duration(400)}>
        <Text style={[styles.secLabel, { color: colors.s400 }]}>{t('wealthLadder')}</Text>
      </Animated.View>

      <View style={styles.tlContainer}>
        {(() => {
          const reversed = [...MILESTONES].reverse();
          return reversed.map((m, index) => {
            const reached = pct >= m.pct;
            const isCurrent = m.pct > pct && (index === reversed.length - 1 || pct >= reversed[index + 1].pct);
            const locked = !reached && !isCurrent;
            const iconName = iconMap[m.icon] || 'star';
            const labelKey = milestoneKey(m.pct) + 'label';
            const targetAmount = (goal || 0) * (m.pct / 100);
            const progressToTarget = targetAmount > 0 ? Math.min(100, (netWorth / targetAmount) * 100) : 0;
            const isFirst = index === 0;
            const isLast = index === reversed.length - 1;
            const delay = staggerDelay * (index + 2);
            const aboveReached = index > 0 && pct >= reversed[index - 1].pct;

            const card = (
              <View style={[
                styles.msCard,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff' },
                { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                reached && {
                  borderColor: `${colors.e500}30`,
                  backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.03)',
                },
                isCurrent && {
                  borderColor: colors.e500,
                  backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)',
                  shadowColor: colors.e500,
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                },
              ]}>
                {/* Left accent bar */}
                {(reached || isCurrent) ? (
                  <LinearGradient colors={[brandGreen, brandGreenBright]} style={styles.msAccent} />
                ) : (
                  <View style={[styles.msAccent, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                )}

                <View style={styles.msBody}>
                  {/* Current level badge */}
                  {isCurrent && (
                    <View style={[styles.msCurrentBadge, { backgroundColor: `${colors.e500}15` }]}>
                      <Ionicons name="flash" size={10} color={colors.e500} />
                      <Text style={[styles.msCurrentBadgeText, { color: colors.e500 }]}>{t('currentLevel')}</Text>
                    </View>
                  )}

                  <View style={styles.msRow}>
                    {/* Icon circle */}
                    <View style={[
                      styles.msIconWrap,
                      reached && { backgroundColor: `${colors.e500}15` },
                      isCurrent && { backgroundColor: `${colors.e500}18` },
                      locked && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                    ]}>
                      <Ionicons
                        name={iconName as any}
                        size={22}
                        color={reached || isCurrent ? colors.e500 : colors.s400}
                      />
                      {locked && (
                        <View style={[styles.msLockOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }]}>
                          <Ionicons name="lock-closed" size={10} color={colors.s400} />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.msInfo}>
                      <View style={styles.msTitleRow}>
                        <Text style={[styles.msPct, { color: reached || isCurrent ? colors.e500 : colors.s400 }]}>
                          {m.pct}%
                        </Text>
                        <View style={[styles.msDivider, { backgroundColor: reached || isCurrent ? `${colors.e500}30` : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} />
                        <Text
                          style={[styles.msLabel, { color: reached || isCurrent ? colors.s900 : colors.s400 }]}
                          numberOfLines={1}
                        >
                          {t(labelKey)}
                        </Text>
                      </View>
                      <Text style={[styles.msAmount, { color: reached || isCurrent ? colors.s700 : colors.s400 }]}>
                        {formatCurrency(targetAmount)}
                      </Text>
                    </View>

                    {/* Status */}
                    {reached && (
                      <View style={[styles.msCheckBadge, { backgroundColor: `${colors.e500}15` }]}>
                        <Ionicons name="checkmark" size={16} color={colors.e500} />
                      </View>
                    )}
                  </View>

                  {/* Progress section for current milestone */}
                  {isCurrent && (
                    <View style={styles.msProgressSection}>
                      <View
                        style={[styles.msProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                        onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}
                      >
                        <AnimatedProgressFill
                          progressPct={progressToTarget}
                          color={colors.e500}
                          trackWidth={progressTrackWidth}
                        />
                      </View>
                      <View style={styles.msProgressRow}>
                        <Text style={[styles.msProgressLeft, { color: colors.s500 }]}>
                          {formatCurrency(netWorth)}
                        </Text>
                        <Text style={[styles.msProgressRight, { color: colors.e500 }]}>
                          {Math.round(progressToTarget)}%
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );

            return (
              <Animated.View key={m.pct} entering={FadeInDown.delay(delay).springify()}>
                <View style={styles.tlItem}>
                  {/* Timeline column */}
                  <View style={styles.tlCol}>
                    {/* Line segment above node */}
                    {!isFirst ? (
                      <View style={[
                        styles.tlLine,
                        { backgroundColor: aboveReached || reached || isCurrent ? colors.e500 : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                      ]} />
                    ) : (
                      <View style={styles.tlLineSpacer} />
                    )}

                    {/* Node */}
                    {reached ? (
                      <View style={[styles.tlNode, { backgroundColor: colors.e500, borderColor: colors.e500 }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    ) : isCurrent ? (
                      <View style={[styles.tlNode, styles.tlNodeCurrent, { borderColor: colors.e500 }]}>
                        <View style={[styles.tlNodeDot, { backgroundColor: colors.e500 }]} />
                      </View>
                    ) : (
                      <View style={[styles.tlNode, styles.tlNodeLocked, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' }]} />
                    )}

                    {/* Line segment below node */}
                    {!isLast ? (
                      <View style={[
                        styles.tlLine,
                        { flex: 1, backgroundColor: reached ? colors.e500 : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                      ]} />
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                  </View>

                  {/* Card */}
                  <View style={styles.tlCardWrap}>
                    {isCurrent ? (
                      <CurrentCardPulse style={{ flex: 1 }}>{card}</CurrentCardPulse>
                    ) : card}
                  </View>
                </View>
              </Animated.View>
            );
          });
        })()}
      </View>

      <Animated.View entering={FadeIn.delay(staggerDelay * 8).duration(300)} style={styles.updateCtaWrap}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => (navigation as any).navigate('EditGoal')}>
          <Text style={[styles.updateCta, { color: colors.e500 }]}>{t('updateContribution')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 120 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999 },
  orb2: { position: 'absolute', bottom: 100, left: -60, width: 200, height: 200, borderRadius: 999 },

  /* ── Premium Goal Card ── */
  glassCard: {
    borderRadius: 28,
    padding: 0,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
  cardGradientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 4,
  },
  goalReasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  goalReasonChipText: { fontSize: 12, fontWeight: '700' },
  goalDeadlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  goalDeadlineChipText: { fontSize: 11, fontWeight: '600' },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 24,
  },
  heroInfo: { flex: 1 },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroValue: { fontSize: 30, fontWeight: '900', letterSpacing: -1.2, marginBottom: 12 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  heroMetaDot: { width: 8, height: 8, borderRadius: 4 },
  heroMetaText: { fontSize: 13, fontWeight: '600' },
  cardDivider: { height: 1, marginHorizontal: 24 },
  progressBlock: { paddingHorizontal: 24, paddingTop: 18 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressLabelLeft: { fontSize: 11, fontWeight: '700' },
  progressLabelRight: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressFillWrap: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  progressGradient: { height: '100%', borderRadius: 999 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 24,
    marginTop: 22,
    marginBottom: 22,
    padding: 14,
    borderRadius: 16,
    gap: 10,
  },
  footerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  footerText: { fontSize: 12, lineHeight: 18, flex: 1 },
  footerBold: { fontWeight: '700' },

  /* ── Section Label ── */
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 },

  /* ── Timeline Layout ── */
  tlContainer: { marginBottom: 8 },
  tlItem: { flexDirection: 'row', minHeight: 90 },
  tlCol: { width: 32, alignItems: 'center' },
  tlLine: { width: 3, borderRadius: 2 },
  tlLineSpacer: { height: 4 },
  tlNode: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
    marginVertical: 2,
  },
  tlNodeCurrent: {
    borderWidth: 3,
    backgroundColor: 'transparent',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  tlNodeDot: { width: 8, height: 8, borderRadius: 4 },
  tlNodeLocked: { backgroundColor: 'transparent', borderStyle: 'dashed' as any },
  tlCardWrap: { flex: 1, marginLeft: 12, marginBottom: 12 },

  /* ── Milestone Card ── */
  msCard: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  msAccent: { width: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  msBody: { flex: 1, padding: 16 },
  msCurrentBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  msCurrentBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  msRow: { flexDirection: 'row', alignItems: 'center' },
  msIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  msLockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msInfo: { flex: 1, marginLeft: 12 },
  msTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  msPct: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  msDivider: { width: 1, height: 14, borderRadius: 1 },
  msLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
  msAmount: { fontSize: 14, fontWeight: '600' },
  msCheckBadge: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  msProgressSection: { marginTop: 14 },
  msProgressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  msProgressFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  msProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  msProgressLeft: { fontSize: 11, fontWeight: '600' },
  msProgressRight: { fontSize: 11, fontWeight: '800' },

  /* ── CTA ── */
  updateCtaWrap: { marginTop: 12, marginBottom: 8, alignItems: 'center' },
  updateCta: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
});
