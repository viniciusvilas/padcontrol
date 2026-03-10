ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS em_rota boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_problematico boolean NOT NULL DEFAULT false;