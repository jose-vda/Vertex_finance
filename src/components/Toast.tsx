import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TOAST_DURATION = 2200;

type ToastProps = {
  visible: boolean;
  message: string;
  onHide?: () => void;
  accentColor?: string;
};

export function Toast({ visible, message, onHide, accentColor = '#10B981' }: ToastProps) {
  useEffect(() => {
    if (!visible || !message) return;
    const t = setTimeout(() => {
      onHide?.();
    }, TOAST_DURATION);
    return () => clearTimeout(t);
  }, [visible, message, onHide]);

  if (!visible || !message) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.toast, { backgroundColor: accentColor }]}
    >
      <Text style={styles.text} numberOfLines={1}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
