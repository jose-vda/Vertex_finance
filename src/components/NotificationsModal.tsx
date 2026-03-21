import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { MainStackParamList } from '../navigation/types';
import {
  fetchAppNotifications,
  fetchUnreadAppNotificationsCount,
  markAppNotificationRead,
  type AppNotificationRow,
} from '../lib/appNotifications';

function fillNotifTemplate(template: string, name: string, topic: string): string {
  return template.replace(/\{\{name\}\}/g, name).replace(/\{\{topic\}\}/g, topic);
}

function resolveNotificationDisplay(
  row: AppNotificationRow,
  t: (key: string) => string
): { title: string; body: string | null; icon: keyof typeof Ionicons.glyphMap } {
  const meta = row.metadata;
  if (row.notification_type === 'forum_reply' && meta && typeof meta === 'object') {
    const m = meta as Record<string, unknown>;
    const actor = String(m.actor_name ?? '').trim() || '—';
    const topicTitle = String(m.topic_title ?? '').trim() || '—';
    const kind = String(m.kind ?? '');
    if (kind === 'reply_to_comment') {
      return {
        title: t('notifForumReplyCommentTitle'),
        body: fillNotifTemplate(t('notifForumReplyCommentBody'), actor, topicTitle),
        icon: 'chatbubbles-outline',
      };
    }
    return {
      title: t('notifForumReplyTopicTitle'),
      body: fillNotifTemplate(t('notifForumReplyTopicBody'), actor, topicTitle),
      icon: 'chatbubbles-outline',
    };
  }
  if (row.notification_type === 'app_update') {
    return {
      title: t('notifAppUpdateTitle'),
      body: row.body || t('notifAppUpdateBody'),
      icon: 'rocket-outline',
    };
  }
  if (row.notification_type === 'price_alert') {
    return {
      title: row.title,
      body: row.body,
      icon: 'trending-up-outline',
    };
  }
  return {
    title: row.title,
    body: row.body,
    icon: 'notifications-outline',
  };
}

function formatNotificationDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
};

export default function NotificationsModal({ visible, onClose, onUnreadCountChange }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, locale } = useSettings();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(-1200)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const panelMaxH = Math.min(Math.round(windowHeight * 0.78), 560);
  const topInset = Math.max(insets.top, 12);
  const panelBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const refreshUnreadBadge = useCallback(async () => {
    if (!user?.id || !onUnreadCountChange) return;
    const n = await fetchUnreadAppNotificationsCount(supabase, user.id);
    onUnreadCountChange(n);
  }, [user?.id, onUnreadCountChange]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await fetchAppNotifications(supabase, user.id);
    setItems(data);
    setLoading(false);
    await refreshUnreadBadge();
  }, [user?.id, refreshUnreadBadge]);

  useEffect(() => {
    if (!visible) return;

    setModalMounted(true);
    slideAnim.setValue(-panelMaxH);
    backdropAnim.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 65,
        }),
      ]).start();
    });
  }, [visible, panelMaxH, slideAnim, backdropAnim]);

  useEffect(() => {
    if (!visible) return;
    void load();
  }, [visible, load]);

  const runCloseAnimation = useCallback(
    (thenClose: () => void) => {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -panelMaxH,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setModalMounted(false);
          thenClose();
        }
      });
    },
    [backdropAnim, slideAnim, panelMaxH]
  );

  const handleClose = useCallback(() => {
    runCloseAnimation(onClose);
  }, [onClose, runCloseAnimation]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const onPressItem = useCallback(
    async (row: AppNotificationRow) => {
      if (!user?.id) return;
      if (!row.read_at) {
        await markAppNotificationRead(supabase, user.id, row.id);
        setItems((prev) =>
          prev.map((n) => (n.id === row.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        await refreshUnreadBadge();
      }
      if (row.notification_type === 'forum_reply') {
        const meta = row.metadata as Record<string, unknown> | undefined;
        const tid = meta && typeof meta.topic_id === 'string' ? meta.topic_id : null;
        if (tid) {
          const parentNav = navigation.getParent();
          const nav = (parentNav ?? navigation) as NativeStackNavigationProp<MainStackParamList>;
          nav.navigate('TopicThread', { topicId: tid });
          runCloseAnimation(onClose);
        }
      }
    },
    [user?.id, refreshUnreadBadge, navigation, onClose, runCloseAnimation]
  );

  function renderItem({ item }: { item: AppNotificationRow }) {
    const unread = !item.read_at;
    const disp = resolveNotificationDisplay(item, t);
    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={() => void onPressItem(item)}
        style={styles.rowTouchable}
      >
        <View style={styles.rowInner}>
          <View style={styles.rowLeading}>
            <View style={styles.iconUnreadWrap}>
              <View
                style={[
                  styles.typeIconCircle,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Ionicons name={disp.icon} size={18} color={colors.e600} />
              </View>
              {unread ? <View style={[styles.unreadCornerDot, { backgroundColor: colors.e500 }]} /> : null}
            </View>
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.itemTitle, { color: colors.s900 }]} numberOfLines={2}>
              {disp.title}
            </Text>
            {disp.body ? (
              <Text style={[styles.itemBody, { color: colors.s500 }]} numberOfLines={3}>
                {disp.body}
              </Text>
            ) : null}
            <Text style={[styles.itemDate, { color: colors.s400 }]}>
              {formatNotificationDate(item.created_at, locale)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const listMaxH = Math.max(200, panelMaxH - 120);

  if (!visible && !modalMounted) {
    return null;
  }

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal visible={modalMounted || visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.cardBg,
              borderColor: panelBorder,
              maxHeight: panelMaxH,
              marginTop: topInset,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.panelInner}>
            <View style={styles.topRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.e500}18` }]}>
                <Ionicons name="notifications-outline" size={22} color={colors.e600} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.s900 }]} numberOfLines={1}>
                {t('notificationsTitle')}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Ionicons name="close" size={22} color={colors.e600} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.kindsHint, { color: colors.s400 }]} numberOfLines={3}>
              {t('notificationsKindsHint')}
            </Text>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.e500} />
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                renderItem={renderItem}
                style={[styles.list, { maxHeight: listMaxH }]}
                contentContainerStyle={[styles.listContent, items.length === 0 && styles.listEmptyGrow]}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: dividerColor }]} />}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.e500} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <View style={[styles.emptyIcon, { backgroundColor: `${colors.e500}18` }]}>
                      <Ionicons name="notifications-outline" size={24} color={colors.e600} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.s900 }]}>{t('notificationsEmptyTitle')}</Text>
                    <Text style={[styles.emptySub, { color: colors.s500 }]}>{t('notificationsEmptySub')}</Text>
                  </View>
                }
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.36)',
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  panelInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {},
  listContent: {
    paddingBottom: 8,
  },
  listEmptyGrow: {
    flexGrow: 1,
    minHeight: 220,
  },
  rowTouchable: {
    paddingVertical: 14,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  kindsHint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: -4,
    paddingHorizontal: 2,
  },
  rowLeading: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  iconUnreadWrap: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  typeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCornerDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  itemDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  separator: {
    height: 1,
  },
  emptyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
