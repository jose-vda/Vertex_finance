import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import type { MainStackParamList } from '../navigation/types';
import { getBooksByCategory, getReadableBookSummary, type AcademyBook, type AcademyBookLevel, type AcademyBookLanguage } from '../data/academyBooks';
import { useAcademy } from '../context/AcademyContext';
import BookSummaryAudioPlayer from '../components/academy/BookSummaryAudioPlayer';
import { useRequireAcademyAccess } from '../hooks/useRequireAcademyAccess';

type BookListRoute = RouteProp<MainStackParamList, 'BookList'>;
type BookListNavigation = NativeStackNavigationProp<MainStackParamList>;

const CATEGORY_META: Record<'finance' | 'investments' | 'entrepreneurship', { titleKey: string; subtitleKey: string; icon: keyof typeof Ionicons.glyphMap }> = {
  finance: { titleKey: 'academyFinance', subtitleKey: 'academyBooksFinanceSubtitle', icon: 'wallet-outline' },
  investments: { titleKey: 'academyInvestments', subtitleKey: 'academyBooksInvestmentsSubtitle', icon: 'trending-up-outline' },
  entrepreneurship: { titleKey: 'academyEntrepreneurship', subtitleKey: 'academyBooksEntrepreneurshipSubtitle', icon: 'rocket-outline' },
};

