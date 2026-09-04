ALTER TABLE public.predios ADD COLUMN pagamento_padrao text NOT NULL DEFAULT 'transferencia';

COMMENT ON COLUMN public.predios.pagamento_padrao IS 'Método de pagamento normal do prédio: transferencia ou numerario';