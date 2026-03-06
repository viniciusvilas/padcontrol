
-- Fix RLS policies for ALL finance tables: drop restrictive and recreate as permissive

-- finance_accounts
DROP POLICY IF EXISTS "Users can view own finance_accounts" ON public.finance_accounts;
DROP POLICY IF EXISTS "Users can insert own finance_accounts" ON public.finance_accounts;
DROP POLICY IF EXISTS "Users can update own finance_accounts" ON public.finance_accounts;
DROP POLICY IF EXISTS "Users can delete own finance_accounts" ON public.finance_accounts;

CREATE POLICY "Users can view own finance_accounts" ON public.finance_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_accounts" ON public.finance_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_accounts" ON public.finance_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_accounts" ON public.finance_accounts FOR DELETE USING (auth.uid() = user_id);

-- finance_transactions
DROP POLICY IF EXISTS "Users can view own finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Users can insert own finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Users can update own finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Users can delete own finance_transactions" ON public.finance_transactions;

CREATE POLICY "Users can view own finance_transactions" ON public.finance_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_transactions" ON public.finance_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_transactions" ON public.finance_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_transactions" ON public.finance_transactions FOR DELETE USING (auth.uid() = user_id);

-- finance_transfers
DROP POLICY IF EXISTS "Users can view own finance_transfers" ON public.finance_transfers;
DROP POLICY IF EXISTS "Users can insert own finance_transfers" ON public.finance_transfers;
DROP POLICY IF EXISTS "Users can update own finance_transfers" ON public.finance_transfers;
DROP POLICY IF EXISTS "Users can delete own finance_transfers" ON public.finance_transfers;

CREATE POLICY "Users can view own finance_transfers" ON public.finance_transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_transfers" ON public.finance_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_transfers" ON public.finance_transfers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_transfers" ON public.finance_transfers FOR DELETE USING (auth.uid() = user_id);

-- finance_bills
DROP POLICY IF EXISTS "Users can view own finance_bills" ON public.finance_bills;
DROP POLICY IF EXISTS "Users can insert own finance_bills" ON public.finance_bills;
DROP POLICY IF EXISTS "Users can update own finance_bills" ON public.finance_bills;
DROP POLICY IF EXISTS "Users can delete own finance_bills" ON public.finance_bills;

CREATE POLICY "Users can view own finance_bills" ON public.finance_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_bills" ON public.finance_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_bills" ON public.finance_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_bills" ON public.finance_bills FOR DELETE USING (auth.uid() = user_id);

-- finance_budgets
DROP POLICY IF EXISTS "Users can view own finance_budgets" ON public.finance_budgets;
DROP POLICY IF EXISTS "Users can insert own finance_budgets" ON public.finance_budgets;
DROP POLICY IF EXISTS "Users can update own finance_budgets" ON public.finance_budgets;
DROP POLICY IF EXISTS "Users can delete own finance_budgets" ON public.finance_budgets;

CREATE POLICY "Users can view own finance_budgets" ON public.finance_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_budgets" ON public.finance_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_budgets" ON public.finance_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_budgets" ON public.finance_budgets FOR DELETE USING (auth.uid() = user_id);

-- finance_categories
DROP POLICY IF EXISTS "Users can view own finance_categories" ON public.finance_categories;
DROP POLICY IF EXISTS "Users can insert own finance_categories" ON public.finance_categories;
DROP POLICY IF EXISTS "Users can update own finance_categories" ON public.finance_categories;
DROP POLICY IF EXISTS "Users can delete own finance_categories" ON public.finance_categories;

CREATE POLICY "Users can view own finance_categories" ON public.finance_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_categories" ON public.finance_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_categories" ON public.finance_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_categories" ON public.finance_categories FOR DELETE USING (auth.uid() = user_id);

-- finance_envelopes
DROP POLICY IF EXISTS "Users can view own finance_envelopes" ON public.finance_envelopes;
DROP POLICY IF EXISTS "Users can insert own finance_envelopes" ON public.finance_envelopes;
DROP POLICY IF EXISTS "Users can update own finance_envelopes" ON public.finance_envelopes;
DROP POLICY IF EXISTS "Users can delete own finance_envelopes" ON public.finance_envelopes;

