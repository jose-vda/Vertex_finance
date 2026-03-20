import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { PRIVACY_POLICY_URL } from '../constants/legal';
import { supabase } from '../lib/supabase';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');
    setSuccess(false);
    if (!name.trim() || !email.trim() || !password) {
      setError(t('pleaseFillAll'));
      return;
    }
    if (password !== password2) {
      setError(t('passwordsDontMatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (e) {
        let msg = e.message;
        if (msg.includes('already')) msg = t('emailAlreadyRegistered');
        else if (msg.includes('weak') || msg.includes('password')) msg = t('passwordMinLength');
        setError(msg);
      } else if (data.user && !data.session) {
        setSuccess(true);
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
        <Text style={[styles.title, { color: colors.s900 }]}>{t('createAccount')}</Text>
        <Text style={[styles.subtitle, { color: colors.s500 }]}>{t('startJourney')}</Text>
        {error ? (
          <View style={[styles.errBox, { backgroundColor: `${colors.red}12`, borderColor: `${colors.red}30` }]}>
            <Ionicons name="alert-circle" size={15} color={colors.red} />
            <Text style={[styles.errText, { color: colors.red }]}>{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={[styles.successBox, { backgroundColor: colors.e50, borderColor: colors.e100 }]}>
            <Ionicons name="checkmark-circle" size={15} color={colors.e600} />
            <Text style={[styles.successText, { color: colors.e600 }]}>{t('checkEmailConfirm')}</Text>
          </View>
        ) : null}
        <Text style={[styles.label, { color: colors.s500 }]}>{t('fullName')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]} placeholder="João Silva" placeholderTextColor={colors.s400} value={name} onChangeText={setName} autoComplete="name" />
        <Text style={[styles.label, { color: colors.s500 }]}>{t('email')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]} placeholder="you@example.com" placeholderTextColor={colors.s400} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Text style={[styles.label, { color: colors.s500 }]}>{t('password')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]} placeholder="Min. 8 characters" placeholderTextColor={colors.s400} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <Text style={[styles.label, { color: colors.s500 }]}>{t('confirmPassword')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]} placeholder="Repeat your password" placeholderTextColor={colors.s400} value={password2} onChangeText={setPassword2} secureTextEntry autoComplete="new-password" />
        <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, { backgroundColor: colors.e500 }, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('createAccount')}</Text>}
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.s200 }]} />
          <Text style={[styles.dividerText, { color: colors.s400 }]}>{t('or')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.s200 }]} />
        </View>
        <TouchableOpacity activeOpacity={0.7} style={[styles.btnSocial, { backgroundColor: colors.s50, borderColor: colors.s200 }]} onPress={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          <Text style={[styles.btnSocialText, { color: colors.s700 }]}>{t('continueWithGoogle')}</Text>
        </TouchableOpacity>
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.s400 }]}>{t('alreadyHaveAccount')}</Text>
          <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }} onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: colors.e600 }]}>{t('signIn')}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.legalWrap} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Text style={[styles.legalText, { color: colors.s400 }]}>{t('agreeToPrivacy')}</Text>
        </Pressable>
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
  input: { borderRadius: 16, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'transparent' },
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
  link: { fontSize: 14, fontWeight: '600' },
  legalWrap: { marginTop: 16, paddingHorizontal: 8, alignItems: 'center' },
  legalText: { fontSize: 12, textAlign: 'center' },
});
