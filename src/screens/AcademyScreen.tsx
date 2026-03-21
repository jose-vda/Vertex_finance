import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, PanResponder, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAcademy } from '../context/AcademyContext';
import AcademyProgressCard from '../components/academy/AcademyProgressCard';
import ReadingPlanModal from '../components/academy/ReadingPlanModal';
import AcademyPaywallScreen from './AcademyPaywallScreen';
import type { AcademyProgressData } from '../types/academy';
import type { MainStackParamList } from '../navigation/types';
import { getDefaultReadingPlanBooks } from '../data/readingPlanBooks';
import type { AcademyBookCategory } from '../data/academyBooks';

/** Ordem: Finanças → Empreendedorismo → Investimentos — só tons de verde, cada cartão com nuance diferente. */
const TOPIC_CARDS: readonly {
  key: AcademyBookCategory;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  titleKey: 'academyFinance' | 'academyEntrepreneurship' | 'academyInvestments';
  gradient: readonly [string, string];
  glow: string;
}[] = [
  { key: 'finance', icon: 'leaf-outline', titleKey: 'academyFinance', gradient: ['#022C22', '#059669'], glow: 'rgba(5,150,105,0.4)' },
  {
    key: 'entrepreneurship',
    icon: 'rocket-outline',
    titleKey: 'academyEntrepreneurship',
    gradient: ['#064E3B', '#10B981'],
    glow: 'rgba(16,185,129,0.38)',
  },
  {
    key: 'investments',
    icon: 'pulse-outline',
    titleKey: 'academyInvestments',
    gradient: ['#047857', '#6EE7B7'],
    glow: 'rgba(52,211,153,0.42)',
  },
] as const;

const MOCK_STREAK = '7d';

