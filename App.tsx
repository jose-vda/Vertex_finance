import './src/lib/notificationsSetup';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { WalletProvider } from './src/context/WalletContext';
import { AcademyProvider } from './src/context/AcademyContext';
import { AcademyPremiumProvider } from './src/context/AcademyPremiumContext';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SetNewPasswordScreen from './src/screens/SetNewPasswordScreen';
import { getColors } from './src/constants/theme';

type ErrorBoundaryState = { hasError: boolean };
type ErrorBoundaryProps = { children: ReactNode };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError = (): ErrorBoundaryState => ({ hasError: true });

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    const c = getColors('light');
    if (this.state.hasError) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: c.white }]}>
          <Text style={[styles.errorTitle, { color: c.s900 }]}>Algo correu mal</Text>
          <Text style={[styles.errorText, { color: c.s500 }]}>Fecha a app e abre novamente.</Text>
          <TouchableOpacity style={[styles.errorBtn, { backgroundColor: c.e500 }]} onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.errorBtnText}>Tentar outra vez</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function StatusBarTheme() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function Root() {
  const { session, loading, appState, recoveryMode } = useAuth();
  const { colors } = useTheme();
  const hasGoalDefined = (appState.goal != null && appState.goal > 0) || (appState.goal_set_at != null && appState.goal_set_at !== '');
  const needsOnboarding = session && !loading && !hasGoalDefined;

  if (recoveryMode) {
    return (
      <>
        <StatusBarTheme />
        <SetNewPasswordScreen />
      </>
    );
  }

  return (
    <>
      <StatusBarTheme />
      {loading ? (
        <View style={[styles.loader, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.e500} />
        </View>
      ) : (
        <NavigationContainer>
          {!session ? <AuthStack /> : needsOnboarding ? <OnboardingScreen /> : <MainStack />}
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemeProvider>
            <AuthProvider>
              <AcademyPremiumProvider>
                <WalletProvider>
                  <AcademyProvider>
                    <Root />
                  </AcademyProvider>
                </WalletProvider>
              </AcademyPremiumProvider>
            </AuthProvider>
          </ThemeProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorText: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  errorBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999 },
  errorBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
