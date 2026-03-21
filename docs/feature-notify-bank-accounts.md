# Notificar utilizadores — ligação de contas bancárias

## 1. Base de dados

No Supabase → SQL Editor, executa o ficheiro **`supabase_feature_notify_signups.sql`**.

Isto cria a tabela `feature_notify_signups` com RLS: cada utilizador só vê e altera as próprias linhas.

## 2. App

- O botão **“Notificar-me quando estiver pronto”** no modal de contas bancárias:
  - Pede permissão de notificações (iOS/Android).
  - Guarda o token Expo Push (quando existir) com `feature_key = bank_accounts`.
  - Na **web** ou sem token (simulador / permissão recusada), regista na mesma tabela com `expo_push_token` null — ficas com a lista de interessados.

## 3. Quando a funcionalidade estiver pronta

Na máquina com Node (na pasta do projeto), **não commites segredos**. Opção recomendada:

1. Copia o exemplo: `cp .env.admin.example .env.admin`
2. Edita **`.env.admin`** e preenche `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (chave **service_role** em Project Settings → API).
3. Corre: `npm run notify:bank-launch`

O ficheiro `.env.admin` está no `.gitignore`.

Alternativa (mesma shell, sem ficheiro):

```bash
export SUPABASE_URL="https://SEU_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="(service role — nunca no repositório)"
node scripts/notify-feature-launch.mjs
```

Opcional:

```bash
export NOTIFY_TITLE="Vertex"
export NOTIFY_BODY="Já pode ligar as suas contas bancárias. Abra a app."
export FEATURE_KEY=bank_accounts
```

O script:

1. Lê linhas com `feature_key = bank_accounts` e `notified_at IS NULL`.
2. Envia push via API Expo para quem tem `expo_push_token`.
3. Define `notified_at` para **todos** esses registos (com ou sem token), para não reenviar.

**Segurança:** a Service Role não deve ir para a app; só para CI ou o teu computador ao correr o script.

## 4. Expo / builds

- `app.json` inclui o plugin `expo-notifications` e o `projectId` EAS em `extra.eas.projectId` (necessário para obter o token push).
- Em **Expo Go** o push costuma funcionar para testes; para produção usa **EAS Build** com credenciais Apple/Google configuradas.
