
-- Create enum for account type
CREATE TYPE public.finance_account_type AS ENUM ('pj', 'pf');

-- Create finance_accounts table
CREATE TABLE public.finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type finance_account_type NOT NULL,
  owner text NOT NULL DEFAULT '',
  balance numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#6366f1',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_accounts" ON public.finance_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_accounts" ON public.finance_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_accounts" ON public.finance_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_accounts" ON public.finance_accounts FOR DELETE USING (auth.uid() = user_id);

-- Create finance_transfers table
CREATE TABLE public.finance_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_account_id uuid NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
  to_account_id uuid NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_transfers" ON public.finance_transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_transfers" ON public.finance_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_transfers" ON public.finance_transfers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_transfers" ON public.finance_transfers FOR DELETE USING (auth.uid() = user_id);

-- Create finance_envelopes table
CREATE TABLE public.finance_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  account_id uuid NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
  allocated_amount numeric NOT NULL DEFAULT 0,
  target_amount numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#6366f1',
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_envelopes" ON public.finance_envelopes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_envelopes" ON public.finance_envelopes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_envelopes" ON public.finance_envelopes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_envelopes" ON public.finance_envelopes FOR DELETE USING (auth.uid() = user_id);

-- Add account_id to existing tables
ALTER TABLE public.finance_transactions ADD COLUMN account_id uuid REFERENCES public.finance_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.finance_bills ADD COLUMN account_id uuid REFERENCES public.finance_accounts(id) ON DELETE SET NULL;

-- Seed function for default accounts
CREATE OR REPLACE FUNCTION public.seed_finance_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pj_vinicius_id uuid;
  pf_vinicius_id uuid;
  pj_esposa_id uuid;
  pf_esposa_id uuid;
BEGIN
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PJ Vinicius', 'pj', 'Vinicius', '#3B82F6') RETURNING id INTO pj_vinicius_id;
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PF Vinicius', 'pf', 'Vinicius', '#10B981') RETURNING id INTO pf_vinicius_id;
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PJ Esposa', 'pj', 'Esposa', '#F59E0B') RETURNING id INTO pj_esposa_id;
  INSERT INTO public.finance_accounts (id, user_id, name, type, owner, color) VALUES
    (gen_random_uuid(), NEW.id, 'PF Esposa', 'pf', 'Esposa', '#EC4899') RETURNING id INTO pf_esposa_id;

  -- Seed envelopes
  INSERT INTO public.finance_envelopes (user_id, name, account_id, color) VALUES
    (NEW.id, 'Capital de Giro', pj_esposa_id, '#F59E0B'),
    (NEW.id, 'Anúncios PAD', pj_esposa_id, '#EF4444'),
    (NEW.id, 'Pró-labore Vinicius', pj_esposa_id, '#3B82F6'),
    (NEW.id, 'Pró-labore Esposa', pj_esposa_id, '#EC4899'),
    (NEW.id, 'Reserva de Emergência', pf_vinicius_id, '#10B981'),
    (NEW.id, 'Investimentos', pf_vinicius_id, '#8B5CF6'),
    (NEW.id, 'Despesas Fixas Casa', pf_vinicius_id, '#F97316'),
    (NEW.id, 'Consultoria', pj_vinicius_id, '#06B6D4');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed_accounts
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_finance_accounts();
