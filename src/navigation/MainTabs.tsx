import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Alert,
  Linking,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { FEATURE_KEY_BANK_ACCOUNTS, subscribeFeatureNotify } from '../lib/featureNotify';
import { fetchUnreadAppNotificationsCount } from '../lib/appNotifications';
import { PRIVACY_POLICY_URL } from '../constants/legal';
import DashboardScreen from '../screens/DashboardScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import MilestonesScreen from '../screens/MilestonesScreen';
import WalletScreen from '../screens/WalletScreen';
import AcademyTabRoot from '../components/academy/AcademyTabRoot';
import NotificationsModal from '../components/NotificationsModal';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />
      <HomeStack.Screen name="Wallet" component={WalletScreen} />
    </HomeStack.Navigator>
  );
}

function BrandLogo({ size = 36, showWordmark = true, wordmarkStyle }: { size?: number; showWordmark?: boolean; wordmarkStyle?: any }) {
  const { t } = useSettings();
  const { colors } = useTheme();
  return (
    <View style={[styles.brandLogoWrap, { gap: size * 0.35 }]}>
      <View style={[styles.brandLogoIcon, { width: size, height: size, borderRadius: size * 0.36, backgroundColor: colors.e500 }]}>
        <Ionicons name="trending-up" size={size * 0.55} color="#fff" />
      </View>
      {showWordmark && (
        <Text style={[styles.brandWordmark, { color: colors.s900 }, wordmarkStyle]} numberOfLines={1}>{t('vertexShort')}</Text>
      )}
    </View>
  );
}

function ProfileAvatar({ uri, size }: { uri: string; size: number }) {
  return (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  );
}