export default function BookListScreen() {
  useRequireAcademyAccess();
  const navigation = useNavigation<BookListNavigation>();
  const { colors } = useTheme();
  const { t, locale } = useSettings();
  const { readingStatusByBook, favorites } = useAcademy();
  const route = useRoute<BookListRoute>();
  const [selectedBook, setSelectedBook] = useState<AcademyBook | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'all' | AcademyBookLevel>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | AcademyBookLanguage>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating'>('popularity');
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const category = route.params.category;
  const meta = CATEGORY_META[category];
  const books = useMemo(() => {
    let base = getBooksByCategory(category);
    if (levelFilter !== 'all') base = base.filter((book) => book.level === levelFilter);
    if (languageFilter !== 'all') base = base.filter((book) => book.language === languageFilter);
    if (durationFilter !== 'all') {
      base = base.filter((book) => {
        if (durationFilter === 'short') return book.durationHours <= 6;
        if (durationFilter === 'medium') return book.durationHours > 6 && book.durationHours <= 9;
        return book.durationHours > 9;
      });
    }
    if (minRating > 0) base = base.filter((book) => book.rating >= minRating);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter((book) => {
        const pt = book.title.toLowerCase();
        const en = (book.titleEn ?? '').toLowerCase();
        return pt.includes(q) || en.includes(q);
      });
    }
    return [...base].sort((a, b) => (sortBy === 'popularity' ? b.popularity - a.popularity : b.rating - a.rating));
  }, [category, levelFilter, languageFilter, durationFilter, sortBy, minRating, searchQuery]);
  const filterOptions: Array<{ key: 'all' | AcademyBookLevel; labelKey: string }> = [
    { key: 'all', labelKey: 'academyLevelAll' },
    { key: 'Beginner', labelKey: 'academyLevelBeginner' },
    { key: 'Intermediate', labelKey: 'academyLevelIntermediate' },
    { key: 'Advanced', labelKey: 'academyLevelAdvanced' },
  ];
  const levelLabel: Record<AcademyBookLevel, string> = {
    Beginner: t('academyLevelBeginner'),
    Intermediate: t('academyLevelIntermediate'),
    Advanced: t('academyLevelAdvanced'),
  };
  const durationOptions: Array<{ key: 'all' | 'short' | 'medium' | 'long'; labelKey: string }> = [
    { key: 'all', labelKey: 'academyDurationAll' },
    { key: 'short', labelKey: 'academyDurationShort' },
    { key: 'medium', labelKey: 'academyDurationMedium' },
    { key: 'long', labelKey: 'academyDurationLong' },
  ];
  const languageOptions: Array<{ key: 'all' | AcademyBookLanguage; label: string }> = [
    { key: 'all', label: t('academyLanguageAll') },
    { key: 'EN', label: 'EN' },
    { key: 'PT', label: 'PT' },
  ];
  const statusLabel: Record<string, string> = {
    want: t('academyListWant'),
    reading: t('academyListReading'),
    done: t('academyListDone'),
  };
  const getDisplayTitle = (book: AcademyBook) => (locale === 'pt' ? book.title : (book.titleEn ?? book.title));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, { borderColor: colors.s200, backgroundColor: colors.cardBg }, pressed && { opacity: 0.75 }]}>
        <Ionicons name="chevron-back" size={16} color={colors.s700} />
        <Text style={[styles.backText, { color: colors.s700 }]}>{t('back')}</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.e50 }]}>
          <Ionicons name={meta.icon} size={20} color={colors.e500} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.s900 }]}>{t(meta.titleKey)}</Text>
          <Text style={[styles.subtitle, { color: colors.s500 }]}>{t(meta.subtitleKey)}</Text>
        </View>
      </View>

      <View style={[styles.searchBar, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
        <Ionicons name="search-outline" size={18} color={colors.s400} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('academyBooksSearchPlaceholder')}
          placeholderTextColor={colors.s300}
          style={[styles.searchInput, { color: colors.s900 }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8} style={styles.searchClear}>
            <Ionicons name="close-circle" size={18} color={colors.s400} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={() => setShowFilters((prev) => !prev)}
        style={({ pressed }) => [
          styles.filterToggleBtn,
          { borderColor: colors.s200, backgroundColor: colors.cardBg },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.filterToggleLeft}>
          <Ionicons name="options-outline" size={14} color={colors.s700} />
          <Text style={[styles.filterToggleText, { color: colors.s700 }]}>{t('academyFilters')}</Text>
        </View>
        <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={14} color={colors.s500} />
      </Pressable>

      {showFilters ? (
        <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutUp.duration(220)}>
          <View style={[styles.filterBar, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
            {filterOptions.map((option) => {
              const selected = levelFilter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setLevelFilter(option.key)}
                  style={({ pressed }) => [
                    styles.filterPill,
                    selected && { backgroundColor: `${colors.e500}14` },
                    pressed && !selected && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.filterText, { color: selected ? colors.e600 : colors.s500 }]} numberOfLines={1}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.filterRow}>
            <View style={[styles.miniBar, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
              {durationOptions.map((option) => {
                const selected = durationFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setDurationFilter(option.key)}
                    style={[styles.miniPill, selected && { backgroundColor: `${colors.e500}14` }]}
                  >
                    <Text style={[styles.miniText, { color: selected ? colors.e600 : colors.s500 }]}>{t(option.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={[styles.miniBar, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
              {languageOptions.map((option) => {
                const selected = languageFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setLanguageFilter(option.key)}
                    style={[styles.miniPill, selected && { backgroundColor: `${colors.e500}14` }]}
                  >
                    <Text style={[styles.miniText, { color: selected ? colors.e600 : colors.s500 }]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.sortWrap, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
              <Pressable onPress={() => setSortBy('popularity')} style={[styles.sortBtn, sortBy === 'popularity' && { backgroundColor: `${colors.e500}14` }]}>
                <Text style={[styles.miniText, { color: sortBy === 'popularity' ? colors.e600 : colors.s500 }]}>{t('academySortPopularity')}</Text>
              </Pressable>
              <Pressable onPress={() => setSortBy('rating')} style={[styles.sortBtn, sortBy === 'rating' && { backgroundColor: `${colors.e500}14` }]}>
                <Text style={[styles.miniText, { color: sortBy === 'rating' ? colors.e600 : colors.s500 }]}>{t('academySortRating')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.ratingBar, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
            {[0, 4, 4.5].map((value) => {
              const selected = minRating === value;
              return (
                <Pressable
                  key={String(value)}
                  onPress={() => setMinRating(value)}
                  style={[styles.ratingBtn, selected && { backgroundColor: `${colors.e500}14` }]}
                >
                  <Text style={[styles.miniText, { color: selected ? colors.e600 : colors.s500 }]}>
                    {value === 0 ? t('academyRatingAny') : `${value}+`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
            <Ionicons name="library-outline" size={18} color={colors.s400} />
            <Text style={[styles.emptyText, { color: colors.s500 }]}>
              {searchQuery.trim() ? t('academyBooksSearchEmpty') : t('academyNoBooks')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(60 + index * 50).duration(280)}>
            <Pressable
              onPress={() => setSelectedBook(item)}
              style={({ pressed }) => [
                styles.bookCard,
                { borderColor: colors.s200, backgroundColor: colors.cardBg },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.cover, { backgroundColor: `${colors.e500}14` }]}>
                <Ionicons name="book-outline" size={16} color={colors.e600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookTitle, { color: colors.s900 }]} numberOfLines={2}>{getDisplayTitle(item)}</Text>
                <Text style={[styles.bookAuthor, { color: colors.s500 }]} numberOfLines={1}>
                  {item.author} · {item.durationHours}h · {item.language}
                </Text>
                {!!readingStatusByBook[item.id] && readingStatusByBook[item.id] !== 'none' && (
                  <Text style={[styles.badgeText, { color: colors.e600 }]}>{statusLabel[readingStatusByBook[item.id]]}</Text>
                )}
              </View>
              <View style={[styles.levelTag, { backgroundColor: `${colors.e500}12` }]}>
                <Text style={[styles.levelText, { color: colors.e600 }]}>{levelLabel[item.level]}</Text>
              </View>
              {favorites[item.id] ? <Ionicons name="heart" size={14} color={colors.e500} /> : null}
            </Pressable>
          </Animated.View>
        )}
      />

      <Pressable
        onPress={() => navigation.navigate('TopicForum', { category })}
        style={({ pressed }) => [
          styles.stickyForumBtn,
          { backgroundColor: colors.e500 },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons name="chatbubbles-outline" size={15} color="#fff" />
        <Text style={styles.stickyForumText}>{t('academyTopicForumButton')}</Text>
      </Pressable>

      <Modal visible={!!selectedBook} transparent animationType="slide" onRequestClose={() => setSelectedBook(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBook(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]} onPress={(e) => e.stopPropagation()}>
            {selectedBook ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.modalHero, { backgroundColor: `${colors.e500}12` }]}>
                  <Ionicons name="book-outline" size={34} color={colors.e600} />
                  <View style={styles.heroShapes}>
                    <View style={[styles.shape, { backgroundColor: `${colors.e500}24` }]} />
                    <View style={[styles.shapeSmall, { backgroundColor: `${colors.e500}35` }]} />
                  </View>
                </View>
                <Text style={[styles.modalTitle, { color: colors.s900 }]}>{getDisplayTitle(selectedBook)}</Text>
                <Text style={[styles.modalMeta, { color: colors.s500 }]}>{selectedBook.author} · {selectedBook.durationHours}h · {selectedBook.language}</Text>

                {selectedBook.summaryAudioUrl?.trim() ? (
                  <BookSummaryAudioPlayer
                    key={selectedBook.id}
                    audioUri={selectedBook.summaryAudioUrl.trim()}
                    title={getDisplayTitle(selectedBook)}
                  />
                ) : null}

                <View style={styles.modalSectionRow}>
                  <Text style={[styles.modalSection, { color: colors.s800, marginBottom: 0, marginTop: 0, flex: 1 }]}>
                    {t('academySummaryTitle')}
                  </Text>
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
                <Text style={[styles.modalSummary, { color: colors.s500 }]}>
                  {selectedBook.summary?.trim() ? getReadableBookSummary(selectedBook) : t('academySummaryPending')}
                </Text>

                <Text style={[styles.modalSection, { color: colors.s800 }]}>{t('academyTopicsTitle')}</Text>
                <View style={styles.topicRow}>
                  {selectedBook.topics.length > 0 ? (
                    selectedBook.topics.map((topic) => (
                      <View key={topic} style={[styles.topicPill, { backgroundColor: `${colors.e500}12` }]}>
                        <Text style={[styles.topicText, { color: colors.e600 }]}>{topic}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.modalSummary, { color: colors.s500 }]}>{t('academyTopicsPending')}</Text>
                  )}
                </View>
              </ScrollView>
            ) : null}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, minHeight: 22 },
  searchClear: { padding: 2 },
  filterBar: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  filterText: { fontSize: 10, fontWeight: '700' },
  filterToggleBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterToggleText: { fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  miniBar: { borderWidth: 1, borderRadius: 10, padding: 3, flexDirection: 'row', flex: 1 },
  miniPill: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  miniText: { fontSize: 10, fontWeight: '700' },
  sortWrap: { borderWidth: 1, borderRadius: 10, padding: 3, flexDirection: 'row', width: 150 },
  sortBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  ratingBar: { borderWidth: 1, borderRadius: 10, padding: 3, marginBottom: 10, flexDirection: 'row' },
  ratingBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  listContent: { paddingBottom: 98, gap: 8 },
  bookCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cover: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 13, fontWeight: '700' },
  bookAuthor: { fontSize: 12, marginTop: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', marginTop: 3 },
  levelTag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  levelText: { fontSize: 10, fontWeight: '700' },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 12, fontWeight: '600' },
  stickyForumBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    borderRadius: 13,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  stickyForumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    maxHeight: '82%',
  },
  modalHero: {
    height: 130,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  heroShapes: { position: 'absolute', right: 10, bottom: 10 },
  shape: { width: 70, height: 16, borderRadius: 999, marginBottom: 6 },
  shapeSmall: { width: 44, height: 12, borderRadius: 999, alignSelf: 'flex-end' },
  modalTitle: { fontSize: 21, fontWeight: '800' },
  modalMeta: { fontSize: 14, marginTop: 3, marginBottom: 10 },
  modalSection: { fontSize: 15, fontWeight: '800', marginTop: 10, marginBottom: 5 },
  modalSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    marginBottom: 5,
  },
  summaryPdfIconBtn: { padding: 4 },
  modalSummary: { fontSize: 16, lineHeight: 24 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  topicPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  topicText: { fontSize: 12, fontWeight: '700' },
});
