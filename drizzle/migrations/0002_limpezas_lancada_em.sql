ALTER TABLE public.limpezas ADD COLUMN lancada_em timestamptz;
COMMENT ON TABLE public.despesas_lancadas IS 'DEPRECATED: replaced by limpezas.lancada_em';