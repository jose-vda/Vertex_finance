import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAcademyPremium } from '../../context/AcademyPremiumContext';
import AcademyScreen from '../../screens/AcademyScreen';
import AcademyPaywallScreen from '../../screens/AcademyPaywallScreen';

/**
 * Tab Academia: modo `free` → conteúdo completo; modo `paid` → paywall se não desbloqueado.
 */
export default function AcademyTabRoot() {
  const { colors } = useTheme();
  const { accessMode, isAcademyUnlocked, loading } = useAcademyPremium();

  if (accessMode === 'paid' && loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.e500} />
      </View>
    );
  }

  if (accessMode === 'paid' && !isAcademyUnlocked) {
    return <AcademyPaywallScreen />;
  }

  return <AcademyScreen />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
