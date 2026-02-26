CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mes DATE NOT NULL, -- primeiro dia do mês
  meta_faturamento NUMERIC NOT NULL DEFAULT 0,
  meta_pedidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mes)
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metas" ON public.metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metas" ON public.metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metas" ON public.metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metas" ON public.metas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();