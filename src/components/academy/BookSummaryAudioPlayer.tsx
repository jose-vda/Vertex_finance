import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Props = {
  audioUri: string;
  title?: string;
};

export default function BookSummaryAudioPlayer({ audioUri, title }: Props) {
  const { colors } = useTheme();
  const { t } = useSettings();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  const unload = useCallback(async () => {
    const s = soundRef.current;
    soundRef.current = null;
    if (s) {
      try {
        await s.unloadAsync();
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setIsLoading(true);
      setPositionMillis(0);
      setDurationMillis(0);
      setIsPlaying(false);
      await unload();

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch {
        /* non-fatal */
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 },
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            setPositionMillis(status.positionMillis ?? 0);
            setDurationMillis(status.durationMillis ?? 0);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPositionMillis(0);
              sound.setPositionAsync(0).catch(() => {});
            }
          }
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {
        if (!cancelled) setError(t('academyAudioError'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      void unload();
    };
  }, [audioUri, unload, t]);

  const toggle = async () => {
    const s = soundRef.current;
    if (!s || isLoading || error) return;
    try {
      const status = await s.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) await s.pauseAsync();
      else await s.playAsync();
    } catch {
      setError(t('academyAudioError'));
    }
  };

  const progress = durationMillis > 0 ? Math.min(1, positionMillis / durationMillis) : 0;

  return (
    <View style={[styles.wrap, { borderColor: colors.s200, backgroundColor: colors.cardBg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.s800 }]}>{t('academyListenSummary')}</Text>
        <Pressable
          onPress={() => {}}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.65 }]}
          accessibilityRole="button"
          accessibilityLabel={t('academyDownloadAudioOffline')}
        >
          <Ionicons name="download-outline" size={20} color={colors.e600} />
        </Pressable>
      </View>
      {error ? (
        <Text style={[styles.err, { color: colors.red }]}>{error}</Text>
      ) : (
        <>
          <View style={styles.row}>
            <Pressable
              onPress={toggle}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.playBtn,
                { backgroundColor: colors.e500 },
                (isLoading || pressed) && { opacity: isLoading ? 0.55 : 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={title ? `${t('academyListenSummary')}: ${title}` : t('academyListenSummary')}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" style={isPlaying ? undefined : { marginLeft: 3 }} />
              )}
            </Pressable>
            <View style={styles.trackCol}>
              <View style={[styles.track, { backgroundColor: colors.s200 }]}>
                <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.e500 }]} />
              </View>
              <Text style={[styles.time, { color: colors.s500 }]}>
                {formatMs(positionMillis)} / {formatMs(durationMillis)}
              </Text>
            </View>
          </View>
          {isLoading ? <Text style={[styles.hint, { color: colors.s400 }]}>{t('academyAudioLoading')}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  label: { fontSize: 14, fontWeight: '800', flex: 1 },
  headerIconBtn: { padding: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  trackCol: { flex: 1, gap: 4 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  time: { fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 11, marginTop: 6 },
  err: { fontSize: 12, fontWeight: '600' },
});
