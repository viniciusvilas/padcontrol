
-- Create enums
CREATE TYPE public.finance_transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.finance_bill_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE public.finance_recurrence_interval AS ENUM ('monthly', 'weekly', 'yearly');

-- finance_transactions
CREATE TABLE public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type finance_transaction_type NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own finance_transactions" ON public.finance_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_transactions" ON public.finance_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_transactions" ON public.finance_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_transactions" ON public.finance_transactions FOR DELETE USING (auth.uid() = user_id);

-- finance_bills
CREATE TABLE public.finance_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status finance_bill_status NOT NULL DEFAULT 'pending',
  category TEXT NOT NULL DEFAULT '',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_interval finance_recurrence_interval,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own finance_bills" ON public.finance_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_bills" ON public.finance_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_bills" ON public.finance_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_bills" ON public.finance_bills FOR DELETE USING (auth.uid() = user_id);

-- finance_investments
CREATE TABLE public.finance_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own finance_investments" ON public.finance_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_investments" ON public.finance_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_investments" ON public.finance_investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_investments" ON public.finance_investments FOR DELETE USING (auth.uid() = user_id);

-- finance_income_sources
CREATE TABLE public.finance_income_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  expected_monthly_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_income_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own finance_income_sources" ON public.finance_income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_income_sources" ON public.finance_income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_income_sources" ON public.finance_income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_income_sources" ON public.finance_income_sources FOR DELETE USING (auth.uid() = user_id);
