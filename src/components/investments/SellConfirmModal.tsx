import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

type SellConfirmModalProps = {
  visible: boolean;
  ticker: string;
  quantityOwned: number;
  quantityValue: string;
  onQuantityChange: (v: string) => void;
  mode: 'auto' | 'manual';
  onModeChange: (mode: 'auto' | 'manual') => void;
  manualPriceValue: string;
  onManualPriceChange: (v: string) => void;
  currentPriceText: string;
  expectedCreditText: string;
  selling: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (k: string) => string;
  colors: any;
};

export function SellConfirmModal({
  visible,
  ticker,
  quantityOwned,
  quantityValue,
  onQuantityChange,
  mode,
  onModeChange,
  manualPriceValue,
  onManualPriceChange,
  currentPriceText,
  expectedCreditText,
  selling,
  onCancel,
  onConfirm,
  t,
  colors,
}: SellConfirmModalProps) {
  if (!visible) return null;

  return (
    <>
      <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutUp.duration(140)} style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalBackdropTouch} activeOpacity={1} onPress={onCancel} />
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOutUp.duration(180)} style={[styles.sellModalCard, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sellModalTitle, { color: colors.s900 }]}>{t('confirmSellTitle')}</Text>
        <Text style={[styles.sellModalSubtitle, { color: colors.s400 }]}>
          {ticker} - {t('quantity')}: {quantityOwned}
        </Text>

        <Text style={[styles.sellFieldLabel, { color: colors.s500 }]}>{t('sellQuantity')}</Text>
        <TextInput
          value={quantityValue}
          onChangeText={onQuantityChange}
          keyboardType="decimal-pad"
          style={[styles.sellInput, { color: colors.s900, borderColor: colors.s200, backgroundColor: colors.s50 }]}
          placeholder={t('sellQuantityPlaceholder')}
          placeholderTextColor={colors.s400}
        />

        <Text style={[styles.sellFieldLabel, { color: colors.s500 }]}>{t('sellPriceMode')}</Text>
        <View style={styles.sellModeRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onModeChange('auto')}
            style={[
              styles.sellModeBtn,
              { borderColor: colors.s200, backgroundColor: colors.s50 },
              mode === 'auto' && { borderColor: colors.e500, backgroundColor: colors.e50 },
            ]}
          >
            <Text style={[styles.sellModeBtnText, { color: mode === 'auto' ? colors.e600 : colors.s500 }]}>{t('sellPriceAuto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onModeChange('manual')}
            style={[
              styles.sellModeBtn,
              { borderColor: colors.s200, backgroundColor: colors.s50 },
              mode === 'manual' && { borderColor: colors.e500, backgroundColor: colors.e50 },
            ]}
          >
            <Text style={[styles.sellModeBtnText, { color: mode === 'manual' ? colors.e600 : colors.s500 }]}>{t('sellPriceManual')}</Text>
          </TouchableOpacity>
        </View>

        {mode === 'manual' ? (
          <>
            <Text style={[styles.sellFieldLabel, { color: colors.s500 }]}>{t('sellManualPrice')}</Text>
            <TextInput
              value={manualPriceValue}
              onChangeText={onManualPriceChange}
              keyboardType="decimal-pad"
              style={[styles.sellInput, { color: colors.s900, borderColor: colors.s200, backgroundColor: colors.s50 }]}
              placeholder={t('sellManualPricePlaceholder')}
              placeholderTextColor={colors.s400}
            />
          </>
        ) : (
          <Text style={[styles.sellAutoPrice, { color: colors.s500 }]}>
            {t('currentPrice')}: {currentPriceText}
          </Text>
        )}

        <View style={[styles.sellSummary, { backgroundColor: colors.s50 }]}>
          <Text style={[styles.sellSummaryText, { color: colors.s500 }]}>
            {t('sellExpectedCredit')}: <Text style={{ color: colors.s900, fontWeight: '800' }}>{expectedCreditText}</Text>
          </Text>
        </View>

        <View style={styles.sellActions}>
          <TouchableOpacity activeOpacity={0.8} onPress={onCancel} style={[styles.sellCancelBtn, { borderColor: colors.s200 }]}>
            <Text style={[styles.sellCancelText, { color: colors.s500 }]}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onConfirm}
            disabled={selling}
            style={[styles.sellConfirmBtn, { backgroundColor: colors.red }, selling && { opacity: 0.7 }]}
          >
            {selling ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sellConfirmText}>{t('confirmSell')}</Text>}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.28)',
    zIndex: 30,
  },
  modalBackdropTouch: { flex: 1 },
  sellModalCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    borderRadius: 20,
    padding: 16,
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  sellModalTitle: { fontSize: 18, fontWeight: '800' },
  sellModalSubtitle: { fontSize: 12, marginTop: 3, marginBottom: 10 },
  sellFieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  sellInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sellModeRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  sellModeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  sellModeBtnText: { fontSize: 12, fontWeight: '800' },
  sellAutoPrice: { fontSize: 12, marginTop: 8, marginBottom: 2 },
  sellSummary: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  sellSummaryText: { fontSize: 12, fontWeight: '600' },
  sellActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sellCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sellCancelText: { fontSize: 13, fontWeight: '700' },
  sellConfirmBtn: {
    flex: 1.3,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sellConfirmText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
