import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { INCOME_CATS, EXPENSE_CATS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWallet } from '../context/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '../components/PressableScale';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Toast } from '../components/Toast';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { appState, addTransaction, loadUserData } = useAuth();
  const { t, formatCurrency } = useSettings();
  const { portfolio } = useWallet();
  const { transactions, netWorth } = appState;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATS[0]);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  // Combined patrimony
  const investmentValue = portfolio?.totalValue ?? 0;
  const totalPatrimony = netWorth + investmentValue;
  const bankPct = totalPatrimony > 0 ? (Math.max(0, netWorth) / totalPatrimony) * 100 : (netWorth >= 0 ? 100 : 0);
  const investPct = totalPatrimony > 0 ? (investmentValue / totalPatrimony) * 100 : 0;
  const hasInvestments = investmentValue > 0;
  const investmentGain = portfolio?.totalGainLoss ?? 0;
  const investmentGainPct = portfolio?.totalGainLossPct ?? 0;

  const cats = modalType === 'income' ? INCOME_CATS : EXPENSE_CATS;

  function openModal(type: 'income' | 'expense') {
    setModalType(type);
    setCategory(type === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0]);
    setDesc('');
    setAmount('');
    setModalVisible(true);
  }

  async function handleSave() {
    const amt = parseFloat(amount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }
    const description = desc.trim() || (modalType === 'income' ? t('addIncome') : t('addExpense'));
    setSaving(true);
    try {
      const ok = await addTransaction({ type: modalType, desc: description, amount: amt, category });
      if (ok) {
        setModalVisible(false);
        setDesc('');
        setAmount('');
        setToastMessage(t('savedSuccess'));
        setToastVisible(true);
      } else {
        Alert.alert(t('error'), t('saveTransactionFailed'));
      }
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || t('saveTransactionFailed'));
    } finally {
      setSaving(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });
  const orb1Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.25 }] }));
  const orb2Style = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value * 0.2 }] }));

  return (
    <View style={{ flex: 1 }}>
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.e500} />}
    >
      <Animated.View style={[styles.orb1, orb1Style]} pointerEvents="none" />
      <Animated.View style={[styles.orb2, orb2Style]} pointerEvents="none" />

      {/* ─── PATRIMONY HERO CARD ─── */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.heroCardOuter}>
        <LinearGradient
          colors={['#047857', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Header row: label + gain badge */}
          <View style={styles.heroHeader}>
            <View style={styles.heroLabelRow}>
              <View style={styles.heroIcon}>
                <Ionicons name="diamond" size={14} color="#fff" />
              </View>
              <Text style={styles.heroLabel}>{t('totalPatrimony')}</Text>
            </View>
            {hasInvestments && (
              <View style={styles.heroBadge}>
                <Ionicons name={investmentGain >= 0 ? 'caret-up' : 'caret-down'} size={10} color="#fff" />
                <Text style={styles.heroBadgeText}>
                  {investmentGain >= 0 ? '+' : ''}{investmentGainPct.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {/* Main value */}
          <AnimatedNumber value={totalPatrimony} formatter={(n) => formatCurrency(n)} style={styles.heroValue} />
          <Text style={styles.heroSubtitle}>{t('patrimonySubtitle')}</Text>

          {/* Mini cards row */}
          <View style={styles.heroCardsRow}>
            <View style={styles.heroMiniCard}>
              <Ionicons name="business-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMiniLabel}>{t('bankBalance')}</Text>
              <Text style={styles.heroMiniValue}>{formatCurrency(netWorth)}</Text>
            </View>
            <View style={styles.heroMiniCard}>
              <Ionicons name="trending-up-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMiniLabel}>{t('investmentPortfolio')}</Text>
              {hasInvestments ? (
                <Text style={styles.heroMiniValue}>{formatCurrency(investmentValue)}</Text>
              ) : (
                <Text style={styles.heroMiniValueMuted}>{t('noInvestmentsShort')}</Text>
              )}
            </View>
          </View>

          {/* Breakdown bar */}
          <View style={styles.heroBar}>
            {netWorth > 0 && (
              <View style={[styles.heroBarSegment, { flex: bankPct, borderTopLeftRadius: 999, borderBottomLeftRadius: 999, borderTopRightRadius: hasInvestments ? 0 : 999, borderBottomRightRadius: hasInvestments ? 0 : 999 }]} />
            )}
            {hasInvestments && (
              <View style={[styles.heroBarSegment, styles.heroBarSegmentAlt, { flex: investPct, borderTopRightRadius: 999, borderBottomRightRadius: 999, borderTopLeftRadius: netWorth > 0 ? 0 : 999, borderBottomLeftRadius: netWorth > 0 ? 0 : 999 }]} />
            )}
          </View>
        </LinearGradient>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.twoCol}>
        <PressableScale style={{ flex: 1 }} onPress={() => openModal('income')}>
          <View style={[styles.btnOutline, { borderColor: colors.e500 }]}>
            <Ionicons name="add" size={14} color={colors.e600} />
            <Text style={[styles.btnOutlineText, { color: colors.e600 }]}>{t('addIncome')}</Text>
          </View>
        </PressableScale>
        <PressableScale style={{ flex: 1 }} onPress={() => openModal('expense')}>
          <View style={[styles.btnOutline, { borderColor: colors.e500 }]}>
            <Ionicons name="remove" size={14} color={colors.e600} />
            <Text style={[styles.btnOutlineText, { color: colors.e600 }]}>{t('addExpense')}</Text>
          </View>
        </PressableScale>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <PressableScale onPress={() => (navigation as any).navigate('Analytics')}>
        <View style={[styles.btnAnalytics, { borderColor: colors.s200, backgroundColor: colors.s50 }]}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.e600} />
          <Text style={[styles.btnOutlineText, { color: colors.e600 }]}>{t('analytics')}</Text>
        </View>
      </PressableScale>
      </Animated.View>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.cardBg }]} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.s900 }]}>{modalType === 'income' ? t('addIncome') : t('addExpense')}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={20} color={colors.s500} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { color: colors.s500 }]}>{t('amount')}</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]} placeholder="0.00" placeholderTextColor={colors.s400} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: colors.s500 }]}>{t('description')} ({t('optional')})</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]} placeholder={t('placeholderDesc')} placeholderTextColor={colors.s400} value={desc} onChangeText={setDesc} />
            <Text style={[styles.label, { color: colors.s500 }]}>{t('category')} ({t('optional')})</Text>
            <View style={styles.catRow}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.7}
                  style={[styles.catBtn, { borderColor: colors.s200, backgroundColor: colors.cardBg }, category === c && { backgroundColor: colors.e500, borderColor: colors.e500 }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catBtnText, { color: colors.s500 }, category === c && styles.catBtnTextActive]}>{t(c)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, { backgroundColor: colors.e500 }, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('saveTransaction')}</Text>}
            </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      </Animated.ScrollView>
      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} accentColor={colors.e500} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20, paddingBottom: 120 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.08)' },
  orb2: { position: 'absolute', bottom: 120, left: -60, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.06)' },
  card: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  // Hero card (gradient patrimony)
  heroCardOuter: {
    borderRadius: 28,
    marginBottom: 14,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    marginBottom: 20,
  },
  heroCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  heroMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  heroMiniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  heroMiniValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  heroMiniValueMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
  },
  heroBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    gap: 2,
  },
  heroBarSegment: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    minWidth: 4,
  },
  heroBarSegmentAlt: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // Portfolio link
  portfolioLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  portfolioLinkText: { fontSize: 13, fontWeight: '700' },
  portfolioLinkCount: { fontSize: 11, fontWeight: '600' },

  twoCol: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20 },
  btnOutlineText: { fontSize: 13, fontWeight: '700' },
  btnAnalytics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 14 },
  txButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  txButtonIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txButtonLabel: { fontSize: 14, fontWeight: '700' },
  txButtonBadge: { minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  txButtonBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  txModalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 430, padding: 24, paddingBottom: 48, maxHeight: '80%' },
  txModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txModalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  txModalScroll: { maxHeight: 500 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 13 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  txIcon: { width: 42, height: 42, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  txMid: { flex: 1, minWidth: 0 },
  txDesc: { fontSize: 15, fontWeight: '600' },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800', marginRight: 6 },
  delBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 430, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5 },
  catBtnActive: {},
  catBtnText: { fontSize: 12, fontWeight: '600' },
  catBtnTextActive: { color: '#fff' },
  input: { borderRadius: 16, padding: 15, fontSize: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'transparent' },
  btnPrimary: { paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
