import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Image } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAcademy } from '../context/AcademyContext';
import { useAuth } from '../context/AuthContext';
import type { MainStackParamList } from '../navigation/types';
import type { TopicComment } from '../types/academyForum';
import { useRequireAcademyAccess } from '../hooks/useRequireAcademyAccess';

type TopicThreadRoute = RouteProp<MainStackParamList, 'TopicThread'>;
type TopicThreadNav = NativeStackNavigationProp<MainStackParamList>;

export default function TopicThreadScreen() {
  useRequireAcademyAccess();
  const navigation = useNavigation<TopicThreadNav>();
  const route = useRoute<TopicThreadRoute>();
  const { colors } = useTheme();
  const { t } = useSettings();
  const { user } = useAuth();
  const { topicsByCategory, getTopicComments, addCommentToTopic, addReplyToComment, toggleCommentReaction, refreshForum } =
    useAcademy();

  useFocusEffect(
    useCallback(() => {
      void refreshForum();
    }, [refreshForum])
  );
  const [reply, setReply] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [inlineReply, setInlineReply] = useState('');
  const [expandedByParent, setExpandedByParent] = useState<Record<string, boolean>>({});
  const topicId = route.params.topicId;

  const topic = useMemo(() => {
    const all = [...topicsByCategory.finance, ...topicsByCategory.investments, ...topicsByCategory.entrepreneurship];
    return all.find((x) => x.id === topicId);
  }, [topicId, topicsByCategory]);
  const comments = getTopicComments(topicId);
  const rootComments = useMemo(
    () =>
      comments
        .filter((comment: TopicComment) => !comment.parentCommentId)
        .sort((a: TopicComment, b: TopicComment) => (a.createdAt < b.createdAt ? 1 : -1)),
    [comments]
  );
  const repliesByParentId = useMemo(() => {
    const map: Record<string, TopicComment[]> = {};
    comments
      .filter((comment: TopicComment) => !!comment.parentCommentId)
      .forEach((comment: TopicComment) => {
        const parentId = comment.parentCommentId as string;
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(comment);
      });
    Object.keys(map).forEach((key) =>
      map[key].sort((a: TopicComment, b: TopicComment) => (a.createdAt < b.createdAt ? 1 : -1))
    );
    return map;
  }, [comments]);

  if (!topic) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.s500 }}>{t('academyTopicNotFound')}</Text>
      </View>
    );
  }

  const submitRootComment = async () => {
    const ok = await addCommentToTopic(topicId, reply);
    if (ok) setReply('');
  };

  const submitInlineReply = async (commentId: string) => {
    const ok = await addReplyToComment(topicId, commentId, inlineReply);
    if (ok) {
      setInlineReply('');
      setReplyToCommentId(null);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, { borderColor: colors.s200, backgroundColor: colors.cardBg }, pressed && { opacity: 0.75 }]}>
        <Ionicons name="chevron-back" size={16} color={colors.s700} />
        <Text style={[styles.backText, { color: colors.s700 }]}>{t('back')}</Text>
      </Pressable>

      <View style={[styles.topicCard, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <Text style={[styles.topicTitle, { color: colors.s900 }]}>{topic.title}</Text>
        <View style={styles.topicMetaRow}>
          {topic.authorAvatarUrl ? (
            <Image source={{ uri: topic.authorAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.e500 }]}>
              <Text style={styles.avatarFallbackText}>{topic.author?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          )}
          <Text style={[styles.topicMeta, { color: colors.s500 }]}>{topic.author} · {new Date(topic.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.topicContent, { color: colors.s700 }]}>{topic.content || t('academyNoDescription')}</Text>
      </View>

      <FlatList
        data={rootComments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.s500 }]}>{t('academyNoTopicComments')}</Text>}
        renderItem={({ item }) => {
          const renderComment = (comment: typeof item, depth: number) => {
            const children = repliesByParentId[comment.id] || [];
            const canReplyHere = replyToCommentId === comment.id;
            const reactionEntries = Object.entries(comment.reactions || {}).filter(
              ([, actors]) => (actors as string[]).length > 0
            );
            return (
              <View key={comment.id} style={[styles.commentBlock, depth > 0 && styles.replyBlock]}>
                <View style={[styles.commentCard, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
                  <View style={styles.commentAuthorRow}>
                    {comment.authorAvatarUrl ? (
                      <Image source={{ uri: comment.authorAvatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: colors.e500 }]}>
                        <Text style={styles.avatarFallbackText}>{comment.author?.charAt(0)?.toUpperCase() || 'U'}</Text>
                      </View>
                    )}
                    <Text style={[styles.commentAuthor, { color: colors.s800 }]}>{comment.author}</Text>
                  </View>
                  <Text style={[styles.commentContent, { color: colors.s700 }]}>{comment.content}</Text>

                  <View style={styles.commentActionsRow}>
                    <Pressable
                      onPress={() => setReplyToCommentId((prev) => (prev === comment.id ? null : comment.id))}
                      style={[styles.actionPill, { borderColor: colors.s200, backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.actionPillText, { color: colors.s700 }]}>{t('academyReplyPlaceholder')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleCommentReaction(topicId, comment.id, 'like')}
                      style={[styles.actionPill, { borderColor: colors.s200, backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.actionPillText, { color: colors.s700 }]}>
                        {`${t('academyLikePlaceholder')} ${comment.reactions.like?.length || 0}`}
                      </Text>
                    </Pressable>
                    {['👍', '❤️', '🔥'].map((emoji) => {
                      const count = comment.reactions[emoji]?.length || 0;
                      const reactedByMe = !!user?.id && (comment.reactions[emoji] || []).includes(user.id);
                      return (
                        <Pressable
                          key={`${comment.id}-${emoji}`}
                          onPress={() => toggleCommentReaction(topicId, comment.id, emoji)}
                          style={[
                            styles.emojiPill,
                            {
                              borderColor: reactedByMe ? colors.e500 : colors.s200,
                              backgroundColor: reactedByMe ? `${colors.e500}14` : colors.background,
                            },
                          ]}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                          {count > 0 ? <Text style={[styles.emojiCount, { color: colors.s700 }]}>{count}</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  {canReplyHere ? (
                    <Animated.View
                      entering={FadeInDown.duration(180)}
                      exiting={FadeOutUp.duration(140)}
                      style={[styles.inlineReplyBox, { borderColor: colors.s200, backgroundColor: colors.background }]}
                    >
                      <TextInput
                        value={inlineReply}
                        onChangeText={setInlineReply}
                        placeholder={t('academyReplyPlaceholder')}
                        placeholderTextColor={colors.s300}
                        style={[styles.inlineReplyInput, { color: colors.s900 }]}
                        returnKeyType="send"
                        onSubmitEditing={() => submitInlineReply(comment.id)}
                      />
                      <Pressable
                        onPress={() => submitInlineReply(comment.id)}
                        style={[styles.inlineReplyBtn, { backgroundColor: colors.e500 }]}
                      >
                        <Text style={styles.inlineReplyBtnText}>{t('academyPost')}</Text>
                      </Pressable>
                    </Animated.View>
                  ) : null}

                  {children.length > 0 ? (
                    <Pressable
                      onPress={() =>
                        setExpandedByParent((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                      }
                      style={[styles.expandBtn, { backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.expandBtnText, { color: colors.e600 }]}>
                        {expandedByParent[comment.id]
                          ? t('academyHideComments')
                          : `${t('academyViewComments')} (${children.length})`}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {children.length > 0 && expandedByParent[comment.id] ? (
                  <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(180)} style={styles.childrenWrap}>
                    {children.map((child: TopicComment) => renderComment(child, depth + 1))}
                  </Animated.View>
                ) : null}
              </View>
            );
          };
          return renderComment(item, 0);
        }}
      />

      <View style={[styles.replyBox, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <TextInput
          value={reply}
          onChangeText={setReply}
          placeholder={t('academyReplyPlaceholder')}
          placeholderTextColor={colors.s300}
          style={[styles.replyInput, { color: colors.s900 }]}
          returnKeyType="send"
          onSubmitEditing={submitRootComment}
        />
        <Pressable
          onPress={submitRootComment}
          style={[styles.replyBtn, { backgroundColor: colors.e500 }]}
        >
          <Text style={styles.replyBtnText}>{t('academyPost')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  topicCard: { borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 10 },
  topicTitle: { fontSize: 15, fontWeight: '800' },
  topicMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  topicMeta: { fontSize: 11, marginTop: 3 },
  topicContent: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  listContent: { paddingBottom: 86, gap: 8 },
  empty: { fontSize: 12 },
  commentBlock: { marginBottom: 8 },
  replyBlock: { marginLeft: 18 },
  commentCard: { borderWidth: 1, borderRadius: 18, padding: 11 },
  childrenWrap: { marginTop: 6 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  commentAuthor: { fontSize: 11, fontWeight: '700' },
  commentContent: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  commentActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  actionPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  actionPillText: { fontSize: 10, fontWeight: '700' },
  emojiPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  emojiText: { fontSize: 12 },
  emojiCount: { fontSize: 10, fontWeight: '700' },
  inlineReplyBox: { borderWidth: 1, borderRadius: 10, marginTop: 8, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineReplyInput: { flex: 1, minHeight: 34, fontSize: 12 },
  inlineReplyBtn: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  inlineReplyBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  expandBtn: { marginTop: 7, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  expandBtnText: { fontSize: 10, fontWeight: '700' },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB' },
  avatarFallback: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  replyBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyInput: { flex: 1, fontSize: 13, minHeight: 36 },
  replyBtn: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  replyBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
