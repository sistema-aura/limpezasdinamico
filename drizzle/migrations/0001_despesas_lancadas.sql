CREATE TABLE public.despesas_lancadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  ano int NOT NULL,
  mes int NOT NULL,
  lancada_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fornecedor_id, ano, mes)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_lancadas TO anon, authenticated;
GRANT ALL ON public.despesas_lancadas TO service_role;
ALTER TABLE public.despesas_lancadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico" ON public.despesas_lancadas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);