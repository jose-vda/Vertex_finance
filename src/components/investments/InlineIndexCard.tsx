import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';

type InlinePoint = { value: number; date: string; label: string; labelTextStyle: any };
type InlineStats = { positive: boolean; pct: number; high: number; low: number } | null;
type Period = { key: string; days: number };

type Props = {
  visible: boolean;
  periods: readonly Period[];
  selectedPeriod: string;
  onChangePeriod: (key: string) => void;
  loading: boolean;
  data: InlinePoint[];
  stats: InlineStats;
  color: string;
  colors: any;
  t: (k: string) => string;
  fmt: (v: number) => string;
};

export function InlineIndexCard({
  visible,
  periods,
  selectedPeriod,
  onChangePeriod,
  loading,
  data,
  stats,
  color,
  colors,
  t,
  fmt,
}: Props) {
  if (!visible) return null;
  const screenWidth = Dimensions.get('window').width;
  const maxPrice = data.length ? Math.max(...data.map((d) => d.value)) : 0;
  const minPrice = data.length ? Math.min(...data.map((d) => d.value)) : 0;
  const range = maxPrice - minPrice || 1;
  const spacing = (screenWidth - 120) / Math.max(1, data.length - 1);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.s200 }]}>
      <View style={styles.periodsRow}>
        {periods.map((period) => {
          const isActive = selectedPeriod === period.key;
          return (
            <TouchableOpacity
              key={period.key}
              activeOpacity={0.8}
              onPress={() => onChangePeriod(period.key)}
              style={[
                styles.periodBtn,
                { borderColor: colors.s200, backgroundColor: colors.s50 },
                isActive && { backgroundColor: color, borderColor: color },
              ]}
            >
              <Text style={[styles.periodBtnText, { color: isActive ? '#fff' : colors.s500 }]}>{t(`chart${period.key}` as any)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={color} />
          <Text style={[styles.loadingText, { color: colors.s400 }]}>{t('loadingPrices')}</Text>
        </View>
      ) : data.length < 2 ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="analytics-outline" size={20} color={colors.s300} />
          <Text style={[styles.loadingText, { color: colors.s400 }]}>{t('noHistoricalData')}</Text>
        </View>
      ) : (
        <>
          {stats && (
            <>
              <View style={styles.statsRow}>
                <View style={[styles.badge, { backgroundColor: stats.positive ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Ionicons name={stats.positive ? 'trending-up' : 'trending-down'} size={12} color={stats.positive ? '#059669' : '#DC2626'} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: stats.positive ? '#059669' : '#DC2626' }}>
                    {stats.positive ? '+' : ''}
                    {stats.pct.toFixed(2)}%
                  </Text>
                </View>
              </View>
              <View style={styles.highLowRow}>
                <View style={styles.highLowItem}>
                  <Ionicons name="arrow-up" size={12} color="#059669" />
                  <Text style={[styles.highLowLabel, { color: colors.s400 }]}>{t('high')}</Text>
                  <Text style={[styles.highLowValue, { color: colors.s900 }]}>{fmt(stats.high)}</Text>
                </View>
                <View style={[styles.highLowDivider, { backgroundColor: colors.s200 }]} />
                <View style={styles.highLowItem}>
                  <Ionicons name="arrow-down" size={12} color="#DC2626" />
                  <Text style={[styles.highLowLabel, { color: colors.s400 }]}>{t('low')}</Text>
                  <Text style={[styles.highLowValue, { color: colors.s900 }]}>{fmt(stats.low)}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.chartWrap}>
            <LineChart
              areaChart
              curved
              data={data}
              height={200}
              width={screenWidth - 90}
              spacing={spacing}
              initialSpacing={15}
              endSpacing={15}
              color1={color}
              thickness1={2.5}
              startFillColor1={color}
              endFillColor1="transparent"
              startOpacity={0.15}
              endOpacity={0}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              rulesColor={colors.s100}
              rulesType="dashed"
              dashWidth={3}
              dashGap={4}
              yAxisTextStyle={{ color: colors.s400, fontSize: 8 }}
              stepValue={range / 4}
              maxValue={maxPrice + range * 0.1}
              mostNegativeValue={Math.max(0, minPrice - range * 0.1)}
              hideDataPoints
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  periodsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  periodBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 6, alignItems: 'center' },
  periodBtnText: { fontSize: 11, fontWeight: '800' },
  loadingWrap: { height: 120, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 8, gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  highLowRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8, gap: 0 },
  highLowItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  highLowDivider: { width: 1, height: 16 },
  highLowLabel: { fontSize: 11, fontWeight: '600' },
  highLowValue: { fontSize: 13, fontWeight: '800' },
  chartWrap: { marginLeft: -10, alignItems: 'center', marginTop: 2 },
});
