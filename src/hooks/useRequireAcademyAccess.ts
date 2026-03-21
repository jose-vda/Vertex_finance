import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAcademyPremium } from '../context/AcademyPremiumContext';
import type { MainStackParamList } from '../navigation/types';

/**
 * Em modo `paid`, redireciona para fora do ecrã se a Academia não estiver desbloqueada.
 * Usar nos ecrãs do stack ligados à Academia (livros, fórum).
 */
export function useRequireAcademyAccess() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { accessMode, isAcademyUnlocked, loading } = useAcademyPremium();

  useEffect(() => {
    if (loading) return;
    if (accessMode !== 'paid') return;
    if (isAcademyUnlocked) return;

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  }, [accessMode, isAcademyUnlocked, loading, navigation]);
}
