
-- Drop ALL restrictive policies and recreate as permissive for ALL tables

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'anuncios','finance_accounts','finance_bills','finance_budgets',
    'finance_categories','finance_distribution_rules','finance_envelopes',
    'finance_income_sources','finance_investments','finance_receivable_installments',
    'finance_receivables','finance_transactions','finance_transfers',
    'metas','pedidos','profiles'
  ];
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- Recreate all as PERMISSIVE
DO $$
DECLARE
  t TEXT;
  tables_with_delete TEXT[] := ARRAY[
    'anuncios','finance_accounts','finance_bills','finance_budgets',
    'finance_categories','finance_distribution_rules','finance_envelopes',
    'finance_income_sources','finance_investments','finance_receivable_installments',
    'finance_receivables','finance_transactions','finance_transfers',
    'metas','pedidos'
  ];
BEGIN
  -- Tables with full CRUD
  FOREACH t IN ARRAY tables_with_delete LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t || '_sel', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t || '_ins', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id)', t || '_upd', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t || '_del', t);
  END LOOP;

  -- Profiles: no delete
  CREATE POLICY profiles_sel ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY profiles_ins ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY profiles_upd ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
END $$;
