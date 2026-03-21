/**
 * Supabase Edge Function: desbloquear Academia após pagamento confirmado.
 *
 * Configurar secrets no projeto:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - STRIPE_WEBHOOK_SECRET (quando integrares Stripe Checkout)
 * - REVENUECAT_WEBHOOK_SECRET ou validação oficial RevenueCat (quando integrares IAP)
 *
 * Invocação: Deploy com `supabase functions deploy academy-entitlement-webhook`
 * e apontar o URL no dashboard Stripe / RevenueCat.
 *
 * Este ficheiro é um esqueleto: completa a verificação de assinatura e o mapeamento
 * do evento → user_id antes de produção.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // TODO: validar Stripe (constructEvent com STRIPE_WEBHOOK_SECRET) ou payload RevenueCat.
  // Exemplo Stripe checkout.session.completed: metadata.supabase_user_id
  let userId: string | null = null;
  try {
    const body = await req.json();
    userId = body?.user_id ?? body?.metadata?.supabase_user_id ?? null;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!userId || typeof userId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing user_id in payload (stub expects body.user_id)' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { error } = await admin
    .from('profiles')
    .upsert(
      { id: userId, academy_unlocked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, user_id: userId }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
