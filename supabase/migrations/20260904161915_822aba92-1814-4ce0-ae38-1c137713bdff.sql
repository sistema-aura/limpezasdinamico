CREATE TABLE public.contas_certas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  ate_mes integer NOT NULL DEFAULT 0,
  valor numeric NOT NULL DEFAULT 0,
  nota text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (fornecedor_id, ano)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_certas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_certas TO authenticated;
GRANT ALL ON public.contas_certas TO service_role;

ALTER TABLE public.contas_certas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico contas certas" ON public.contas_certas
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_contas_certas_updated_at
BEFORE UPDATE ON public.contas_certas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();