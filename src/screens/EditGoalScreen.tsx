import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const REASON_KEYS = ['retirement', 'house', 'trip', 'emergency', 'business', 'other'] as const;
const REASON_I18N: Record<(typeof REASON_KEYS)[number], string> = {
  retirement: 'goalReasonRetirement',
  house: 'goalReasonHouse',
  trip: 'goalReasonTrip',
  emergency: 'goalReasonEmergency',
  business: 'goalReasonBusiness',
  other: 'goalReasonOther',
};

type DeadlineCategory = 'short' | 'medium' | 'long';
const DEADLINE_OPTIONS: { key: DeadlineCategory; i18nKey: string; min: number; max: number }[] = [
  { key: 'short', i18nKey: 'goalDeadlineShort', min: 1, max: 2 },
  { key: 'medium', i18nKey: 'goalDeadlineMedium', min: 2, max: 8 },
  { key: 'long', i18nKey: 'goalDeadlineLong', min: 8, max: 15 },
];
function getDeadlineRange(cat: DeadlineCategory): { min: number; max: number } {
  const opt = DEADLINE_OPTIONS.find((o) => o.key === cat);
  return opt ? { min: opt.min, max: opt.max } : { min: 0, max: 0 };
}
function getDeadlineCategoryFromYears(years: number): DeadlineCategory | null {
  if (years >= 1 && years <= 2) return 'short';
  if (years >= 2 && years <= 8) return 'medium';
  if (years >= 8 && years <= 15) return 'long';
  return null;
}

