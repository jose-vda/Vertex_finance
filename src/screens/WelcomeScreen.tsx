import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function WelcomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.orb1, { backgroundColor: 'rgba(16,185,129,0.1)' }]} />
      <View style={[styles.orb2, { backgroundColor: 'rgba(52,211,153,0.08)' }]} />
      <View style={styles.content}>
        <View style={[styles.logo, { backgroundColor: colors.e500 }]}>
          <Ionicons name="trending-up" size={26} color="#fff" />
        </View>
        <Text style={[styles.label, { color: colors.e500 }]}>{t('welcomeTo')}</Text>
        <Text style={[styles.title, { color: colors.s900 }]}>{t('vertexFinance')}</Text>
        <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('welcomeSubtitle')}</Text>
        <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, { backgroundColor: colors.e500 }]} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="log-in-outline" size={17} color="#fff" />
          <Text style={styles.btnPrimaryText}>{t('signIn')}</Text>
        </TouchableOpacity>
        <Pressable style={({ pressed }) => [styles.btnSolid, { backgroundColor: colors.s900 }, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.btnSolidText}>{t('createFreeAccount')}</Text>
        </Pressable>
        <Text style={[styles.footer, { color: colors.s300 }]}>{t('dataSecure')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999 },
  orb2: { position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 999 },
  content: { alignItems: 'center', width: '100%', zIndex: 1 },
  logo: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, lineHeight: 38, marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 24, marginBottom: 48, textAlign: 'center', maxWidth: 280 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingVertical: 15, paddingHorizontal: 24, borderRadius: 999, marginBottom: 12 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSolid: { width: '100%', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999 },
  btnSolidText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  footer: { fontSize: 11, marginTop: 28 },
});
