# Vertex Academy — acesso premium

## Lançamento grátis → monetização depois

- **Predefinição:** `EXPO_PUBLIC_ACADEMY_ACCESS_MODE=free` (ou omitir). Toda a gente autenticada vê a Academia sem consultar `profiles`.
- **Quando quiseres cobrar:** corre o SQL em [`supabase_academy_premium.sql`](../supabase_academy_premium.sql), define `EXPO_PUBLIC_ACADEMY_ACCESS_MODE=paid` no build, integra pagamento e webhook.
- **Grandfathering (opcional):** utilizadores antigos com acesso vitalício — atualiza `profiles.academy_grandfathered = true` (exemplo comentado no SQL, filtrando por `auth.users.created_at`).

## Canais de pagamento (escolha conforme distribuição)

| Canal | Quando usar |
|--------|-------------|
| **App Store / Google Play** | App nativa nas lojas: desbloqueio digital → normalmente **In-App Purchase**. Stripe sozinho *dentro* da app para o mesmo produto costuma violar as regras das lojas. |
| **Web (Expo web / browser)** | **Stripe Checkout** ou Payment Link: após `checkout.session.completed`, webhook grava `academy_unlocked_at`. |
| **Híbrido** | IAP no mobile + Stripe na web, ambos a chamar a mesma Edge Function (ou lógica partilhada) que atualiza `profiles`. |

## Backend

1. Executar [`supabase_academy_premium.sql`](../supabase_academy_premium.sql) no SQL Editor (rever conflitos com `profiles` existente).
2. Deploy da função [`supabase/functions/academy-entitlement-webhook`](../supabase/functions/academy-entitlement-webhook/index.ts):
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
   - Completar validação **Stripe** (`stripe-signature` + `STRIPE_WEBHOOK_SECRET`) ou **RevenueCat** antes de produção.
   - O stub atual aceita JSON `{ "user_id": "<uuid>" }` apenas para testes manuais.

## App (já implementado)

- [`src/constants/academyAccess.ts`](../src/constants/academyAccess.ts) — modo `free` / `paid`.
- [`src/context/AcademyPremiumContext.tsx`](../src/context/AcademyPremiumContext.tsx) — lê `profiles` em modo `paid`.
- Tab Academia: [`AcademyTabRoot`](../src/components/academy/AcademyTabRoot.tsx) → paywall ou [`AcademyScreen`](../src/screens/AcademyScreen.tsx).
- Stack: [`useRequireAcademyAccess`](../src/hooks/useRequireAcademyAccess.ts) em `BookList`, `BookDetail`, `TopicForum`, `TopicThread`.

## SDK sugerido para IAP (próximo passo)

- **RevenueCat** + `react-native-purchases`: requer **Expo dev build** (não Expo Go). Configurar produto não consumível tipo “Academy unlock”.
- Após compra bem-sucedida, o webhook RevenueCat → Edge Function deve definir `academy_unlocked_at` (o cliente também pode chamar `refreshAcademyEntitlement()`).

## Variáveis de ambiente

Ver [`.env.example`](../.env.example): `EXPO_PUBLIC_ACADEMY_ACCESS_MODE`.