export default function EditGoalScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useSettings();
  const { appState, saveGoal } = useAuth();
  const [goalInput, setGoalInput] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineCategory | null>(null);
  const [deadlineYearsInput, setDeadlineYearsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const goal = appState.goal;
    const reason = appState.goal_reason;
    const years = appState.goal_years;
    setGoalInput(goal > 0 ? String(Math.round(goal)) : '');
    if (reason) {
      const key = REASON_KEYS.find((k) => k === reason);
      if (key) {
        setSelectedReason(key);
        setOtherReasonText('');
      } else {
        setSelectedReason('other');
        setOtherReasonText(reason);
      }
    } else {
      setSelectedReason(null);
      setOtherReasonText('');
    }
    if (years != null && years > 0) {
      const cat = getDeadlineCategoryFromYears(years);
      setSelectedDeadline(cat);
      setDeadlineYearsInput(String(years));
    } else {
      setSelectedDeadline(null);
      setDeadlineYearsInput('');
    }
    setInitialized(true);
  }, [appState.goal, appState.goal_reason, appState.goal_years]);

  function parseAmount(s: string): number {
    const normalized = s.trim().replace(',', '.');
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function parseDeadlineYears(): number | null {
    const n = parseInt(deadlineYearsInput.trim(), 10);
    if (!Number.isFinite(n) || n < 1) return null;
    if (!selectedDeadline) return null;
    const { min, max } = getDeadlineRange(selectedDeadline);
    return n >= min && n <= max ? n : null;
  }

  async function handleSave() {
    const amount = parseAmount(goalInput);
    const reason =
      selectedReason === 'other' ? otherReasonText.trim() : selectedReason;
    const years = parseDeadlineYears();
    if (amount <= 0 || !reason || years === null) return;
    if (appState.goal_edit_count >= 3) return;
    setSubmitting(true);
    try {
      await saveGoal(amount, reason, years, true);
      navigation.goBack();
    } catch {
      Alert.alert(t('error'), t('saveGoalFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const amount = parseAmount(goalInput);
  const reasonValid =
    selectedReason !== null &&
    (selectedReason !== 'other' || otherReasonText.trim().length > 0);
  const deadlineYearsValid = parseDeadlineYears() !== null;
  const editLimitReached = appState.goal_edit_count >= 3;
  const canSubmit =
    initialized &&
    amount > 0 &&
    reasonValid &&
    selectedDeadline !== null &&
    deadlineYearsValid &&
    !editLimitReached &&
    !submitting;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.s100 }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.s900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.s900 }]}>{t('editGoals')}</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={[styles.orb1, { backgroundColor: 'rgba(16,185,129,0.1)' }]} pointerEvents="none" />
      <View style={[styles.orb2, { backgroundColor: 'rgba(52,211,153,0.08)' }]} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={[styles.limitNote, { color: colors.s500 }]}>{t('goalEditLimitNote')}</Text>
            <Text style={[styles.changesRemaining, { color: colors.e600 }]}>
              {t('changesRemaining')}: {Math.max(0, 3 - appState.goal_edit_count)}
            </Text>
            <Text style={[styles.fieldLabel, { color: colors.s700 }]}>{t('amount')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.s50, color: colors.s900, borderColor: colors.s200 }]}
              placeholder={t('onboardingGoalPlaceholder')}
              placeholderTextColor={colors.s400}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.s700 }]}>{t('onboardingReasonQuestion')}</Text>
            <View style={styles.reasonGrid}>
              {REASON_KEYS.map((key) => {
                const isSelected = selectedReason === key;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.7}
                    style={[
                      styles.reasonChip,
                      { backgroundColor: isSelected ? colors.e500 : colors.cardBg, borderColor: isSelected ? colors.e500 : colors.s200 },
                    ]}
                    onPress={() => setSelectedReason(key)}
                  >
                    <Text style={[styles.reasonChipText, { color: isSelected ? '#fff' : colors.s800 }]}>{t(REASON_I18N[key])}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedReason === 'other' && (
              <TextInput
                style={[styles.input, styles.otherInput, { backgroundColor: colors.s50, color: colors.s900, borderColor: colors.s200 }]}
                placeholder={t('onboardingOtherPlaceholder')}
                placeholderTextColor={colors.s400}
                value={otherReasonText}
                onChangeText={setOtherReasonText}
                autoCapitalize="sentences"
              />
            )}

            <Text style={[styles.fieldLabel, { color: colors.s700 }]}>{t('onboardingDeadlineQuestion')}</Text>
            <View style={[styles.reasonGrid, styles.deadlineGrid]}>
              {DEADLINE_OPTIONS.map((opt) => {
                const isSelected = selectedDeadline === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.7}
                    style={[
                      styles.reasonChip,
                      styles.deadlineChip,
                      { backgroundColor: isSelected ? colors.e500 : colors.cardBg, borderColor: isSelected ? colors.e500 : colors.s200 },
                    ]}
                    onPress={() => {
                      setSelectedDeadline(opt.key);
                      setDeadlineYearsInput('');
                    }}
                  >
                    <Text style={[styles.reasonChipText, { color: isSelected ? '#fff' : colors.s800 }]}>{t(opt.i18nKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDeadline !== null && (
              <TextInput
                style={[styles.input, styles.otherInput, { backgroundColor: colors.s50, color: colors.s900, borderColor: colors.s200 }]}
                placeholder={t('onboardingDeadlineYearsPlaceholder')}
                placeholderTextColor={colors.s400}
                value={deadlineYearsInput}
                onChangeText={setDeadlineYearsInput}
                keyboardType="number-pad"
              />
            )}

            {editLimitReached && (
              <Text style={[styles.limitMessage, { color: colors.red }]}>{t('goalEditLimitReached')}</Text>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.btnContinue, { backgroundColor: canSubmit ? colors.e500 : colors.s300 }]}
              onPress={handleSave}
              disabled={!canSubmit}
            >
              <Text style={styles.btnContinueText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48 },
  orb1: { position: 'absolute', top: 40, right: -80, width: 260, height: 260, borderRadius: 999 },
  orb2: { position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 999 },
  content: { paddingTop: 24, alignItems: 'stretch', zIndex: 1 },
  limitNote: { fontSize: 13, textAlign: 'center', marginBottom: 4 },
  changesRemaining: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, marginBottom: 24 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  reasonChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  deadlineChip: { minWidth: '45%' },
  deadlineGrid: { marginBottom: 32 },
  reasonChipText: { fontSize: 14, fontWeight: '600' },
  otherInput: { marginBottom: 24 },
  limitMessage: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  btnContinue: { paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
  btnContinueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
