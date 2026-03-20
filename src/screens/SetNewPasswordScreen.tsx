import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SetNewPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const { setRecoveryMode } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    setError('');
    if (!password.trim()) {
      setError(t('enterNewPassword'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.updateUser({ password: password.trim() });
      if (e) {
        setError(e.message || t('resetFailed'));
        return;
      }
      setSuccess(true);
      setRecoveryMode(false);
    } catch (e: any) {
      setError(e.message || t('resetFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={[styles.logo, { backgroundColor: colors.e500 }]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.s900 }]}>{t('setNewPasswordTitle')}</Text>
          <Text style={[styles.successText, { color: colors.e600 }]}>{t('passwordUpdatedSuccess')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.orb1, { backgroundColor: 'rgba(16,185,129,0.1)' }]} />
      <View style={[styles.orb2, { backgroundColor: 'rgba(52,211,153,0.08)' }]} />
      <View style={styles.content}>
        <View style={[styles.logo, { backgroundColor: colors.e500 }]}>
          <Ionicons name="key-outline" size={26} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.s900 }]}>{t('setNewPasswordTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.s400 }]}>{t('setNewPasswordSubtitle')}</Text>
        {error ? (
          <View style={styles.errBox}>
            <Ionicons name="alert-circle" size={15} color={colors.red} />
            <Text style={[styles.errText, { color: colors.red }]}>{error}</Text>
          </View>
        ) : null}
        <Text style={[styles.label, { color: colors.s500 }]}>{t('newPasswordPlaceholder')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]}
          placeholder="••••••••"
          placeholderTextColor={colors.s400}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
        />
        <Text style={[styles.label, { color: colors.s500 }]}>{t('confirmNewPasswordPlaceholder')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.s50, color: colors.s900 }]}
          placeholder="••••••••"
          placeholderTextColor={colors.s400}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.btnPrimary, { backgroundColor: colors.e500 }, loading && styles.btnDisabled]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('updatePasswordBtn')}</Text>}
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
  logo: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 16 },
  errText: { fontSize: 13, flex: 1 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 16, padding: 14, fontSize: 16, marginBottom: 16, borderWidth: 1.5, borderColor: 'transparent' },
  btnPrimary: { width: '100%', paddingVertical: 15, borderRadius: 999, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successText: { fontSize: 15, marginTop: 12, textAlign: 'center' },
});
