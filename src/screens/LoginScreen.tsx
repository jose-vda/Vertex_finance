import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError(t('pleaseFillAll'));
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (e) {
        let msg = e.message;
        if (msg.includes('Invalid') || msg.includes('invalid_credentials')) msg = t('wrongEmailPassword');
        else if (msg.includes('Email not confirmed')) msg = t('confirmEmailFirst');
        setError(msg);
      }
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('cors')) {
        setError(t('networkError'));
      } else {
        setError(e?.message || t('wrongEmailPassword'));
      }
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
          <Ionicons name="trending-up" size={26} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.s900 }]}>{t('welcomeBack')}</Text>
        <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('signInToAccount')}</Text>
        {error ? (
          <View style={[styles.errBox, { backgroundColor: `${colors.red}12`, borderColor: `${colors.red}30` }]}>
            <Ionicons name="alert-circle" size={15} color={colors.red} />
            <Text style={[styles.errText, { color: colors.red }]}>{error}</Text>
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
          autoComplete="email"
        />
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.s500 }]}>{t('password')}</Text>
          <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }} onPress={() => navigation.navigate('Forgot')}>
            <Text style={[styles.link, { color: colors.e600 }]}>{t('forgotPassword')}</Text>
          </Pressable>
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]}
          placeholder="••••••••"
          placeholderTextColor={colors.s400}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, { backgroundColor: colors.e500 }, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('signIn')}</Text>}
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.s200 }]} />
          <Text style={[styles.dividerText, { color: colors.s400 }]}>{t('orContinueWith')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.s200 }]} />
        </View>
        <TouchableOpacity activeOpacity={0.7} style={[styles.btnSocial, { backgroundColor: colors.s50, borderColor: colors.s200 }]} onPress={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          <Text style={[styles.btnSocialText, { color: colors.s700 }]}>{t('continueWithGoogle')}</Text>
        </TouchableOpacity>
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.s400 }]}>{t('noAccount')}</Text>
          <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }} onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.link, { color: colors.e600 }]}>{t('signUp')}</Text>
          </Pressable>
        </View>
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
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  input: { borderRadius: 16, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'transparent' },
  link: { fontSize: 12, fontWeight: '600' },
  btnPrimary: { width: '100%', paddingVertical: 15, borderRadius: 999, alignItems: 'center', marginBottom: 20 },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  btnSocial: { borderWidth: 1.5, borderRadius: 999, padding: 13, alignItems: 'center', marginBottom: 24 },
  btnSocialText: { fontSize: 14, fontWeight: '600' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14 },
});
