-- ============================================================
-- Vertex Finance – user_investments
-- Copiar TUDO e colar no SQL Editor do Supabase. Clicar Run.
-- ============================================================

-- 1. Criar a tabela de investimentos
CREATE TABLE IF NOT EXISTS public.user_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_ticker TEXT NOT NULL,
  asset_name TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'commodity', 'index')),
  quantity NUMERIC(20, 10) NOT NULL DEFAULT 0,
  average_purchase_price NUMERIC(18, 8) NOT NULL DEFAULT 0,
  purchase_currency TEXT NOT NULL DEFAULT 'USD' CHECK (purchase_currency IN ('USD', 'BRL', 'EUR')),
  notes TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_investments_user ON public.user_investments (user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_ticker ON public.user_investments (user_id, asset_ticker);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_investments_updated_at ON public.user_investments;
CREATE TRIGGER trg_investments_updated_at
  BEFORE UPDATE ON public.user_investments
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_investments_updated_at();

-- 4. Ativar Row Level Security
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas (cada utilizador só acede aos seus investimentos)
DROP POLICY IF EXISTS "Users can read own investments" ON public.user_investments;
CREATE POLICY "Users can read own investments"
  ON public.user_investments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investments" ON public.user_investments;
CREATE POLICY "Users can insert own investments"
  ON public.user_investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own investments" ON public.user_investments;
CREATE POLICY "Users can update own investments"
  ON public.user_investments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own investments" ON public.user_investments;
CREATE POLICY "Users can delete own investments"
  ON public.user_investments FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Migração: se a tabela já existia, atualizar constraints para suportar 'index' e 'EUR'
DO $$
BEGIN
  -- Atualizar constraint de asset_type para incluir 'index'
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_investments_asset_type_check'
      AND table_name = 'user_investments'
  ) THEN
    ALTER TABLE public.user_investments DROP CONSTRAINT user_investments_asset_type_check;
  END IF;
  ALTER TABLE public.user_investments ADD CONSTRAINT user_investments_asset_type_check
    CHECK (asset_type IN ('stock', 'crypto', 'commodity', 'index'));

  -- Atualizar constraint de purchase_currency para incluir 'EUR'
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_investments_purchase_currency_check'
      AND table_name = 'user_investments'
  ) THEN
    ALTER TABLE public.user_investments DROP CONSTRAINT user_investments_purchase_currency_check;
  END IF;
  ALTER TABLE public.user_investments ADD CONSTRAINT user_investments_purchase_currency_check
    CHECK (purchase_currency IN ('USD', 'BRL', 'EUR'));
END $$;

-- 7. Forçar o Supabase a recarregar o schema da API
NOTIFY pgrst, 'reload schema';
