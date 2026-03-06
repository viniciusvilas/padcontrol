
-- Create category type enum
CREATE TYPE public.finance_category_type AS ENUM ('income', 'expense', 'both');

-- Create finance_categories table
CREATE TABLE public.finance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type finance_category_type NOT NULL DEFAULT 'expense',
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own finance_categories" ON public.finance_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_categories" ON public.finance_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_categories" ON public.finance_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_categories" ON public.finance_categories FOR DELETE USING (auth.uid() = user_id);

-- Function to seed default categories for new users
CREATE OR REPLACE FUNCTION public.seed_finance_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.finance_categories (user_id, name, type, color) VALUES
    (NEW.id, 'Alimentação', 'expense', '#ef4444'),
    (NEW.id, 'Moradia', 'expense', '#f97316'),
    (NEW.id, 'Transporte', 'expense', '#eab308'),
    (NEW.id, 'Saúde', 'expense', '#22c55e'),
    (NEW.id, 'Lazer', 'expense', '#3b82f6'),
    (NEW.id, 'Educação', 'expense', '#8b5cf6'),
    (NEW.id, 'Salário', 'income', '#10b981'),
    (NEW.id, 'Freelance', 'income', '#06b6d4'),
    (NEW.id, 'Pay After Delivery', 'income', '#6366f1'),
    (NEW.id, 'Investimentos', 'both', '#f59e0b');
  RETURN NEW;
END;
$$;

-- Trigger to auto-seed on user creation
CREATE TRIGGER on_auth_user_created_seed_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_finance_categories();
