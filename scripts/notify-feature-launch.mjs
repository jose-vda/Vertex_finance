#!/usr/bin/env node
/**
 * Envia notificação push (Expo) a quem pediu aviso para uma funcionalidade.
 *
 * Uso recomendado (ficheiro local, não commitado):
 *   cp .env.admin.example .env.admin
 *   # edita .env.admin com URL + Service Role
 *   npm run notify:bank-launch
 *
 * Ou manualmente na mesma shell:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/notify-feature-launch.mjs
 *
 * Opcional: FEATURE_KEY, NOTIFY_TITLE, NOTIFY_BODY
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.admin') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FEATURE_KEY = process.env.FEATURE_KEY || 'bank_accounts';
const TITLE = process.env.NOTIFY_TITLE || 'Vertex';
const BODY =
  process.env.NOTIFY_BODY ||
  'Já pode ligar as suas contas bancárias no Vertex. Abra a app para experimentar.';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (service role, não anon).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const { data: rows, error } = await supabase
  .from('feature_notify_signups')
  .select('id, expo_push_token')
  .eq('feature_key', FEATURE_KEY)
  .is('notified_at', null);

if (error) {
  console.error('Supabase:', error.message);
  process.exit(1);
}

const withToken = (rows || []).filter((r) => r.expo_push_token && String(r.expo_push_token).length > 0);
const noTokenIds = (rows || []).filter((r) => !r.expo_push_token).map((r) => r.id);

console.log(`Pendentes: ${(rows || []).length} (${withToken.length} com token push, ${noTokenIds.length} só interesse)`);

/** @param {any[]} messages */
async function sendChunk(messages) {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  const json = await res.json();
  return json;
}

const CHUNK = 90;
let sentIds = [];

for (let i = 0; i < withToken.length; i += CHUNK) {
  const slice = withToken.slice(i, i + CHUNK);
  const messages = slice.map((r) => ({
    to: r.expo_push_token,
    title: TITLE,
    body: BODY,
    sound: 'default',
    data: { feature: FEATURE_KEY },
  }));

  const json = await sendChunk(messages);
  const results = json.data;
  if (!Array.isArray(results)) {
    console.warn('Resposta Expo inesperada:', JSON.stringify(json).slice(0, 500));
    continue;
  }
  results.forEach((r, idx) => {
    if (r?.status === 'ok' && slice[idx]) {
      sentIds.push(slice[idx].id);
    } else if (r?.status === 'error') {
      console.warn('Falha token:', r.message, slice[idx]?.id);
    }
  });
}

const markIds = [...new Set([...sentIds, ...noTokenIds])];
if (markIds.length === 0) {
  console.log('Nada a marcar como notificado.');
  process.exit(0);
}

const now = new Date().toISOString();
const { error: upErr } = await supabase
  .from('feature_notify_signups')
  .update({ notified_at: now })
  .in('id', markIds);

if (upErr) {
  console.error('Erro ao atualizar notified_at:', upErr.message);
  process.exit(1);
}

console.log(`Marcados como notificados: ${markIds.length} (push enviados com sucesso: ${sentIds.length})`);
