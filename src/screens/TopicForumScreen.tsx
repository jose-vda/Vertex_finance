import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Modal, Image } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAcademy } from '../context/AcademyContext';
import type { MainStackParamList } from '../navigation/types';
import { useRequireAcademyAccess } from '../hooks/useRequireAcademyAccess';

type TopicForumRoute = RouteProp<MainStackParamList, 'TopicForum'>;
type TopicForumNav = NativeStackNavigationProp<MainStackParamList>;

const CATEGORY_TITLE_KEY = {
  finance: 'academyFinance',
  investments: 'academyInvestments',
  entrepreneurship: 'academyEntrepreneurship',
} as const;

export default function TopicForumScreen() {
  useRequireAcademyAccess();
  const navigation = useNavigation<TopicForumNav>();
  const route = useRoute<TopicForumRoute>();
  const { colors } = useTheme();
  const { t } = useSettings();
  const { topicsByCategory, commentsByTopicId, createTopic, refreshForum } = useAcademy();

  useFocusEffect(
    useCallback(() => {
      void refreshForum();
    }, [refreshForum])
  );
  const [newTopicVisible, setNewTopicVisible] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'relevant'>('recent');
  const category = route.params.category;
  const topics = topicsByCategory[category] || [];
  const sortedTopics = useMemo(() => {
    const list = [...topics];
    if (sortBy === 'relevant') return list.sort((a, b) => (commentsByTopicId[b.id]?.length || 0) - (commentsByTopicId[a.id]?.length || 0));
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [topics, sortBy, commentsByTopicId]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, { borderColor: colors.s200, backgroundColor: colors.cardBg }, pressed && { opacity: 0.75 }]}>
        <Ionicons name="chevron-back" size={16} color={colors.s700} />
        <Text style={[styles.backText, { color: colors.s700 }]}>{t('back')}</Text>
      </Pressable>

      <View style={[styles.headerCard, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: colors.s900 }]}>{t('academyTopicForumTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.s500 }]}>{t(CATEGORY_TITLE_KEY[category])}</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: `${colors.e500}14` }]}>
            <Text style={[styles.countText, { color: colors.e600 }]}>{topics.length}</Text>
          </View>
        </View>
        <Text style={[styles.headerHint, { color: colors.s500 }]}>{t('academyForumHeaderHint')}</Text>
      </View>

      <Pressable
        onPress={() => setNewTopicVisible(true)}
        style={({ pressed }) => [styles.newTopicBtn, { backgroundColor: colors.e500 }, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={14} color="#fff" />
        <Text style={styles.newTopicText}>{t('academyNewTopic')}</Text>
      </Pressable>

      <View style={[styles.sortBar, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <Pressable onPress={() => setSortBy('recent')} style={[styles.sortBtn, sortBy === 'recent' && { backgroundColor: `${colors.e500}14` }]}>
          <Text style={[styles.sortText, { color: sortBy === 'recent' ? colors.e600 : colors.s500 }]}>{t('academySortRecent')}</Text>
        </Pressable>
        <Pressable onPress={() => setSortBy('relevant')} style={[styles.sortBtn, sortBy === 'relevant' && { backgroundColor: `${colors.e500}14` }]}>
          <Text style={[styles.sortText, { color: sortBy === 'relevant' ? colors.e600 : colors.s500 }]}>{t('academySortRelevant')}</Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedTopics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.s400} />
            <Text style={[styles.empty, { color: colors.s500 }]}>{t('academyNoTopics')}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(50 + index * 40).duration(260)}>
            <Pressable
              onPress={() => navigation.navigate('TopicThread', { topicId: item.id })}
              style={({ pressed }) => [
                styles.commentCard,
                { borderColor: colors.s200, backgroundColor: colors.cardBg },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.commentTop}>
                <View style={styles.authorRow}>
                  {item.authorAvatarUrl ? (
                    <Image source={{ uri: item.authorAvatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: colors.e500 }]}>
                      <Text style={styles.avatarFallbackText}>{item.author?.charAt(0)?.toUpperCase() || 'U'}</Text>
                    </View>
                  )}
                  <Text style={[styles.author, { color: colors.s800 }]}>{item.author}</Text>
                </View>
                <Text style={[styles.time, { color: colors.s400 }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.topicTitle, { color: colors.s900 }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.content, { color: colors.s700 }]} numberOfLines={3}>{item.content || t('academyNoDescription')}</Text>
              <View style={styles.commentActions}>
                <Text style={[styles.actionHint, { color: colors.s400 }]}>{t('academyOpenDiscussion')}</Text>
                <Text style={[styles.actionHint, { color: colors.s400 }]}>{`${commentsByTopicId[item.id]?.length || 0} ${t('academyReplies')}`}</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />

      <Modal visible={newTopicVisible} transparent animationType="slide" onRequestClose={() => setNewTopicVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setNewTopicVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.s900 }]}>{t('academyNewTopic')}</Text>

            <TextInput
              value={newTopicTitle}
              onChangeText={(v) => {
                setNewTopicTitle(v);
                if (titleError) setTitleError('');
              }}
              placeholder={t('academyTopicTitlePlaceholder')}
              placeholderTextColor={colors.s300}
              style={[styles.field, { color: colors.s900, borderColor: colors.s200, backgroundColor: colors.background }]}
            />
            {!!titleError && <Text style={[styles.error, { color: colors.red }]}>{titleError}</Text>}
            <TextInput
              value={newTopicContent}
              onChangeText={setNewTopicContent}
              placeholder={t('academyTopicDescriptionPlaceholder')}
              placeholderTextColor={colors.s300}
              style={[styles.fieldMultiline, { color: colors.s900, borderColor: colors.s200, backgroundColor: colors.background }]}
              multiline
            />
            <Pressable
              onPress={async () => {
                if (!newTopicTitle.trim()) {
                  setTitleError(t('academyTopicTitleRequired'));
                  return;
                }
                const ok = await createTopic(category, newTopicTitle, newTopicContent);
                if (!ok) return;
                setNewTopicTitle('');
                setNewTopicContent('');
                setTitleError('');
                setNewTopicVisible(false);
              }}
              style={[styles.postBtn, { backgroundColor: colors.e500 }]}
            >
              <Text style={styles.postText}>{t('academyCreateTopic')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 10,
  },
  backText: { fontSize: 12, fontWeight: '700' },
  headerCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleWrap: { flex: 1, paddingRight: 8 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 3 },
  countBadge: { minWidth: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { fontSize: 12, fontWeight: '800' },
  headerHint: { fontSize: 12, marginTop: 8 },
  newTopicBtn: {
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newTopicText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  sortBar: { borderWidth: 1, borderRadius: 12, padding: 4, flexDirection: 'row', marginBottom: 8 },
  sortBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  sortText: { fontSize: 11, fontWeight: '700' },
  postBtn: { alignSelf: 'flex-end', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8, marginTop: 8 },
  postText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  listContent: { paddingBottom: 28, gap: 8 },
  emptyCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { fontSize: 12, fontWeight: '600' },
  commentCard: { borderWidth: 1, borderRadius: 12, padding: 11 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB' },
  avatarFallback: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  commentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  topicTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  author: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  time: { fontSize: 10, fontWeight: '600' },
  content: { fontSize: 13, lineHeight: 18 },
  commentActions: { flexDirection: 'row', gap: 14, marginTop: 8 },
  actionHint: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.34)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  modalCard: { width: '100%', maxWidth: 460, borderWidth: 1, borderRadius: 16, padding: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 13 },
  fieldMultiline: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 13, minHeight: 90, textAlignVertical: 'top', marginTop: 8 },
  error: { fontSize: 11, marginTop: 4, fontWeight: '700' },
});
