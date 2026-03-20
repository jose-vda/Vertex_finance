import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

// URL que o Supabase usa para redirecionar após o clique no email. Tem de estar em Supabase > Authentication > URL Configuration > Redirect URLs
const RESET_PASSWORD_REDIRECT_URL = 'vertexfinance://reset-password';

export default function ForgotScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleForgot() {
    setError('');
    setSuccess(false);
    if (!email.trim()) {
      setError(t('enterEmail'));
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: RESET_PASSWORD_REDIRECT_URL,
      });
      if (e) setError(e.message || t('resetFailed'));
      else setSuccess(true);
    } catch (e: any) {
      setError(e.message || t('resetFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.orb1, { backgroundColor: 'rgba(16,185,129,0.1)' }]} />
      <View style={[styles.orb2, { backgroundColor: 'rgba(52,211,153,0.08)' }]} />
      <View style={styles.content}>
        <TouchableOpacity activeOpacity={0.7} style={[styles.backBtn, { backgroundColor: colors.s100 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color={colors.s500} />
        </TouchableOpacity>
        <View style={[styles.logo, { backgroundColor: colors.e500 }]}>
          <Ionicons name="key-outline" size={26} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.s900 }]}>{t('resetPassword')}</Text>
        <Text style={[styles.subtitle, { color: colors.s400 }]}>{t('resetPasswordSubtitle')}</Text>
        {error ? (
          <View style={[styles.errBox, { backgroundColor: `${colors.red}12`, borderColor: `${colors.red}30` }]}>
            <Ionicons name="alert-circle" size={15} color={colors.red} />
            <Text style={[styles.errText, { color: colors.red }]}>{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={[styles.successBox, { backgroundColor: colors.e50, borderColor: colors.e100 }]}>
            <Ionicons name="checkmark-circle" size={15} color={colors.e600} />
            <Text style={[styles.successText, { color: colors.e600 }]}>{t('checkEmailReset')}</Text>
          </View>
        ) : null}
        <Text style={[styles.label, { color: colors.s500 }]}>{t('email')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]}
          placeholder="you@example.com"
          placeholderTextColor={colors.s400}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, { backgroundColor: colors.e500 }, loading && styles.btnDisabled]} onPress={handleForgot} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('sendResetLink')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  orb1: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 999 },
  orb2: { position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 999 },
  content: { flex: 1, zIndex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  logo: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 32 },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errText: { fontSize: 13, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  successText: { fontSize: 13, flex: 1 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 16, padding: 14, fontSize: 16, marginBottom: 20, borderWidth: 1.5, borderColor: 'transparent' },
  btnPrimary: { width: '100%', paddingVertical: 15, borderRadius: 999, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
