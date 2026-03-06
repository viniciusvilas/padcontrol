
CREATE TABLE public.finance_distribution_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  envelope_id uuid NOT NULL REFERENCES public.finance_envelopes(id) ON DELETE CASCADE,
  percentage numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, envelope_id)
);

ALTER TABLE public.finance_distribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance_distribution_rules" ON public.finance_distribution_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_distribution_rules" ON public.finance_distribution_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_distribution_rules" ON public.finance_distribution_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_distribution_rules" ON public.finance_distribution_rules FOR DELETE USING (auth.uid() = user_id);