export default function AcademyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useSettings();
  const { readingStatusByBook } = useAcademy();
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [paywallPreviewVisible, setPaywallPreviewVisible] = useState(false);
  const [readingPlanModalVisible, setReadingPlanModalVisible] = useState(false);
  const [hasGoalDefined, setHasGoalDefined] = useState(false);
  const [financeGoal, setFinanceGoal] = useState(3);
  const [investmentsGoal, setInvestmentsGoal] = useState(1);
  const [entrepreneurshipGoal, setEntrepreneurshipGoal] = useState(1);
  const [goalMonths, setGoalMonths] = useState(6);
  const [monthsTrackWidth, setMonthsTrackWidth] = useState(1);
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const orb1Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.2 }] }));
  const orb2Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.15 }] }));
  const parsedTotalGoal = useMemo(() => {
    const f = Math.max(0, financeGoal || 0);
    const i = Math.max(0, investmentsGoal || 0);
    const e = Math.max(0, entrepreneurshipGoal || 0);
    return f + i + e;
  }, [financeGoal, investmentsGoal, entrepreneurshipGoal]);
  const MAX_BOOKS_PER_CATEGORY = 20;
  const MAX_MONTHS = 24;
  const MIN_MONTHS = 1;
  const updateMonthsByX = (x: number) => {
    const safeX = Math.max(0, Math.min(monthsTrackWidth, x));
    const ratio = safeX / monthsTrackWidth;
    const next = Math.round(MIN_MONTHS + ratio * (MAX_MONTHS - MIN_MONTHS));
    setGoalMonths(Math.max(MIN_MONTHS, Math.min(MAX_MONTHS, next)));
  };
  const monthsPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => updateMonthsByX(evt.nativeEvent.locationX),
    onPanResponderMove: (evt) => updateMonthsByX(evt.nativeEvent.locationX),
  });
  const monthsRatio = (goalMonths - MIN_MONTHS) / (MAX_MONTHS - MIN_MONTHS);

  const readingPlanBooks = useMemo(() => getDefaultReadingPlanBooks(), []);

  const planCompletedCount = useMemo(
    () => readingPlanBooks.filter((b) => readingStatusByBook[b.id] === 'done').length,
    [readingPlanBooks, readingStatusByBook]
  );

  const progressData: AcademyProgressData = {
    metrics: [
      { id: 'plan', labelKey: 'academyReadingPlanMetric', value: `${planCompletedCount}/10` },
      { id: 'streak', labelKey: 'academyReadingStreak', value: MOCK_STREAK },
    ],
    booksGoal: 10,
    booksCompleted: planCompletedCount,
    daysRemaining: Math.max(1, goalMonths * 30),
  };

  const openPlanBook = (bookId: string) => {
    setReadingPlanModalVisible(false);
    requestAnimationFrame(() => {
      navigation.navigate('BookDetail', { bookId });
    });
  };

  const renderGoalRow = (label: string, value: number, setValue: (n: number) => void) => {
    const ratio = Math.max(0, Math.min(1, value / MAX_BOOKS_PER_CATEGORY));
    return (
      <View style={styles.goalRow}>
        <View style={styles.goalRowTop}>
          <Text style={[styles.inputLabel, { color: colors.s700 }]}>{label}</Text>
          <Text style={[styles.goalValue, { color: colors.s900 }]}>{value}</Text>
        </View>
        <View style={[styles.compactTrack, { backgroundColor: `${colors.e500}1A` }]}>
          <View style={[styles.compactFill, { backgroundColor: colors.e500, width: `${ratio * 100}%` }]} />
        </View>
        <View style={styles.goalActions}>
          <Pressable onPress={() => setValue(Math.max(0, value - 1))} style={[styles.stepBtn, { borderColor: colors.s300 }]}>
            <Text style={[styles.stepBtnText, { color: colors.s700 }]}>-</Text>
          </Pressable>
          <Pressable onPress={() => setValue(Math.min(MAX_BOOKS_PER_CATEGORY, value + 1))} style={[styles.stepBtn, { borderColor: colors.s300 }]}>
            <Text style={[styles.stepBtnText, { color: colors.s700 }]}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.orb1, orb1Style]} pointerEvents="none" />
      <Animated.View style={[styles.orb2, orb2Style]} pointerEvents="none" />

      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.e50 }]}>
          <Ionicons name="school-outline" size={24} color={colors.e500} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.s900 }]}>{t('academyTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('academySubtitle')}</Text>
        </View>
        <Pressable
          onPress={() => setPaywallPreviewVisible(true)}
          hitSlop={10}
          style={({ pressed }) => [
            styles.paywallPreviewBtn,
            { borderColor: `${colors.e500}40`, backgroundColor: `${colors.e500}0C` },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('academyPaywallPreviewHint')}
        >
          <Ionicons name="diamond-outline" size={17} color={colors.e600} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.delay(70).duration(360)} style={[styles.banner, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]}>
        <Ionicons name="sparkles-outline" size={18} color={colors.e500} />
        <Text style={[styles.bannerText, { color: colors.s700 }]}>{t('academyComingSoon')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(90).duration(380)}>
        <Pressable
          onPress={() => setReadingPlanModalVisible(true)}
          style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.readingPlanGradient}
          >
            <View style={styles.readingPlanGlow} />
            <View style={styles.readingPlanInner}>
              <View style={styles.readingPlanIconCircle}>
                <Ionicons name="library" size={22} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.readingPlanLabel}>{t('academyReadingPlanModalKicker')}</Text>
                <Text style={styles.readingPlanTitle}>{t('academyReadingPlanButton')}</Text>
                <Text style={styles.readingPlanHint}>{t('academyReadingPlanEntrySub')}</Text>
              </View>
              <View style={styles.readingPlanChevron}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <AcademyProgressCard
        data={progressData}
        onPressSetGoal={() => setGoalModalVisible(true)}
        ctaLabelKey={hasGoalDefined ? 'academyEditStudyGoal' : 'academySetStudyGoal'}
        accent="mint"
      />

      {TOPIC_CARDS.map((item, idx) => (
        <Animated.View key={item.key} entering={FadeInDown.delay(150 + idx * 75).duration(380)}>
          <Pressable
            onPress={() => navigation.navigate('BookList', { category: item.key })}
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.992 }] }]}
          >
            <View style={[styles.topicCardShell, { borderColor: item.gradient[0], shadowColor: item.glow }]}>
              <LinearGradient colors={item.gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.topicCardStripe} />
              <View style={[styles.topicCardBody, { backgroundColor: colors.cardBg }]}>
                <LinearGradient colors={item.gradient} style={styles.topicIconBlob}>
                  <Ionicons name={item.icon} size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topicCardTitle, { color: colors.s900 }]}>{t(item.titleKey)}</Text>
                  <Text style={[styles.topicCardSub, { color: item.gradient[0] }]}>{t('academyModulePlaceholder')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={item.gradient[0]} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      ))}

      <Modal visible={goalModalVisible} transparent animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setGoalModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: colors.s900 }]}>{t('academyGoalModalTitle')}</Text>
              <Pressable onPress={() => setGoalModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.s500} />
              </Pressable>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.s500 }]}>{t('academyGoalModalSubtitle')}</Text>
            {renderGoalRow(t('academyGoalFinanceBooks'), financeGoal, setFinanceGoal)}
            {renderGoalRow(t('academyGoalInvestmentBooks'), investmentsGoal, setInvestmentsGoal)}
            {renderGoalRow(t('academyGoalEntrepreneurBooks'), entrepreneurshipGoal, setEntrepreneurshipGoal)}

            <View style={styles.sliderBlock}>
              <View style={styles.goalRowTop}>
                <Text style={[styles.inputLabel, { color: colors.s700 }]}>{t('academyGoalTime')}</Text>
                <Text style={[styles.goalValue, { color: colors.s900 }]}>{goalMonths} {t('academyMonthsUnit')}</Text>
              </View>
              <View
                style={[styles.monthTrack, { backgroundColor: `${colors.e500}1A` }]}
                onLayout={(evt) => setMonthsTrackWidth(Math.max(1, evt.nativeEvent.layout.width))}
                {...monthsPanResponder.panHandlers}
              >
                <View style={[styles.monthFill, { backgroundColor: colors.e500, width: `${monthsRatio * 100}%` }]} />
                <View style={[styles.monthThumb, { left: `${monthsRatio * 100}%`, borderColor: colors.cardBg, backgroundColor: colors.e500 }]} />
              </View>
            </View>

            <View style={[styles.summaryRow, { borderColor: colors.s200 }]}>
              <Text style={[styles.summaryText, { color: colors.s700 }]}>
                {`${t('academyGoalSummaryPrefix')}: ${parsedTotalGoal} ${t('academyBooksGoalUnit')} · ${goalMonths || '0'} ${t('academyMonthsUnit')}`}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setHasGoalDefined(true);
                setGoalModalVisible(false);
              }}
              style={[styles.saveBtn, { backgroundColor: colors.e500 }]}
            >
              <Text style={styles.saveBtnText}>{t('save')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ReadingPlanModal
        visible={readingPlanModalVisible}
        onClose={() => setReadingPlanModalVisible(false)}
        books={readingPlanBooks}
        onOpenBook={openPlanBook}
      />

      <Modal
        visible={paywallPreviewVisible}
        animationType="slide"
        {...(Platform.OS === 'ios' ? { presentationStyle: 'fullScreen' as const } : {})}
        onRequestClose={() => setPaywallPreviewVisible(false)}
      >
        <View style={[styles.paywallPreviewWrap, { backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => setPaywallPreviewVisible(false)}
            style={[styles.paywallPreviewClose, { top: Math.max(insets.top, 12) + 4 }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('academyPaywallPreviewClose')}
          >
            <Ionicons name="close-circle" size={32} color={colors.s400} />
          </Pressable>
          <AcademyPaywallScreen />
        </View>
      </Modal>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 120 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.08)' },
  orb2: { position: 'absolute', bottom: 100, left: -60, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.06)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  paywallPreviewBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallPreviewWrap: { flex: 1 },
  paywallPreviewClose: { position: 'absolute', right: 14, zIndex: 20 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bannerText: { fontSize: 12, fontWeight: '600' },
  readingPlanGradient: {
    borderRadius: 22,
    marginBottom: 12,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  readingPlanGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  readingPlanInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  readingPlanIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingPlanLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' },
  readingPlanTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginTop: 2, letterSpacing: -0.3 },
  readingPlanHint: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  readingPlanChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCardShell: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  topicCardStripe: { width: 5 },
  topicCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  topicIconBlob: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCardTitle: { fontSize: 15, fontWeight: '800' },
  topicCardSub: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 4, marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700' },
  goalRow: { marginTop: 8, gap: 6 },
  goalRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalValue: { fontSize: 12, fontWeight: '800' },
  compactTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  compactFill: { height: '100%', borderRadius: 999 },
  goalActions: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end' },
  stepBtn: {
    width: 30,
    height: 26,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 16, fontWeight: '700', lineHeight: 18 },
  sliderBlock: { marginTop: 10, gap: 6 },
  monthTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'visible',
    justifyContent: 'center',
  },
  monthFill: { height: '100%', borderRadius: 999 },
  monthThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 999,
    borderWidth: 2,
    top: -4,
  },
  summaryRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryText: { fontSize: 12, fontWeight: '600' },
  saveBtn: {
    marginTop: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
