CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO anon, authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico fornecedores" ON public.fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.predios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  codigo text NOT NULL DEFAULT '',
  morada text NOT NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predios TO anon, authenticated;
GRANT ALL ON public.predios TO service_role;
ALTER TABLE public.predios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico predios" ON public.predios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.limpezas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  predio_id uuid NOT NULL REFERENCES public.predios(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  mes integer NOT NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendente',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (predio_id, ano, mes)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.limpezas TO anon, authenticated;
GRANT ALL ON public.limpezas TO service_role;
ALTER TABLE public.limpezas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico limpezas" ON public.limpezas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX limpezas_periodo_idx ON public.limpezas (fornecedor_id, ano, mes);

CREATE TABLE public.notas_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  mes integer NOT NULL,
  texto text NOT NULL DEFAULT '',
  UNIQUE (fornecedor_id, ano, mes)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_mensais TO anon, authenticated;
GRANT ALL ON public.notas_mensais TO service_role;
ALTER TABLE public.notas_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico notas" ON public.notas_mensais FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.fornecedores (id, nome) VALUES ('11111111-1111-1111-1111-111111111111', 'Big Clean');

INSERT INTO public.predios (fornecedor_id, codigo, morada, valor) VALUES
('11111111-1111-1111-1111-111111111111','005','Cond. Rua das Manteigadas nº41, 43 e 45 - Setúbal',180),
('11111111-1111-1111-1111-111111111111','019','Cond. Av. D. Pedro V, nº 15 - Setúbal',160),
('11111111-1111-1111-1111-111111111111','029','Cond. Rua Jose Luciano Carvalho nº2 - Setúbal',150),
('11111111-1111-1111-1111-111111111111','059','Cond. Rua de São Jorge, nº14 - Setúbal',60),
('11111111-1111-1111-1111-111111111111','080','Cond. Rua Central da Azeda n.º74 - Setúbal',70),
('11111111-1111-1111-1111-111111111111','090','Cond. Rua João Ablino 1/3/5 - Setúbal',150),
('11111111-1111-1111-1111-111111111111','098','Condomínio na Av. Infante D. Henrique, nºs 32/34/36 Setúbal',70),
('11111111-1111-1111-1111-111111111111','117','Cond. Rua do Bairro Afonso Costa n.º7 e 7 A - Setúbal',75),
('11111111-1111-1111-1111-111111111111','120','Cond. Rua Mafaldo de Setúbal 15 e Rua Clube Recreativo Palhavã n.º62 e 64',70),
('11111111-1111-1111-1111-111111111111','144','Cond. Avenida Pedro Alvares Cabral nº 9',140),
('11111111-1111-1111-1111-111111111111','104','Praça D. Paio Peres Correia nº8',60),
('11111111-1111-1111-1111-111111111111','035','Cond. Rua João Azevedo n.º 21 - Caparica',145),
('11111111-1111-1111-1111-111111111111','066','Cond. Praceta vale da torre 3 torre da Marinha',95),
('11111111-1111-1111-1111-111111111111','076','Cond. Rua Elisa Pedroso, nº 8 Charneca da Caparica',65),
('11111111-1111-1111-1111-111111111111','096','Cond. Av. 25 de Abril, nº 51 - Torre da Marinha',95),
('11111111-1111-1111-1111-111111111111','132','Cond. Rua da Tebaida nº12 - Setúbal',75);