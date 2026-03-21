# In-app notifications (`app_notifications`)

The notification center shows rows from `public.app_notifications`. Supported **notification_type** values used in the app:

| Type | When | Created by |
|------|------|------------|
| `price_alert` | User’s target price is met (after a price refresh in the app) | RPC `trigger_price_alert_if_met` |
| `forum_reply` | Someone comments on your topic or replies to your comment | Trigger on `academy_forum_comments` (see `supabase_academy_forum.sql`) |
| `app_update` | You publish a product update message | Manual / admin `INSERT` (see below) |
| `general` | Anything else | Your backend / SQL |

## Setup

1. `supabase_app_notifications.sql` — base table and RLS.
2. `supabase_investment_price_alerts.sql` — price alerts + RPC (optional if you only use forum).
3. `supabase_academy_forum.sql` — forum tables, `metadata` column on `app_notifications`, and reply trigger.

## App update (broadcast)

Insert one row per user you want to reach, or run a SQL loop for all users (use carefully).

Example for **one user**:

```sql
insert into public.app_notifications (user_id, title, body, notification_type, metadata)
values (
  'USER_UUID_HERE',
  'App update',
  'We improved performance and fixed bugs. Update from the store when ready.',
  'app_update',
  '{}'::jsonb
);
```

The app maps `app_update` to localized strings for title/body when you rely on defaults; you can still set custom `title` / `body` in SQL (English or any language).

## Forum

After `supabase_academy_forum.sql` is applied, the Academy forum reads/writes Supabase. Replies generate `forum_reply` notifications with `metadata.topic_id` so the app can open the thread.

Reactions (likes/emojis) stay **session-only** in the client (not stored in Postgres).
