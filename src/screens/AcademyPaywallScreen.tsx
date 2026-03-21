import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAcademyPremium } from '../context/AcademyPremiumContext';

export default function AcademyPaywallScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useSettings();
  const { loading, refreshAcademyEntitlement } = useAcademyPremium();

  const onPurchase = () => {
    Alert.alert(t('academyPaywallSoonTitle'), t('academyPaywallSoonMessage'));
  };

  const onRestore = () => {
    void refreshAcademyEntitlement().then(() => {
      Alert.alert(t('academyPaywallRestoreTitle'), t('academyPaywallRestoreMessage'));
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.e500} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#022C22', '#064E3B'] : ['#047857', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={40} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>{t('academyPaywallTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('academyPaywallSubtitle')}</Text>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{t('academyPaywallPrice')}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]}>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={20} color={colors.e600} />
          <Text style={[styles.bulletText, { color: colors.s700 }]}>{t('academyPaywallBullet1')}</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={20} color={colors.e600} />
          <Text style={[styles.bulletText, { color: colors.s700 }]}>{t('academyPaywallBullet2')}</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={20} color={colors.e600} />
          <Text style={[styles.bulletText, { color: colors.s700 }]}>{t('academyPaywallBullet3')}</Text>
        </View>

        <Pressable onPress={onPurchase} style={[styles.primaryBtn, { backgroundColor: colors.e500 }]}>
          <Text style={styles.primaryBtnText}>{t('academyPaywallCta')}</Text>
        </Pressable>

        <Pressable onPress={onRestore} style={styles.secondaryBtn}>
          <Text style={[styles.secondaryBtnText, { color: colors.e600 }]}>{t('academyPaywallRestore')}</Text>
        </Pressable>

        <Text style={[styles.footer, { color: colors.s400 }]}>{t('academyPaywallFooter')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 10, lineHeight: 19 },
  pricePill: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  priceText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  card: {
    marginHorizontal: 20,
    marginTop: -12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
  footer: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },
});
