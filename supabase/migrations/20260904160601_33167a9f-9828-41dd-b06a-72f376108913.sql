CREATE TABLE public.faturacao_mensal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  mes integer NOT NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fornecedor_id, ano, mes)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturacao_mensal TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturacao_mensal TO authenticated;
GRANT ALL ON public.faturacao_mensal TO service_role;

ALTER TABLE public.faturacao_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico faturacao" ON public.faturacao_mensal
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_faturacao_mensal_updated_at
BEFORE UPDATE ON public.faturacao_mensal
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();