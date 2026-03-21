import type { SupabaseClient } from '@supabase/supabase-js';

export type AppNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  notification_type: string;
  read_at: string | null;
  created_at: string;
  /** JSON from DB (forum deep link, etc.) */
  metadata?: Record<string, unknown> | null;
};

export async function fetchAppNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: AppNotificationRow[]; error: Error | null }> {
  try {
    let q = supabase
      .from('app_notifications')
      .select('id, user_id, title, body, notification_type, read_at, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    let { data, error } = await q;
    if (error?.message?.includes('metadata')) {
      const r2 = await supabase
        .from('app_notifications')
        .select('id, user_id, title, body, notification_type, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      data = r2.data
        ? (r2.data as AppNotificationRow[]).map((row) => ({ ...row, metadata: null }))
        : null;
      error = r2.error;
    }
    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist')
      ) {
        return { data: [], error: null };
      }
      return { data: [], error: new Error(error.message) };
    }
    return { data: (data ?? []) as AppNotificationRow[], error: null };
  } catch (e: unknown) {
    return { data: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function fetchUnreadAppNotificationsCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('app_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markAppNotificationRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);
  return !error;
}
