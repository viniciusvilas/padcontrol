CREATE TABLE public.finance_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_budgets" ON public.finance_budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_budgets" ON public.finance_budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_budgets" ON public.finance_budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_budgets" ON public.finance_budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);