CREATE POLICY "Users can view own finance_envelopes" ON public.finance_envelopes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_envelopes" ON public.finance_envelopes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_envelopes" ON public.finance_envelopes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_envelopes" ON public.finance_envelopes FOR DELETE USING (auth.uid() = user_id);

-- finance_distribution_rules
DROP POLICY IF EXISTS "Users can view own finance_distribution_rules" ON public.finance_distribution_rules;
DROP POLICY IF EXISTS "Users can insert own finance_distribution_rules" ON public.finance_distribution_rules;
DROP POLICY IF EXISTS "Users can update own finance_distribution_rules" ON public.finance_distribution_rules;
DROP POLICY IF EXISTS "Users can delete own finance_distribution_rules" ON public.finance_distribution_rules;

CREATE POLICY "Users can view own finance_distribution_rules" ON public.finance_distribution_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_distribution_rules" ON public.finance_distribution_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_distribution_rules" ON public.finance_distribution_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_distribution_rules" ON public.finance_distribution_rules FOR DELETE USING (auth.uid() = user_id);

-- finance_income_sources
DROP POLICY IF EXISTS "Users can view own finance_income_sources" ON public.finance_income_sources;
DROP POLICY IF EXISTS "Users can insert own finance_income_sources" ON public.finance_income_sources;
DROP POLICY IF EXISTS "Users can update own finance_income_sources" ON public.finance_income_sources;
DROP POLICY IF EXISTS "Users can delete own finance_income_sources" ON public.finance_income_sources;

CREATE POLICY "Users can view own finance_income_sources" ON public.finance_income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_income_sources" ON public.finance_income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_income_sources" ON public.finance_income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_income_sources" ON public.finance_income_sources FOR DELETE USING (auth.uid() = user_id);

-- finance_investments
DROP POLICY IF EXISTS "Users can view own finance_investments" ON public.finance_investments;
DROP POLICY IF EXISTS "Users can insert own finance_investments" ON public.finance_investments;
DROP POLICY IF EXISTS "Users can update own finance_investments" ON public.finance_investments;
DROP POLICY IF EXISTS "Users can delete own finance_investments" ON public.finance_investments;

CREATE POLICY "Users can view own finance_investments" ON public.finance_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_investments" ON public.finance_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_investments" ON public.finance_investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_investments" ON public.finance_investments FOR DELETE USING (auth.uid() = user_id);

-- Also fix non-finance tables that have same issue
-- anuncios
DROP POLICY IF EXISTS "Users can view own anuncios" ON public.anuncios;
DROP POLICY IF EXISTS "Users can insert own anuncios" ON public.anuncios;
DROP POLICY IF EXISTS "Users can update own anuncios" ON public.anuncios;
DROP POLICY IF EXISTS "Users can delete own anuncios" ON public.anuncios;

CREATE POLICY "Users can view own anuncios" ON public.anuncios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anuncios" ON public.anuncios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anuncios" ON public.anuncios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anuncios" ON public.anuncios FOR DELETE USING (auth.uid() = user_id);

-- metas
DROP POLICY IF EXISTS "Users can view own metas" ON public.metas;
DROP POLICY IF EXISTS "Users can insert own metas" ON public.metas;
DROP POLICY IF EXISTS "Users can update own metas" ON public.metas;
DROP POLICY IF EXISTS "Users can delete own metas" ON public.metas;

CREATE POLICY "Users can view own metas" ON public.metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metas" ON public.metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metas" ON public.metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metas" ON public.metas FOR DELETE USING (auth.uid() = user_id);

-- pedidos
DROP POLICY IF EXISTS "Users can view own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can insert own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can update own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can delete own pedidos" ON public.pedidos;

CREATE POLICY "Users can view own pedidos" ON public.pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pedidos" ON public.pedidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pedidos" ON public.pedidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pedidos" ON public.pedidos FOR DELETE USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
