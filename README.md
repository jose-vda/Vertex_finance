# Vertex Finance (React Native / Expo)

App de controle financeiro pessoal em React Native (Expo **SDK 54**) — mesma funcionalidade do [Vertex Finance web](../README.md), pronta para publicar na **App Store** e **Play Store**. Usa **Expo Go SDK 54** no telemóvel.

## Funcionalidades

- Login / cadastro (email e senha, Google)
- Recuperação de senha
- Dashboard: patrimônio, receitas, despesas, taxa de poupança
- Adicionar e excluir transações (receita/despesa por categoria)
- Analytics: gráfico de pizza (Savings vs Expenses) e linha (Net Worth History)
- Metas e milestones (conquistas por % da meta)
- Perfil: avatar, estatísticas, logout

## Configuração

1. **Supabase** — Use o **mesmo** projeto e SQL do app web (veja [SUPABASE.md](../SUPABASE.md)).  
   Para o questionário pós-registo (meta + motivo + prazo), adicione as colunas na tabela `user_settings`:
   ```sql
   ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goal_reason TEXT;
   ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goal_years INTEGER;
   ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goal_edit_count INTEGER DEFAULT 0;
   ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goal_set_at TIMESTAMPTZ;
   ```

2. **Bucket de fotos de perfil (opcional)**  
   Para permitir que os utilizadores adicionem foto de perfil, crie no Supabase (Storage) um bucket chamado **`avatars`** e torne-o **público** (Public bucket). Caso contrário, a opção "Alterar foto" no perfil mostrará um erro.

3. **Vertex Academy — áudio dos resumos (opcional)**  
   Para o player “Ouvir resumo” nos livros, crie o bucket e faça upload dos MP3 conforme [docs/academy-audio.md](docs/academy-audio.md) e defina `EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL` no `.env`. Sem esta variável, o botão de áudio não aparece.

4. **Variáveis de ambiente**  
   Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Preencha no `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL` = URL do projeto (ex: `https://xxxxx.supabase.co`)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = chave anon do Supabase  
   - (Opcional) `EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL` = URL da pasta `summaries` dos MP3 da Academy — ver [docs/academy-audio.md](docs/academy-audio.md)

   Ou edite `src/lib/supabase.ts` e substitua `YOUR_SUPABASE_URL` e `YOUR_SUPABASE_ANON_KEY` diretamente.

5. **Instalar e rodar**
   ```bash
   npm install
   npx expo start
   ```
   - **No telemóvel:** instala a app **Expo Go** (App Store / Play Store), escaneia o QR code que aparece no terminal.
   - **No computador:** pressiona `i` (iOS) ou `a` (Android) para abrir no simulador/emulador.

6. **Se der erro ao iniciar (Metro / TerminalReporter):**
   - Usa **Node 18** ou **Node 20** (ex.: `nvm use 18` se tiveres nvm).
   - Limpa a cache: `npx expo start -c`

## Build para lojas

### iOS (App Store)

- Configure o projeto no [Expo EAS](https://expo.dev/eas): `npx eas build:configure`.
- Build: `npx eas build --platform ios`.
- Envie para a App Store via EAS Submit ou Xcode.

### Android (Play Store)

- Build: `npx eas build --platform android`.
- Envie para a Play Store via EAS Submit ou Google Play Console.

Recomendado: criar conta em [expo.dev](https://expo.dev) e usar EAS Build para gerar os binários (iOS e Android) na nuvem.

## Estrutura

- `src/constants/theme.ts` — cores, categorias, milestones, `fmt`
- `src/lib/supabase.ts` — cliente Supabase (AsyncStorage para sessão)
- `src/context/AuthContext.tsx` — sessão, usuário, transações, meta, funções de dados
- `src/screens/` — Welcome, Login, Register, Forgot, Dashboard, Analytics, Milestones
- `src/navigation/` — AuthStack (telas de auth), MainTabs (Dashboard, Analytics, Milestones + perfil)

O backend é o **mesmo** do app web: Supabase (Auth + PostgreSQL com RLS). Não há backend próprio no repositório.
# Vertex_finance
