import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import type { AcademyProgressData } from '../../types/academy';

/** Variações só em tons de verde (contraste entre cartões na Academia). */
export type AcademyProgressAccent = 'emerald' | 'forest' | 'mint';

type Props = {
  data: AcademyProgressData;
  onPressSetGoal?: () => void;
  ctaLabelKey?: string;
  /** Destaque visual do cartão (diferencia na lista da Academia). */
  accent?: AcademyProgressAccent;
};

const ACCENT = {
  emerald: { main: '#10B981', mainDark: '#059669', soft: 'rgba(16,185,129,0.14)', soft2: 'rgba(16,185,129,0.08)' },
  forest: { main: '#059669', mainDark: '#047857', soft: 'rgba(5,150,105,0.15)', soft2: 'rgba(5,150,105,0.09)' },
  mint: { main: '#34D399', mainDark: '#10B981', soft: 'rgba(52,211,153,0.18)', soft2: 'rgba(52,211,153,0.1)' },
} as const;

export default function AcademyProgressCard({
  data,
  onPressSetGoal,
  ctaLabelKey = 'academySetStudyGoal',
  accent = 'emerald',
}: Props) {
  const { colors } = useTheme();
  const { t } = useSettings();
  const A = ACCENT[accent];
  const progress = Math.max(0, Math.min(1, data.booksGoal > 0 ? data.booksCompleted / data.booksGoal : 0));
  const progressWidth = useSharedValue(0);
  progressWidth.value = withTiming(progress, { duration: 700 });
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(380)}
      style={[
        styles.wrap,
        {
          backgroundColor: colors.cardBg,
          borderColor: A.main,
          borderWidth: 1.5,
          shadowColor: A.main,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: A.main }]} />
      <View style={styles.headRow}>
        <Text style={[styles.title, { color: colors.s900 }]}>{t('academyProgressTitle')}</Text>
        <Ionicons name="stats-chart-outline" size={18} color={A.main} />
      </View>

      <View style={[styles.goalHighlight, { borderColor: `${A.main}55`, backgroundColor: A.soft }]}>
        <View style={styles.goalHighlightItem}>
          <Text style={[styles.goalHighlightValue, { color: colors.s900 }]}>{data.booksGoal}</Text>
          <Text style={[styles.goalHighlightLabel, { color: colors.s700 }]}>{t('academyGoalBooksLabel')}</Text>
        </View>
        <View style={[styles.goalDivider, { backgroundColor: `${A.main}40` }]} />
        <View style={styles.goalHighlightItem}>
          <Text style={[styles.goalHighlightValue, { color: colors.s900 }]}>{data.daysRemaining}</Text>
          <Text style={[styles.goalHighlightLabel, { color: colors.s700 }]}>{t('academyDaysRemainingLabel')}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {data.metrics.map((metric) => (
          <View key={metric.id} style={[styles.metricCard, { borderColor: `${A.main}30`, backgroundColor: A.soft2 }]}>
            <Text style={[styles.metricValue, { color: A.mainDark }]}>{metric.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.s500 }]} numberOfLines={2}>
              {t(metric.labelKey)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.goalWrap}>
        <View style={styles.goalHead}>
          <Text style={[styles.goalTitle, { color: colors.s800 }]}>{t('academyGoalProgress')}</Text>
          <Text style={[styles.goalMeta, { color: colors.s500 }]}>
            {data.booksCompleted}/{data.booksGoal} {t('academyBooksGoalUnit')}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: `${A.main}22` }]}>
          <Animated.View style={[styles.fill, { backgroundColor: A.main }, progressStyle]} />
        </View>
      </View>

      <Pressable
        onPress={onPressSetGoal}
        style={({ pressed }) => [
          styles.cta,
          { borderColor: `${A.main}44`, backgroundColor: A.soft },
          pressed && { opacity: 0.75 },
        ]}
      >
        <Text style={[styles.ctaText, { color: A.mainDark }]}>{t(ctaLabelKey)}</Text>
        <Ionicons name="arrow-forward" size={14} color={A.main} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    padding: 14,
    paddingTop: 16,
    marginBottom: 10,
    gap: 12,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricLabel: { fontSize: 11, marginTop: 2 },
  goalHighlight: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalHighlightItem: { flex: 1, alignItems: 'center' },
  goalHighlightValue: { fontSize: 18, fontWeight: '800' },
  goalHighlightLabel: { fontSize: 11, marginTop: 1, fontWeight: '700' },
  goalDivider: { width: 1, height: 28, marginHorizontal: 8 },
  goalWrap: { gap: 7 },
  goalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalTitle: { fontSize: 12, fontWeight: '700' },
  goalMeta: { fontSize: 11, fontWeight: '700' },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, minWidth: 6 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    marginTop: 2,
  },
  ctaText: { fontSize: 12, fontWeight: '700' },
});
