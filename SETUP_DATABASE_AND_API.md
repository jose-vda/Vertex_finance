# Ligar a base de dados e a API (Carteira)

## 1. Base de dados (Supabase)

1. Entra em **[supabase.com](https://supabase.com)** e abre o teu projeto.
2. No menu lateral: **SQL Editor** → **New query**.
3. Abre o ficheiro **`supabase_schema_investments.sql`** (na raiz do projeto), copia **todo** o conteúdo e cola no editor.
4. Clica **Run** (ou Ctrl/Cmd + Enter).
5. Deve aparecer “Success”. A tabela `user_investments` fica criada e com permissões (RLS).

A app já usa as variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` do teu `.env` para falar com este projeto Supabase.

---

## 2. API (Alpha Vantage – preços de ações, commodities e câmbio USD/BRL)

1. Abre **[alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)**.
2. Preenche o email e clica em **GET FREE API KEY**.
3. Copia a chave que recebes por email (ex.: `XXXXXXXX`).
4. Na **raiz do projeto** (onde está o `package.json`), abre ou cria o ficheiro **`.env`**.
5. Garante que tens estas linhas (ajusta os valores se já tiveres um `.env`):

```env
# Supabase (obrigatório para a app)
EXPO_PUBLIC_SUPABASE_URL=https://O_TEU_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Alpha Vantage (obrigatório para preços na Carteira)
EXPO_PUBLIC_ALPHA_VANTAGE_KEY=COLA_A_TUA_CHAVE_AQUI
```

6. Guarda o ficheiro e reinicia o Metro:

```bash
npx expo start --clear
```

**Nota:** A CoinGecko (preços de cripto como BTC) não precisa de chave; só a Alpha Vantage precisa de estar no `.env`.

---

## Resumo

| O quê              | Onde                         | Variável / Ficheiro              |
|--------------------|------------------------------|-----------------------------------|
| Base de dados      | Supabase → SQL Editor        | `supabase_schema_investments.sql` |
| Supabase na app   | `.env` na raiz do projeto    | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| API de preços     | `.env` na raiz do projeto    | `EXPO_PUBLIC_ALPHA_VANTAGE_KEY`  |

Depois de executar o SQL e configurar o `.env`, a base de dados e a API ficam ligadas à Carteira.
