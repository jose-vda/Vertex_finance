import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const { saveGoal } = useAuth();
  const [goalInput, setGoalInput] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineCategory | null>(null);
  const [deadlineYearsInput, setDeadlineYearsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  async function handleContinue() {
    const amount = parseAmount(goalInput);
    const reason =
      selectedReason === 'other' ? otherReasonText.trim() : selectedReason;
    const years = parseDeadlineYears();
    if (amount <= 0 || !reason || years === null) return;
    setSubmitting(true);
    try {
      await saveGoal(amount, reason, years);
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
  const canSubmit =
    amount > 0 &&
    reasonValid &&
    selectedDeadline !== null &&
    deadlineYearsValid &&
    !submitting;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
            <View style={[styles.logo, { backgroundColor: colors.e500 }]}>
              <Ionicons name="flag" size={26} color="#fff" />
            </View>
            <Text style={[styles.title, { color: colors.s900 }]}>{t('onboardingTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('onboardingSubtitle')}</Text>

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

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.btnContinue, { backgroundColor: canSubmit ? colors.e500 : colors.s300 }]}
              onPress={handleContinue}
              disabled={!canSubmit}
            >
              <Text style={styles.btnContinueText}>{t('onboardingContinue')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999 },
  orb2: { position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 999 },
  content: { paddingTop: 24, alignItems: 'stretch', zIndex: 1 },
  logo: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, marginBottom: 24 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  reasonChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  deadlineChip: { minWidth: '45%' },
  deadlineGrid: { marginBottom: 32 },
  reasonChipText: { fontSize: 14, fontWeight: '600' },
  otherInput: { marginBottom: 24 },
  btnContinue: { paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
  btnContinueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