function ProfilePhotoSection({
  avatarUrl,
  initials,
  onPickImage,
}: {
  avatarUrl?: string;
  initials: string;
  onPickImage: (camera: boolean) => void;
}) {
  const { t } = useSettings();
  const { colors } = useTheme();

  function showPicker() {
    Alert.alert(t('changePhoto'), '', [
      { text: t('takePhoto'), onPress: () => onPickImage(true) },
      { text: t('chooseFromGallery'), onPress: () => onPickImage(false) },
      { text: t('cancel'), style: 'cancel' },
    ]);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={showPicker}
      style={[styles.avatarBase, styles.avatarLarge, { backgroundColor: colors.e500 }]}
    >
      {avatarUrl ? (
        <ProfileAvatar uri={avatarUrl} size={52} />
      ) : (
        <Text style={styles.avatarTextLarge}>{initials}</Text>
      )}
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useSettings();
  const bottom = Math.max(8, Number(insets.bottom) || 0);

  return (
    <View style={[styles.customTabOuter, { paddingBottom: bottom }]}>
      <View style={[styles.customTabInner, { backgroundColor: colors.cardBg, shadowColor: colors.s900 }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel ??
            options.title ??
            (route.name === 'Home'
              ? t('dashboard')
              : route.name === 'Milestones'
              ? t('milestones')
              : route.name === 'Academy'
              ? t('academyTab')
              : route.name);
          const labelText = typeof label === 'string' ? label : route.name;

          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
          else if (route.name === 'Milestones') iconName = isFocused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'Academy') iconName = isFocused ? 'school' : 'school-outline';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.customTabItem,
                isFocused && [styles.customTabItemActive, { backgroundColor: `${colors.e500}12`, borderColor: `${colors.e500}60` }],
                pressed && !isFocused && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={iconName}
                size={20}
                color={isFocused ? colors.e600 : colors.s400}
              />
              <Text
                style={[
                  styles.customTabLabel,
                  { color: isFocused ? colors.e600 : colors.s500 },
                ]}
                numberOfLines={1}
              >
                {labelText}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabsInner() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const bottomInset = Math.max(0, Number(insets?.bottom) || 0);
  const sheetHeight = Math.round(windowHeight * 0.65);
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const { t, locale, setLocale, currency, setCurrency, themeMode, setThemeMode } = useSettings();
  const [profileVisible, setProfileVisible] = useState(false);
  const [bankVisionVisible, setBankVisionVisible] = useState(false);
  const [bankNotifyLoading, setBankNotifyLoading] = useState(false);
  const [bankNotifySubscribed, setBankNotifySubscribed] = useState(false);
  const [bankNotifyToastVisible, setBankNotifyToastVisible] = useState(false);
  const bankNotifyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileExpandSection, setProfileExpandSection] = useState<null | 'language' | 'currency'>(null);
  const [notifyUnreadCount, setNotifyUnreadCount] = useState(0);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(undefined);
  const name = (user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User') || 'User';
  const initials = (name && name.charAt(0)) ? name.charAt(0).toUpperCase() : 'U';
  const remoteAvatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || undefined;
  const avatarUrl = localAvatarUrl || remoteAvatarUrl;

  const refreshBankNotifySignup = useCallback(async () => {
    if (!user?.id) {
      setBankNotifySubscribed(false);
      return;
    }
    const { data, error } = await supabase
      .from('feature_notify_signups')
      .select('id')
      .eq('user_id', user.id)
      .eq('feature_key', FEATURE_KEY_BANK_ACCOUNTS)
      .maybeSingle();
    if (!error && data) setBankNotifySubscribed(true);
    else setBankNotifySubscribed(false);
  }, [user?.id]);

  useEffect(() => {
    if (bankVisionVisible) void refreshBankNotifySignup();
  }, [bankVisionVisible, refreshBankNotifySignup]);

  useEffect(() => {
    if (!profileVisible) setProfileExpandSection(null);
  }, [profileVisible]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setNotifyUnreadCount(0);
        return;
      }
      let cancelled = false;
      void (async () => {
        const n = await fetchUnreadAppNotificationsCount(supabase, user.id);
        if (!cancelled) setNotifyUnreadCount(n);
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id])
  );

  function openNotifications() {
    setNotificationsModalVisible(true);
  }

  useEffect(() => {
    return () => {
      if (bankNotifyToastTimerRef.current) clearTimeout(bankNotifyToastTimerRef.current);
    };
  }, []);

  function showBankNotifyToastBar() {
    if (bankNotifyToastTimerRef.current) clearTimeout(bankNotifyToastTimerRef.current);
    setBankNotifyToastVisible(true);
    bankNotifyToastTimerRef.current = setTimeout(() => {
      setBankNotifyToastVisible(false);
      bankNotifyToastTimerRef.current = null;
    }, 4800);
  }

  function goToDashboardAndCloseProfileModals() {
    setBankVisionVisible(false);
    setProfileVisible(false);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          params: {
            screen: 'Home',
            params: { screen: 'Dashboard' },
          },
        },
      ],
    });
  }

  async function handleBankNotifySubscribe() {
    if (!user?.id) {
      Alert.alert(t('bankVisionNotifyLoginTitle'), t('bankVisionNotifyLoginMsg'));
      return;
    }
    setBankNotifyLoading(true);
    try {
      const r = await subscribeFeatureNotify(supabase, user.id, FEATURE_KEY_BANK_ACCOUNTS);
      if (!r.ok) {
        Alert.alert(t('bankVisionNotifyErrorTitle'), r.message ?? t('bankVisionNotifyErrorBody'));
        return;
      }
      setBankNotifySubscribed(true);
      goToDashboardAndCloseProfileModals();
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => showBankNotifyToastBar(), 320);
      });
    } finally {
      setBankNotifyLoading(false);
    }
  }

  async function pickAndUpload(camera: boolean) {
    if (!user?.id) return;
    // Fecha o modal primeiro — necessário no iOS para o picker nativo abrir por cima
    setProfileVisible(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 350));
    const { status } = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissionRequired'),
        camera ? t('cameraPermissionMsg') : t('galleryPermissionMsg')
      );
      return;
    }
    const pickerOptions = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7 };
    const result = camera
      ? await ImagePicker.launchCameraAsync({ ...pickerOptions, mediaTypes: ['images'] })
      : await ImagePicker.launchImageLibraryAsync({ ...pickerOptions, mediaTypes: ['images'] });
    const anyResult = result as any;
    const canceled = anyResult?.canceled ?? anyResult?.cancelled ?? false;
    const localUri =
      anyResult?.assets?.[0]?.uri ??
      anyResult?.assets?.[0]?.localUri ??
      anyResult?.uri ??
      null;

    if (canceled) return;

    if (!localUri || typeof localUri !== 'string') {
      Alert.alert(t('photoUploadFailed'), t('photoUploadFailedMsg'));
      return;
    }
    // Mostra a foto instantaneamente usando o arquivo local
    setLocalAvatarUrl(localUri);

    // Upload silencioso em background — sem spinner, sem bloquear UI
    const storagePath = `${user.id}/avatar.jpg`;
    try {
      const res = await fetch(localUri);
      // Em RN nem sempre o `arrayBuffer()` funciona com a mesma compatibilidade de `web`.
      // Preferimos Blob para aumentar a taxa de sucesso no upload.
      let uploadBody: any = null;
      try {
        const blob = await res.blob();
        uploadBody = blob;
      } catch {
        const arrayBuffer = await res.arrayBuffer();
        uploadBody = new Uint8Array(arrayBuffer);
      }

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(storagePath, uploadBody, { contentType: 'image/jpeg', upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      // Atualiza para a URL remota (com cache-buster) silenciosamente
      setLocalAvatarUrl(publicUrl);
    } catch (e: any) {
      // Foto local continua aparecendo — apenas avisa se o upload falhou
      Alert.alert(
        t('photoUploadFailed'),
        e?.message || t('photoUploadFailedMsg')
      );
    }
  }
  let dateStr: string;
  try {
    dateStr = new Date().toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    dateStr = new Date().toISOString().slice(0, 10);
  }

  const themeStyles = useMemo(() => ({
    safe: { backgroundColor: colors.tabBarBg },
    header: { backgroundColor: colors.tabBarBg, borderBottomColor: colors.s100 },
    headerDate: { color: colors.s500 },
    contentWrap: { backgroundColor: colors.background },
    avatar: { backgroundColor: colors.e500 },
    modalSheet: { backgroundColor: colors.cardBg },
    modalBrandRow: { borderBottomColor: colors.s100 },
    modalBrandName: { color: colors.s900 },
    profileName: { color: colors.s900 },
    profileEmail: { color: colors.s400 },
    optionBtn: { borderColor: colors.s200, backgroundColor: colors.s50 },
    optionBtnActive: { backgroundColor: colors.e500, borderColor: colors.e500 },
    optionBtnText: { color: colors.s500 },
    optionBtnTextActive: { color: '#fff' },
    logoutText: { color: colors.red },
    settingsLabel: { color: colors.s700 },
  }), [colors]);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeBase, themeStyles.safe]} edges={['top']}>
        <View style={[styles.headerBase, themeStyles.header]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.75}
              // O header está fora do contexto do Tab.Navigator.
              // Forçamos reset no stack raiz para garantir retorno a Main > Home > Dashboard.
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Main',
                      params: {
                        screen: 'Home',
                        params: { screen: 'Dashboard' },
                      },
                    },
                  ],
                })
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BrandLogo size={38} showWordmark />
            </TouchableOpacity>
            <Text style={[styles.headerDateBase, themeStyles.headerDate]}>{dateStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openNotifications}
              style={[styles.bellBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : `${colors.s500}14` }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('notificationsTitle')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.e600} />
              {notifyUnreadCount > 0 ? (
                <View style={[styles.bellBadge, { backgroundColor: colors.red }]}>
                  <Text style={styles.bellBadgeText}>{notifyUnreadCount > 99 ? '99+' : String(notifyUnreadCount)}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setProfileVisible(true)} style={[styles.avatarBase, themeStyles.avatar]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {avatarUrl ? (
                <ProfileAvatar uri={avatarUrl} size={40} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <View style={[styles.contentWrapBase, themeStyles.contentWrap]}>
        <View style={styles.orb1} pointerEvents="none" />
        <View style={styles.orb2} pointerEvents="none" />
        <View style={{ flex: 1, zIndex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="Home"
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={{
            tabBarLabel: t('dashboard'),
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Milestones"
          component={MilestonesScreen}
          options={{
            tabBarLabel: t('milestones'),
            tabBarIcon: ({ color }) => <Ionicons name="trophy-outline" size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Academy"
          component={AcademyTabRoot}
          options={{
            tabBarLabel: t('academyTab'),
            tabBarIcon: ({ color }) => <Ionicons name="school-outline" size={20} color={color} />,
          }}
        />
      </Tab.Navigator>
        </View>
      </View>

      <Modal visible={profileVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setProfileVisible(false)}>
          <Pressable style={[styles.modalSheetBase, themeStyles.modalSheet, { height: sheetHeight }]} onPress={(e) => e.stopPropagation()}>
            <ScrollView style={styles.profileSheetScroll} showsVerticalScrollIndicator={true} bounces={false}>
              {/* Handle bar */}
              <View style={styles.modalHandle} />

              {/* Header: Brand + Close */}
              <View style={[styles.modalBrandRowBase, themeStyles.modalBrandRow]}>
                <BrandLogo size={36} showWordmark={false} />
                <Text style={[styles.modalBrandNameBase, themeStyles.modalBrandName]}>{t('vertexFinance')}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setProfileVisible(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={[styles.modalCloseBtn, { backgroundColor: `${colors.s500}12` }]}
                >
                  <Ionicons name="close" size={20} color={colors.s500} />
                </TouchableOpacity>
              </View>

              {/* Profile Hero Card */}
              <View style={[styles.profileCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.profileHeader}>
                  <ProfilePhotoSection
                    avatarUrl={avatarUrl}
                    initials={initials}
                    onPickImage={pickAndUpload}
                  />
                  <View style={styles.profileHeaderText}>
                    <Text style={[styles.profileNameBase, themeStyles.profileName]}>{name}</Text>
                    <Text style={[styles.profileEmailBase, themeStyles.profileEmail]}>{user?.email || ''}</Text>
                  </View>
                  <View style={[styles.profileBadge, { backgroundColor: `${colors.e500}15` }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.e500} />
                    <Text style={[styles.profileBadgeText, { color: colors.e500 }]}>PRO</Text>
                  </View>
                </View>
              </View>

              {/* Bank connection — placeholder (Open Banking / aggregator later) */}
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => setBankVisionVisible(true)}
                style={[
                  styles.bankLinkCard,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    borderColor: `${colors.e500}40`,
                  },
                ]}
              >
                <View style={styles.bankLinkRow}>
                  <View style={[styles.settingsRowIcon, { backgroundColor: `${colors.e500}16` }]}>
                    <Ionicons name="link-outline" size={16} color={colors.e600} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.bankLinkTitle, { color: colors.e600 }]}>{t('bankLinkTitle')}</Text>
                    <Text style={[styles.bankLinkHint, { color: colors.s500 }]} numberOfLines={2}>
                      {t('bankLinkSubtitle')}
                    </Text>
                  </View>
                  <View style={[styles.bankLinkPill, { backgroundColor: `${colors.e500}1A` }]}>
                    <Text style={[styles.bankLinkPillText, { color: colors.e600 }]}>{t('bankLinkBadge')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.s300} />
                </View>
              </TouchableOpacity>

              {/* Settings Section */}
              <View style={[styles.settingsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.settingsSectionHeader}>
                  <View style={[styles.settingsSectionIcon, { backgroundColor: `${colors.e500}12` }]}>
                    <Ionicons name="settings-outline" size={14} color={colors.e500} />
                  </View>
                  <Text style={[styles.settingsSectionTitle, { color: colors.s400 }]}>{t('settings')}</Text>
                </View>

                {/* Theme */}
                <View style={styles.settingsRowModern}>
                  <View style={styles.settingsRowLeft}>
                    <View style={[styles.settingsRowIcon, { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
                      <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={14} color="#F59E0B" />
                    </View>
                    <Text style={[styles.settingsRowLabel, { color: colors.s700 }]}>{t('theme')}</Text>
                  </View>
                  <View style={styles.optionRow}>
                    <TouchableOpacity activeOpacity={0.7} style={[styles.optionBtnBase, themeStyles.optionBtn, themeMode === 'light' && themeStyles.optionBtnActive]} onPress={() => setThemeMode('light')}>
                      <Ionicons name="sunny-outline" size={14} color={themeMode === 'light' ? '#fff' : colors.s500} />
                      <Text style={[styles.optionBtnTextBase, themeStyles.optionBtnText, themeMode === 'light' && themeStyles.optionBtnTextActive]}>{t('themeLight')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} style={[styles.optionBtnBase, themeStyles.optionBtn, themeMode === 'dark' && themeStyles.optionBtnActive]} onPress={() => setThemeMode('dark')}>
                      <Ionicons name="moon-outline" size={14} color={themeMode === 'dark' ? '#fff' : colors.s500} />
                      <Text style={[styles.optionBtnTextBase, themeStyles.optionBtnText, themeMode === 'dark' && themeStyles.optionBtnTextActive]}>{t('themeDark')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.settingsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />

                {/* Language — acordeão */}
                <View>
                  <TouchableOpacity
                    activeOpacity={0.72}
                    onPress={() => setProfileExpandSection((s) => (s === 'language' ? null : 'language'))}
                    style={styles.profileAccordionHeader}
                  >
                    <View style={styles.settingsRowLeft}>
                      <View style={[styles.settingsRowIcon, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                        <Ionicons name="language" size={14} color="#6366F1" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.settingsRowLabel, { color: colors.s700 }]}>{t('language')}</Text>
                        <Text style={[styles.profileAccordionCurrent, { color: colors.s500 }]} numberOfLines={1}>
                          {locale === 'en' ? t('localeEnglish') : t('localePortuguese')}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={profileExpandSection === 'language' ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.s400}
                    />
                  </TouchableOpacity>
                  {profileExpandSection === 'language' ? (
                    <View style={styles.profileAccordionBody}>
                      {(['en', 'pt'] as const).map((loc) => {
                        const selected = locale === loc;
                        return (
                          <TouchableOpacity
                            key={loc}
                            activeOpacity={0.75}
                            onPress={() => {
                              setLocale(loc);
                              setProfileExpandSection(null);
                            }}
                            style={[
                              styles.profileAccordionOption,
                              {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: selected ? colors.e500 : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                              },
                            ]}
                          >
                            <Text style={[styles.profileAccordionOptionText, { color: colors.s900 }]}>
                              {loc === 'en' ? t('localeEnglish') : t('localePortuguese')}
                            </Text>
                            {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.e600} /> : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                <View style={[styles.settingsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />

                {/* Moeda — acordeão */}
                <View>
                  <TouchableOpacity
                    activeOpacity={0.72}
                    onPress={() => setProfileExpandSection((s) => (s === 'currency' ? null : 'currency'))}
                    style={styles.profileAccordionHeader}
                  >
                    <View style={styles.settingsRowLeft}>
                      <View style={[styles.settingsRowIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                        <Ionicons name="cash-outline" size={14} color="#10B981" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.settingsRowLabel, { color: colors.s700 }]}>{t('currency')}</Text>
                        <Text style={[styles.profileAccordionCurrent, { color: colors.s500 }]} numberOfLines={1}>
                          {currency === 'USD'
                            ? t('currencyOptionUsd')
                            : currency === 'EUR'
                              ? t('currencyOptionEur')
                              : currency === 'GBP'
                                ? t('currencyOptionGbp')
                                : t('currencyOptionBrl')}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={profileExpandSection === 'currency' ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.s400}
                    />
                  </TouchableOpacity>
                  {profileExpandSection === 'currency' ? (
                    <View style={styles.profileAccordionBody}>
                      {(['USD', 'EUR', 'GBP', 'BRL'] as const).map((c) => {
                        const selected = currency === c;
                        const label =
                          c === 'USD'
                            ? t('currencyOptionUsd')
                            : c === 'EUR'
                              ? t('currencyOptionEur')
                              : c === 'GBP'
                                ? t('currencyOptionGbp')
                                : t('currencyOptionBrl');
                        return (
                          <TouchableOpacity
                            key={c}
                            activeOpacity={0.75}
                            onPress={() => {
                              setCurrency(c);
                              setProfileExpandSection(null);
                            }}
                            style={[
                              styles.profileAccordionOption,
                              {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: selected ? colors.e500 : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                              },
                            ]}
                          >
                            <Text style={[styles.profileAccordionOptionText, { color: colors.s900 }]}>{label}</Text>
                            {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.e600} /> : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Actions Section */}
              <View style={[styles.settingsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                {/* Edit Goal */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionRow}
                  onPress={() => {
                    setProfileVisible(false);
                    navigation.navigate('EditGoal');
                  }}
                >
                  <View style={[styles.settingsRowIcon, { backgroundColor: `${colors.e500}12` }]}>
                    <Ionicons name="flag" size={14} color={colors.e500} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionRowText, { color: colors.s900 }]}>{t('editGoals')}</Text>
                    <Text style={[styles.actionRowHint, { color: colors.s400 }]}>{t('goalEditMaxPerAccount')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.s300} />
                </TouchableOpacity>

                <View style={[styles.settingsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />

                {/* Privacy */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionRow}
                  onPress={() => {
                    setProfileVisible(false);
                    Linking.openURL(PRIVACY_POLICY_URL);
                  }}
                >
                  <View style={[styles.settingsRowIcon, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#6366F1" />
                  </View>
                  <Text style={[styles.actionRowText, { color: colors.s900, flex: 1 }]}>{t('privacyPolicy')}</Text>
                  <Ionicons name="open-outline" size={14} color={colors.s400} />
                </TouchableOpacity>
              </View>

              {/* Sign Out */}
              <TouchableOpacity activeOpacity={0.7} style={[styles.logoutBtn, { borderColor: `${colors.red}30`, backgroundColor: `${colors.red}08` }]} onPress={() => { setProfileVisible(false); signOut(); }}>
                <Ionicons name="log-out-outline" size={18} color={colors.red} />
                <Text style={[styles.logoutTextBase, themeStyles.logoutText]}>{t('signOut')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Visão: banco + investimentos (copy de produto — em desenvolvimento) */}
      <Modal
        visible={bankVisionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBankVisionVisible(false)}
      >
        <Pressable
          style={[styles.bankVisionOverlay, { paddingBottom: Math.max(20, bottomInset + 12) }]}
          onPress={() => setBankVisionVisible(false)}
        >
          <Pressable
            style={[
              styles.bankVisionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                maxHeight: Math.min(windowHeight * 0.78, 560),
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.bankVisionTopRow}>
              <View style={[styles.bankVisionIconWrap, { backgroundColor: `${colors.e500}18` }]}>
                <Ionicons name="sparkles" size={22} color={colors.e600} />
              </View>
              <TouchableOpacity
                onPress={() => setBankVisionVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.bankVisionCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <Ionicons name="close" size={22} color={colors.e600} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={[styles.bankVisionScroll, { maxHeight: Math.min(windowHeight * 0.52, 340) }]}
              contentContainerStyle={styles.bankVisionScrollContent}
              showsVerticalScrollIndicator={false}
              bounces
            >
              <Text style={[styles.bankVisionTitle, { color: colors.e600 }]}>{t('bankVisionModalTitle')}</Text>
              <Text style={[styles.bankVisionLead, { color: colors.e500 }]}>{t('bankVisionModalLead')}</Text>
              <Text style={[styles.bankVisionBody, { color: colors.s700 }]}>{t('bankVisionModalIntro')}</Text>
              <Text style={[styles.bankVisionSection, { color: colors.e600 }]}>{t('bankVisionModalSection')}</Text>
              {[t('bankVisionPoint1'), t('bankVisionPoint2'), t('bankVisionPoint3'), t('bankVisionPoint4')].map((line, i) => (
                <View key={i} style={styles.bankVisionBulletRow}>
                  <View style={[styles.bankVisionBulletDot, { backgroundColor: colors.e500 }]} />
                  <Text style={[styles.bankVisionBulletText, { color: colors.s700 }]}>{line}</Text>
                </View>
              ))}
              <Text style={[styles.bankVisionOutro, { color: colors.s700 }]}>{t('bankVisionModalOutro')}</Text>
            </ScrollView>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={bankNotifyLoading}
              onPress={handleBankNotifySubscribe}
              style={[
                styles.bankVisionNotifyBtn,
                {
                  borderColor: colors.e500,
                  backgroundColor: isDark ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)',
                  opacity: bankNotifyLoading ? 0.65 : 1,
                },
              ]}
            >
              {bankNotifyLoading ? (
                <ActivityIndicator color={colors.e600} />
              ) : (
                <Text style={[styles.bankVisionNotifyBtnText, { color: colors.e600 }]}>
                  {bankNotifySubscribed ? t('bankVisionNotifyRefresh') : t('bankVisionNotifyCta')}
                </Text>
              )}
            </TouchableOpacity>
            {bankNotifySubscribed ? (
              <Text style={[styles.bankVisionNotifyHint, { color: colors.s500 }]}>{t('bankVisionNotifyAlready')}</Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => {
          setNotificationsModalVisible(false);
          if (user?.id) {
            void (async () => {
              const n = await fetchUnreadAppNotificationsCount(supabase, user.id);
              setNotifyUnreadCount(n);
            })();
          }
        }}
        onUnreadCountChange={setNotifyUnreadCount}
      />

      {bankNotifyToastVisible ? (
        <View
          style={[
            styles.bankNotifyToastWrap,
            {
              bottom: bottomInset + 76,
              backgroundColor: colors.e600,
              shadowColor: '#000',
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="notifications" size={18} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.bankNotifyToastText}>{t('bankVisionNotifyToast')}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MainTabs() {
  return <MainTabsInner />;
}

const styles = StyleSheet.create({
  safeBase: {},
  headerBase: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  headerDateBase: { fontSize: 13, marginTop: 4, letterSpacing: 0.3 },
  contentWrapBase: { flex: 1, position: 'relative' },
  orb1: { position: 'absolute', top: -100, right: -90, width: 280, height: 280, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.08)' },
  orb2: { position: 'absolute', bottom: -80, left: -70, width: 220, height: 220, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.06)' },
  brandLogoWrap: { flexDirection: 'row', alignItems: 'center' },
  brandLogoIcon: { justifyContent: 'center', alignItems: 'center' },
  brandWordmark: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  avatarBase: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tabLabel: { fontSize: 11, fontWeight: '600', textTransform: 'none' },
  marcosTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 4,
  },
  marcosTabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  marcosTab3DOuter: {
    marginTop: -18,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcosTab3DShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  marcosTab3DPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 72,
  },
  marcosTab3DPillInactive: {
    borderWidth: 2,
  },
  marcosTabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customTabOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  customTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  customTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  customTabItemActive: {},
  customTabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.36)', justifyContent: 'flex-end', alignItems: 'center' },
  modalSheetBase: { borderTopLeftRadius: 32, borderTopRightRadius: 32, width: '100%', maxWidth: 430, padding: 24, paddingBottom: 48, overflow: 'hidden' },
  profileSheetScroll: { flex: 1 },
  modalBrandRowBase: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalBrandNameBase: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, flex: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  profileHeaderText: { flex: 1 },
  avatarLarge: { width: 52, height: 52 },
  avatarTextLarge: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileNameBase: { fontSize: 17, fontWeight: '700' },
  profileEmailBase: { fontSize: 12 },
  settingsRow: { marginBottom: 14 },
  settingsLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtnBase: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5 },
  optionBtnTextBase: { fontSize: 13, fontWeight: '600' },
  editGoalsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, marginBottom: 14 },
  editGoalsBtnText: { fontSize: 14, fontWeight: '600' },
  editGoalsHint: { fontSize: 11, textAlign: 'center', marginTop: -8, marginBottom: 14 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 8 },
  privacyRowText: { fontSize: 13 },
  statsCardBase: { borderRadius: 16, padding: 16, marginBottom: 14 },
  statsTitleBase: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  bankLinkCard: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  bankLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankLinkTitle: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  bankLinkHint: { fontSize: 11, marginTop: 3, lineHeight: 15, fontWeight: '500' },
  bankLinkPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bankLinkPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, marginTop: 8 },
  logoutTextBase: { fontSize: 14, fontWeight: '600' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'center', marginBottom: 16 },
  profileCard: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  profileBadgeText: { fontSize: 11, fontWeight: '700' },
  profileAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 8,
  },
  profileAccordionCurrent: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  profileAccordionBody: { paddingBottom: 6, paddingLeft: 2, paddingRight: 2 },
  profileAccordionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  profileAccordionOptionText: { fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 8 },
  settingsCard: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  settingsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  settingsSectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingsSectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  settingsRowModern: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsRowIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingsRowLabel: { fontSize: 14, fontWeight: '600' },
  settingsDivider: { height: 1, marginVertical: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  actionRowText: { fontSize: 14, fontWeight: '600' },
  actionRowHint: { fontSize: 11, marginTop: 2 },
  bankVisionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  bankVisionCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  bankVisionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankVisionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankVisionCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankVisionScroll: {},
  bankVisionScrollContent: { paddingBottom: 8 },
  bankVisionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
  bankVisionLead: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 12 },
  bankVisionBody: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  bankVisionSection: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  bankVisionBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bankVisionBulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  bankVisionBulletText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  bankVisionOutro: { fontSize: 13, lineHeight: 20, marginTop: 6, fontStyle: 'italic' },
  bankVisionNotifyBtn: {
    marginTop: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  bankVisionNotifyBtnText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  bankVisionNotifyHint: { fontSize: 11, textAlign: 'center', marginTop: 6, marginBottom: 8, fontWeight: '600' },
  bankNotifyToastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  bankNotifyToastText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
