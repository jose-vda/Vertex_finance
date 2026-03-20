-- ============================================================
-- SCRIPT COMPLETO – Vertex Finance – user_settings
-- Copiar TUDO e colar no SQL Editor do Supabase. Clicar Run.
-- ============================================================

-- 1. Criar a tabela (se já existir, não faz nada)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal NUMERIC DEFAULT 0,
  goal_reason TEXT,
  goal_years INTEGER DEFAULT NULL,
  goal_set_at TIMESTAMPTZ DEFAULT NULL,
  goal_edit_count INTEGER DEFAULT 0,
  net_worth NUMERIC DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb
);

-- 2. Garantir colunas em falta (se a tabela foi criada com script antigo)
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS goal_set_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS goal_edit_count INTEGER DEFAULT 0;

-- 3. Ativar Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 4. Políticas (cada utilizador só acede à sua linha)
DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. (Opcional) Forçar o Supabase a recarregar o schema da API
NOTIFY pgrst, 'reload schema';
