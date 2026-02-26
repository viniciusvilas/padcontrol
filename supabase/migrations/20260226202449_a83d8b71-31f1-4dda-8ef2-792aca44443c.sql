-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'afiliado',
  faturamento_acumulado NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pedidos table
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente TEXT NOT NULL,
  telefone TEXT,
  produto TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  plataforma TEXT NOT NULL DEFAULT 'Five',
  local_entrega TEXT,
  estado TEXT,
  prazo INTEGER NOT NULL DEFAULT 15,
  previsao_entrega DATE,
  rastreio TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'criado',
  ja_foi_chamado BOOLEAN NOT NULL DEFAULT false,
  pedido_chegou BOOLEAN NOT NULL DEFAULT false,
  cliente_cobrado BOOLEAN NOT NULL DEFAULT false,
  pedido_pago BOOLEAN NOT NULL DEFAULT false,
  pedido_perdido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pedidos" ON public.pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pedidos" ON public.pedidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pedidos" ON public.pedidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pedidos" ON public.pedidos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Anuncios table
CREATE TABLE public.anuncios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  orcamento NUMERIC NOT NULL DEFAULT 0,
  valor_investido NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own anuncios" ON public.anuncios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anuncios" ON public.anuncios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anuncios" ON public.anuncios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anuncios" ON public.anuncios FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_anuncios_updated_at BEFORE UPDATE ON public.anuncios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();