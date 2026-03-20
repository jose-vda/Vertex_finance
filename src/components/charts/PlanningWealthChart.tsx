import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

type PlanningWealthChartProps = {
  seriesComJuros: number[];
  seriesSemJuros: number[];
  totalMonths: number;
  formatCurrency: (n: number) => string;
  currencySymbol?: string;
};

export function PlanningWealthChart({
  seriesComJuros,
  seriesSemJuros,
  totalMonths,
  formatCurrency,
  currencySymbol = 'R$',
}: PlanningWealthChartProps) {
  const { colors, isDark } = useTheme();
  const { t } = useSettings();
  const screenWidth = Dimensions.get('window').width;

  const { data1, data2 } = useMemo(() => {
    const step = totalMonths > 120 ? 24 : totalMonths > 60 ? 12 : totalMonths > 24 ? 6 : 1;
    const d1: any[] = [];
    const d2: any[] = [];

    seriesComJuros.forEach((val, i) => {
      if (i % step === 0 || i === seriesComJuros.length - 1) {
        let label = '';
        if (i === 0) label = t('chartStart');
        else if (i % 12 === 0) label = `${i / 12}a`;
        else if (i === seriesComJuros.length - 1) label = `${Math.floor(i / 12)}a${i % 12}m`;

        const monthLabel = i === 0
          ? t('chartStart')
          : i % 12 === 0
            ? `${t('chartYear')} ${i / 12}`
            : `${Math.floor(i / 12)}a ${i % 12}m`;

        d1.push({
          value: val,
          label,
          month: i,
          monthLabel,
          labelTextStyle: { color: colors.s400, fontSize: 8, width: 44 },
        });
        d2.push({ value: seriesSemJuros[i] });
      }
    });

    return { data1: d1, data2: d2 };
  }, [seriesComJuros, seriesSemJuros, totalMonths, colors, t]);

  const finalValue = seriesComJuros[seriesComJuros.length - 1] || 0;
  const startValue = seriesComJuros[0] || 0;
  const aportesTotal = seriesSemJuros[seriesSemJuros.length - 1] || 0;
  const profit = finalValue - aportesTotal;

  // Stats: growth %, high, low
  const growthPct = startValue > 0 ? ((finalValue - startValue) / startValue) * 100 : finalValue > 0 ? 100 : 0;
  const allValues = seriesComJuros.length > 0 ? seriesComJuros : [0];
  const highValue = Math.max(...allValues);
  const lowValue = Math.min(...allValues);

  const maxPrice = Math.max(...allValues);
  const minPrice = Math.min(...allValues);
  const priceRange = maxPrice - minPrice || 1;
  const stepValue = priceRange / 4;

  const safeDataLength = Math.max(1, data1.length - 1);
  const spacing = (screenWidth - 120) / safeDataLength;

  if (data1.length < 2) {
    return (
      <View style={styles.container}>
        <View style={[styles.statRow]}>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Ionicons name="flag" size={16} color="#10B981" />
            </View>
            <Text style={[styles.statLabel, { color: colors.s500 }]}>{t('chartFinalWealth')}</Text>
            <Text style={[styles.statValue, { color: colors.e600 }]}>{formatCurrency(finalValue)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Two stat cards: Final Wealth + Profit */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Ionicons name="flag" size={16} color="#10B981" />
          </View>
          <Text style={[styles.statLabel, { color: colors.s500 }]}>{t('chartFinalWealth')}</Text>
          <Text style={[styles.statValue, { color: colors.s900 }]}>{formatCurrency(finalValue)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(52,211,153,0.1)' }]}>
            <Ionicons name="trending-up" size={16} color="#34D399" />
          </View>
          <Text style={[styles.statLabel, { color: colors.s500 }]}>{t('chartProfit')}</Text>
          <Text style={[styles.statValue, { color: colors.e600 }]}>{formatCurrency(profit)}</Text>
        </View>
      </View>

      {/* Growth badge + High/Low stats (like AssetDetail) */}
      <View style={styles.periodStatsRow}>
        <View style={[styles.periodStatsBadge, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="trending-up" size={14} color="#059669" />
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>
            +{growthPct.toFixed(1)}%
          </Text>
        </View>
        <Text style={[styles.periodStatsLabel, { color: colors.s400 }]}>
          {formatCurrency(finalValue - startValue)}
        </Text>
      </View>
      <View style={styles.highLowRow}>
        <View style={styles.highLowItem}>
          <Ionicons name="arrow-up" size={12} color="#059669" />
          <Text style={[styles.highLowLabel, { color: colors.s400 }]}>High</Text>
          <Text style={[styles.highLowValue, { color: colors.s900 }]}>{formatCurrency(highValue)}</Text>
        </View>
        <View style={[styles.highLowDivider, { backgroundColor: colors.s200 }]} />
        <View style={styles.highLowItem}>
          <Ionicons name="arrow-down" size={12} color="#DC2626" />
          <Text style={[styles.highLowLabel, { color: colors.s400 }]}>Low</Text>
          <Text style={[styles.highLowValue, { color: colors.s900 }]}>{formatCurrency(lowValue)}</Text>
        </View>
      </View>

      {/* Chart (AssetDetail style) */}
      <View style={styles.chartContainer}>
        <LineChart
          areaChart
          curved
          data={data1}
          data2={data2}
          height={200}
          width={screenWidth - 100}
          initialSpacing={15}
          endSpacing={15}
          spacing={spacing}
          color1={colors.e500}
          thickness1={2.5}
          startFillColor1={colors.e500}
          endFillColor1="transparent"
          startOpacity={0.15}
          endOpacity={0}
          color2={colors.s300}
          thickness2={1}
          strokeDashArray2={[5, 5]}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={0}
          rulesColor={colors.s100}
          rulesType="dashed"
          dashWidth={3}
          dashGap={4}
          yAxisTextStyle={{ color: colors.s400, fontSize: 9 }}
          stepValue={stepValue}
          maxValue={maxPrice + priceRange * 0.1}
          mostNegativeValue={Math.max(0, minPrice - priceRange * 0.1)}
          hideDataPoints
          pointerConfig={{
            pointerStripColor: colors.e500,
            pointerStripWidth: 1,
            pointerStripUptoDataPoint: true,
            pointerColor: colors.e500,
            radius: 5,
            strokeDashArray: [2, 3],
            pointerLabelWidth: 140,
            pointerLabelHeight: 55,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              const item = items[0];
              const monthLabel = item?.monthLabel || '';
              return (
                <View style={styles.pointerLabel}>
                  {monthLabel ? (
                    <Text style={styles.pointerDate}>{monthLabel}</Text>
                  ) : null}
                  <Text style={styles.pointerText}>
                    {formatCurrency(item?.value ?? 0)}
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>

      {/* Legend (pill style) */}
      <View style={styles.legendRow}>
        <View style={[styles.legendPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <LinearGradient
            colors={['#10B981', '#34D399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.legendDot}
          />
          <Text style={[styles.legendText, { color: colors.s500 }]}>{t('chartWithInterest')}</Text>
        </View>
        <View style={[styles.legendPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[styles.legendDash, { backgroundColor: colors.s400 }]} />
          <Text style={[styles.legendText, { color: colors.s500 }]}>{t('chartContributions')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 4 },

  /* Stat Cards */
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },

  /* Period Stats (like AssetDetail) */
  periodStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  periodStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  periodStatsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  highLowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    gap: 0,
  },
  highLowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  highLowDivider: {
    width: 1,
    height: 16,
  },
  highLowLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  highLowValue: {
    fontSize: 13,
    fontWeight: '800',
  },

  /* Chart */
  chartContainer: { marginLeft: -10, alignItems: 'center', marginBottom: 4 },
  pointerLabel: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pointerDate: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  pointerText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  /* Legend */
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDash: { width: 12, height: 2, borderRadius: 1 },
  legendText: { fontSize: 11, fontWeight: '700' },
});
