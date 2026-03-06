
-- Enum for receivable status
CREATE TYPE public.finance_receivable_status AS ENUM ('pending', 'partial', 'completed', 'overdue');

-- Enum for receivable installment status
CREATE TYPE public.finance_installment_status AS ENUM ('pending', 'paid', 'overdue');

-- Main receivables table
CREATE TABLE public.finance_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  client_name text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  account_id uuid REFERENCES public.finance_accounts(id),
  category text NOT NULL DEFAULT '',
  status public.finance_receivable_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_receivables" ON public.finance_receivables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_receivables" ON public.finance_receivables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_receivables" ON public.finance_receivables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_receivables" ON public.finance_receivables FOR DELETE USING (auth.uid() = user_id);

-- Installments table
CREATE TABLE public.finance_receivable_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  receivable_id uuid NOT NULL REFERENCES public.finance_receivables(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at date,
  status public.finance_installment_status NOT NULL DEFAULT 'pending',
  account_id uuid REFERENCES public.finance_accounts(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_receivable_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_receivable_installments" ON public.finance_receivable_installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_receivable_installments" ON public.finance_receivable_installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_receivable_installments" ON public.finance_receivable_installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_receivable_installments" ON public.finance_receivable_installments FOR DELETE USING (auth.uid() = user_id);
