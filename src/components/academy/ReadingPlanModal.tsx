import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useAcademy } from '../../context/AcademyContext';
import type { AcademyBook, AcademyBookCategory } from '../../data/academyBooks';
import { getReadableBookSummary } from '../../data/academyBooks';

type Props = {
  visible: boolean;
  onClose: () => void;
  books: AcademyBook[];
  onOpenBook: (bookId: string) => void;
};

const CATEGORY_KEYS: Record<AcademyBookCategory, 'academyFinance' | 'academyInvestments' | 'academyEntrepreneurship'> = {
  finance: 'academyFinance',
  investments: 'academyInvestments',
  entrepreneurship: 'academyEntrepreneurship',
};

/** Badges por categoria: apenas gradientes em família verde (tons distintos). */
const CATEGORY_GRADIENT: Record<AcademyBookCategory, readonly [string, string]> = {
  finance: ['#064E3B', '#059669'],
  investments: ['#047857', '#34D399'],
  entrepreneurship: ['#065F46', '#6EE7B7'],
};

export default function ReadingPlanModal({ visible, onClose, books, onOpenBook }: Props) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useSettings();
  const { readingStatusByBook, setReadingStatus } = useAcademy();

  const doneCount = useMemo(
    () => books.filter((b) => readingStatusByBook[b.id] === 'done').length,
    [books, readingStatusByBook]
  );

  const getTitle = (book: AcademyBook) => (locale === 'pt' ? book.title : (book.titleEn ?? book.title));

  const toggleDone = (bookId: string) => {
    const cur = readingStatusByBook[bookId];
    setReadingStatus(bookId, cur === 'done' ? 'none' : 'done');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.cardBg }]} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={isDark ? ['#022C22', '#064E3B'] : ['#065F46', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroKicker}>{t('academyReadingPlanModalKicker')}</Text>
                <Text style={styles.heroTitle}>{t('academyReadingPlanModalTitle')}</Text>
                <Text style={styles.heroSubtitle}>{t('academyReadingPlanModalSubtitle')}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeFab}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressRingOuter}>
                <Text style={styles.progressBig}>{doneCount}</Text>
                <Text style={styles.progressSlash}>/</Text>
                <Text style={styles.progressBig}>{books.length}</Text>
              </View>
              <Text style={styles.progressCaption}>{t('academyReadingPlanBooksDone')}</Text>
              <View style={styles.dotsRow}>
                {books.map((b) => {
                  const done = readingStatusByBook[b.id] === 'done';
                  return <View key={b.id} style={[styles.dot, done ? styles.dotOn : styles.dotOff]} />;
                })}
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.sectionHead, { borderBottomColor: colors.s200 }]}>
            <Ionicons name="rocket-outline" size={18} color={colors.e600} />
            <Text style={[styles.sectionTitle, { color: colors.s800 }]}>{t('academyReadingPlanJourneyTitle')}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {books.map((book, index) => {
              const done = readingStatusByBook[book.id] === 'done';
              const grad = CATEGORY_GRADIENT[book.category];
              const fullSummary = getReadableBookSummary(book);
              const preview = fullSummary.slice(0, 140);
              const hasMore = fullSummary.length > 140;

              return (
                <View
                  key={book.id}
                  style={[
                    styles.bookCard,
                    {
                      backgroundColor: isDark ? `${colors.s100}CC` : '#FFFFFF',
                      borderColor: done ? `${grad[0]}55` : colors.s200,
                    },
                  ]}
                >
                  <View style={styles.bookCardTop}>
                    <LinearGradient colors={grad} style={styles.indexBadge}>
                      <Text style={styles.indexBadgeText}>{index + 1}</Text>
                    </LinearGradient>
                    <View style={styles.bookCardMain}>
                      <View style={styles.titleRow}>
                        <Pressable
                          onPress={() => onOpenBook(book.id)}
                          style={styles.titlePress}
                          accessibilityRole="button"
                          accessibilityLabel={t('academyReadingPlanOpenBook')}
                        >
                          <Text style={[styles.bookTitle, { color: colors.s900 }]} numberOfLines={2}>
                            {getTitle(book)}
                          </Text>
                          <Text style={[styles.bookAuthor, { color: colors.s500 }]} numberOfLines={1}>
                            {book.author}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => toggleDone(book.id)}
                          style={[
                            styles.checkBtn,
                            {
                              borderColor: done ? grad[0] : colors.s300,
                              backgroundColor: done ? `${grad[0]}22` : 'transparent',
                            },
                          ]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: done }}
                          accessibilityLabel={t('academyReadingPlanToggleRead')}
                        >
                          <Ionicons name={done ? 'checkmark' : 'square-outline'} size={done ? 20 : 18} color={done ? grad[0] : colors.s400} />
                        </Pressable>
                      </View>
                      <LinearGradient colors={[`${grad[0]}18`, `${grad[1]}10`]} style={styles.categoryChip}>
                        <Text style={[styles.categoryChipText, { color: grad[0] }]}>
                          {t(CATEGORY_KEYS[book.category])}
                        </Text>
                      </LinearGradient>
                      {preview.trim() ? (
                        <Text style={[styles.preview, { color: colors.s500 }]} numberOfLines={3}>
                          {preview}
                          {hasMore ? '…' : ''}
                        </Text>
                      ) : null}
                      <Pressable
                        onPress={() => onOpenBook(book.id)}
                        style={({ pressed }) => [
                          styles.openCta,
                          { borderColor: `${grad[0]}44`, backgroundColor: `${grad[0]}10` },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={[styles.openCtaText, { color: grad[0] }]}>{t('academyReadingPlanSeeSummary')}</Text>
                        <Ionicons name="arrow-forward" size={16} color={grad[0]} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6,8,20,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 26,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  hero: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroTitleBlock: { flex: 1 },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 6,
  },
  closeFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: { marginTop: 16, alignItems: 'center' },
  progressRingOuter: { flexDirection: 'row', alignItems: 'baseline' },
  progressBig: { fontSize: 36, fontWeight: '900', color: '#fff' },
  progressSlash: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginHorizontal: 2 },
  progressCaption: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  dotsRow: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 0 },
  dotOn: { backgroundColor: '#fff' },
  dotOff: { backgroundColor: 'rgba(255,255,255,0.28)' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  scroll: { maxHeight: 360 },
  scrollContent: { padding: 14, paddingBottom: 22, gap: 12 },
  bookCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
  },
  bookCardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  bookCardMain: { flex: 1, minWidth: 0, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titlePress: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  bookAuthor: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  preview: { fontSize: 12, lineHeight: 17 },
  openCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  openCtaText: { fontSize: 12, fontWeight: '800' },
});
