import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAcademy, type ReadingStatus } from '../context/AcademyContext';
import { getBookById, getReadableBookSummary } from '../data/academyBooks';
import BookSummaryAudioPlayer from '../components/academy/BookSummaryAudioPlayer';
import type { MainStackParamList } from '../navigation/types';
import { useRequireAcademyAccess } from '../hooks/useRequireAcademyAccess';

type BookDetailRoute = RouteProp<MainStackParamList, 'BookDetail'>;
type BookDetailNav = NativeStackNavigationProp<MainStackParamList>;

export default function BookDetailScreen() {
  useRequireAcademyAccess();
  const navigation = useNavigation<BookDetailNav>();
  const route = useRoute<BookDetailRoute>();
  const { colors } = useTheme();
  const { t, locale } = useSettings();
  const { readingStatusByBook, favorites, setReadingStatus, toggleFavorite } = useAcademy();
  const book = useMemo(() => getBookById(route.params.bookId), [route.params.bookId]);

  if (!book) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.s500 }}>{t('academyBookNotFound')}</Text>
      </View>
    );
  }

  const status = readingStatusByBook[book.id] || 'none';
  const actions: Array<{ key: ReadingStatus; labelKey: string }> = [
    { key: 'want', labelKey: 'academyListWant' },
    { key: 'reading', labelKey: 'academyListReading' },
    { key: 'done', labelKey: 'academyListDone' },
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, { borderColor: colors.s200, backgroundColor: colors.cardBg }, pressed && { opacity: 0.75 }]}>
        <Ionicons name="chevron-back" size={16} color={colors.s700} />
        <Text style={[styles.backText, { color: colors.s700 }]}>{t('back')}</Text>
      </Pressable>

      <View style={[styles.hero, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${colors.e500}14` }]}>
          <Ionicons name="book-outline" size={24} color={colors.e600} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.s900 }]}>{book.title}</Text>
          <Text style={[styles.meta, { color: colors.s500 }]}>{book.author} · {book.durationHours}h · {book.language}</Text>
          <Text style={[styles.meta, { color: colors.s500 }]}>{t('academyLevelLabel')}: {book.level} · {t('academyRatingLabel')}: {book.rating}</Text>
        </View>
      </View>

      {book.summaryAudioUrl?.trim() ? (
        <BookSummaryAudioPlayer
          key={book.id}
          audioUri={book.summaryAudioUrl.trim()}
          title={locale === 'pt' ? book.title : (book.titleEn ?? book.title)}
        />
      ) : null}

      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.s800, marginBottom: 0, flex: 1 }]}>{t('academySummaryTitle')}</Text>
        <Pressable
          onPress={() => {}}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.summaryPdfIconBtn, pressed && { opacity: 0.65 }]}
          accessibilityRole="button"
          accessibilityLabel={t('academyDownloadSummaryPdf')}
        >
          <Ionicons name="document-text-outline" size={19} color={colors.e600} />
        </Pressable>
      </View>
      <Text style={[styles.summary, { color: colors.s500 }]}>
        {book.summary?.trim() ? getReadableBookSummary(book) : t('academySummaryPending')}
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.s800 }]}>{t('academyTopicsTitle')}</Text>
      <View style={styles.topicsRow}>
        {book.topics.map((topic) => (
          <View key={topic} style={[styles.topicPill, { backgroundColor: `${colors.e500}12` }]}>
            <Text style={[styles.topicText, { color: colors.e600 }]}>{topic}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.s800 }]}>{t('academyReadingListsTitle')}</Text>
      <View style={styles.actionsRow}>
        {actions.map((action) => {
          const selected = status === action.key;
          return (
            <Pressable
              key={action.key}
              onPress={() => setReadingStatus(book.id, action.key)}
              style={[styles.actionBtn, { borderColor: colors.s200, backgroundColor: selected ? `${colors.e500}14` : colors.cardBg }]}
            >
              <Text style={[styles.actionText, { color: selected ? colors.e600 : colors.s500 }]}>{t(action.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={() => toggleFavorite(book.id)} style={[styles.favoriteBtn, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <Ionicons name={favorites[book.id] ? 'heart' : 'heart-outline'} size={16} color={colors.e500} />
        <Text style={[styles.favoriteText, { color: colors.s700 }]}>
          {favorites[book.id] ? t('academyFavorited') : t('academyAddFavorite')}
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.s800 }]}>{t('academyDiscussionTitle')}</Text>
      <Text style={[styles.summary, { color: colors.s500 }]}>{t('academyDiscussionMovedToTopic')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 32 },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 12,
  },
  backText: { fontSize: 12, fontWeight: '700' },
  hero: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10 },
  heroIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  summary: { fontSize: 13, lineHeight: 18 },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  topicText: { fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 7 },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  actionText: { fontSize: 11, fontWeight: '700' },
  favoriteBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  favoriteText: { fontSize: 12, fontWeight: '700' },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  summaryPdfIconBtn: { padding: 4 },
});
