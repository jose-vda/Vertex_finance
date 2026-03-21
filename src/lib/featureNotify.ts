import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Contas bancárias + sync — chave estável para o script de envio em massa */
export const FEATURE_KEY_BANK_ACCOUNTS = 'bank_accounts';

export type SubscribeFeatureNotifyResult =
  | {
      ok: true;
      webNoPush?: boolean;
      simulatorNoPush?: boolean;
      permissionDenied?: boolean;
    }
  | { ok: false; reason: 'not_signed_in' | 'db_error'; message?: string };

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/**
 * Regista o pedido de notificação no Supabase e obtém token push (iOS/Android).
 * Na web ou simulador sem token, grava mesma linha com token null (interesse registado).
 */
export async function subscribeFeatureNotify(
  supabase: SupabaseClient,
  userId: string,
  featureKey: string
): Promise<SubscribeFeatureNotifyResult> {
  if (!userId) {
    return { ok: false, reason: 'not_signed_in' };
  }

  await ensureAndroidChannel();

  let expoPushToken: string | null = null;
  let simulatorNoPush = false;

  if (Platform.OS === 'web') {
    const { error } = await supabase.from('feature_notify_signups').upsert(
      {
        user_id: userId,
        feature_key: featureKey,
        expo_push_token: null,
        platform: 'web',
      },
      { onConflict: 'user_id,feature_key' }
    );
    if (error) {
      return { ok: false, reason: 'db_error', message: error.message };
    }
    return { ok: true, webNoPush: true };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    const { error } = await supabase.from('feature_notify_signups').upsert(
      {
        user_id: userId,
        feature_key: featureKey,
        expo_push_token: null,
        platform: Platform.OS,
      },
      { onConflict: 'user_id,feature_key' }
    );
    if (error) {
      return { ok: false, reason: 'db_error', message: error.message };
    }
    return { ok: true, permissionDenied: true };
  }

  if (!Device.isDevice) {
    simulatorNoPush = true;
  } else {
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
      if (!projectId) {
        simulatorNoPush = true;
      } else {
        const push = await Notifications.getExpoPushTokenAsync({ projectId });
        expoPushToken = push.data ?? null;
      }
    } catch {
      simulatorNoPush = true;
    }
  }

  const { error } = await supabase.from('feature_notify_signups').upsert(
    {
      user_id: userId,
      feature_key: featureKey,
      expo_push_token: expoPushToken,
      platform: Platform.OS,
    },
    { onConflict: 'user_id,feature_key' }
  );

  if (error) {
    return { ok: false, reason: 'db_error', message: error.message };
  }

  return { ok: true, simulatorNoPush, webNoPush: false };
}
