
-- Fix ALL RLS policies from RESTRICTIVE to PERMISSIVE for every table

-- finance_accounts
DROP POLICY IF EXISTS "Users can view own finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can insert own finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can update own finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can delete own finance_accounts" ON finance_accounts;
CREATE POLICY "Users can view own finance_accounts" ON finance_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_accounts" ON finance_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_accounts" ON finance_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_accounts" ON finance_accounts FOR DELETE USING (auth.uid() = user_id);

-- finance_transactions
DROP POLICY IF EXISTS "Users can view own finance_transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can insert own finance_transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can update own finance_transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can delete own finance_transactions" ON finance_transactions;
CREATE POLICY "Users can view own finance_transactions" ON finance_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_transactions" ON finance_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_transactions" ON finance_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_transactions" ON finance_transactions FOR DELETE USING (auth.uid() = user_id);

-- finance_transfers
DROP POLICY IF EXISTS "Users can view own finance_transfers" ON finance_transfers;
DROP POLICY IF EXISTS "Users can insert own finance_transfers" ON finance_transfers;
DROP POLICY IF EXISTS "Users can update own finance_transfers" ON finance_transfers;
DROP POLICY IF EXISTS "Users can delete own finance_transfers" ON finance_transfers;
CREATE POLICY "Users can view own finance_transfers" ON finance_transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_transfers" ON finance_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_transfers" ON finance_transfers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_transfers" ON finance_transfers FOR DELETE USING (auth.uid() = user_id);

-- finance_bills
DROP POLICY IF EXISTS "Users can view own finance_bills" ON finance_bills;
DROP POLICY IF EXISTS "Users can insert own finance_bills" ON finance_bills;
DROP POLICY IF EXISTS "Users can update own finance_bills" ON finance_bills;
DROP POLICY IF EXISTS "Users can delete own finance_bills" ON finance_bills;
CREATE POLICY "Users can view own finance_bills" ON finance_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_bills" ON finance_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_bills" ON finance_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_bills" ON finance_bills FOR DELETE USING (auth.uid() = user_id);

-- finance_budgets
DROP POLICY IF EXISTS "Users can view own finance_budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can insert own finance_budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can update own finance_budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can delete own finance_budgets" ON finance_budgets;
CREATE POLICY "Users can view own finance_budgets" ON finance_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_budgets" ON finance_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_budgets" ON finance_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_budgets" ON finance_budgets FOR DELETE USING (auth.uid() = user_id);

-- finance_categories
DROP POLICY IF EXISTS "Users can view own finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can insert own finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can update own finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can delete own finance_categories" ON finance_categories;
CREATE POLICY "Users can view own finance_categories" ON finance_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_categories" ON finance_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_categories" ON finance_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_categories" ON finance_categories FOR DELETE USING (auth.uid() = user_id);

-- finance_envelopes
DROP POLICY IF EXISTS "Users can view own finance_envelopes" ON finance_envelopes;
DROP POLICY IF EXISTS "Users can insert own finance_envelopes" ON finance_envelopes;
DROP POLICY IF EXISTS "Users can update own finance_envelopes" ON finance_envelopes;
DROP POLICY IF EXISTS "Users can delete own finance_envelopes" ON finance_envelopes;
CREATE POLICY "Users can view own finance_envelopes" ON finance_envelopes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_envelopes" ON finance_envelopes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_envelopes" ON finance_envelopes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_envelopes" ON finance_envelopes FOR DELETE USING (auth.uid() = user_id);

-- finance_distribution_rules
DROP POLICY IF EXISTS "Users can view own finance_distribution_rules" ON finance_distribution_rules;
DROP POLICY IF EXISTS "Users can insert own finance_distribution_rules" ON finance_distribution_rules;
DROP POLICY IF EXISTS "Users can update own finance_distribution_rules" ON finance_distribution_rules;
DROP POLICY IF EXISTS "Users can delete own finance_distribution_rules" ON finance_distribution_rules;
CREATE POLICY "Users can view own finance_distribution_rules" ON finance_distribution_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_distribution_rules" ON finance_distribution_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_distribution_rules" ON finance_distribution_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_distribution_rules" ON finance_distribution_rules FOR DELETE USING (auth.uid() = user_id);

-- finance_investments
DROP POLICY IF EXISTS "Users can view own finance_investments" ON finance_investments;
DROP POLICY IF EXISTS "Users can insert own finance_investments" ON finance_investments;
DROP POLICY IF EXISTS "Users can update own finance_investments" ON finance_investments;
DROP POLICY IF EXISTS "Users can delete own finance_investments" ON finance_investments;
CREATE POLICY "Users can view own finance_investments" ON finance_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_investments" ON finance_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_investments" ON finance_investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_investments" ON finance_investments FOR DELETE USING (auth.uid() = user_id);

-- finance_income_sources
DROP POLICY IF EXISTS "Users can view own finance_income_sources" ON finance_income_sources;
DROP POLICY IF EXISTS "Users can insert own finance_income_sources" ON finance_income_sources;
DROP POLICY IF EXISTS "Users can update own finance_income_sources" ON finance_income_sources;
DROP POLICY IF EXISTS "Users can delete own finance_income_sources" ON finance_income_sources;
CREATE POLICY "Users can view own finance_income_sources" ON finance_income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_income_sources" ON finance_income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_income_sources" ON finance_income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_income_sources" ON finance_income_sources FOR DELETE USING (auth.uid() = user_id);

-- finance_receivables
DROP POLICY IF EXISTS "Users can view own finance_receivables" ON finance_receivables;
DROP POLICY IF EXISTS "Users can insert own finance_receivables" ON finance_receivables;
DROP POLICY IF EXISTS "Users can update own finance_receivables" ON finance_receivables;
DROP POLICY IF EXISTS "Users can delete own finance_receivables" ON finance_receivables;
CREATE POLICY "Users can view own finance_receivables" ON finance_receivables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_receivables" ON finance_receivables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_receivables" ON finance_receivables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_receivables" ON finance_receivables FOR DELETE USING (auth.uid() = user_id);

-- finance_receivable_installments
DROP POLICY IF EXISTS "Users can view own finance_receivable_installments" ON finance_receivable_installments;
DROP POLICY IF EXISTS "Users can insert own finance_receivable_installments" ON finance_receivable_installments;
DROP POLICY IF EXISTS "Users can update own finance_receivable_installments" ON finance_receivable_installments;
DROP POLICY IF EXISTS "Users can delete own finance_receivable_installments" ON finance_receivable_installments;
CREATE POLICY "Users can view own finance_receivable_installments" ON finance_receivable_installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_receivable_installments" ON finance_receivable_installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_receivable_installments" ON finance_receivable_installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance_receivable_installments" ON finance_receivable_installments FOR DELETE USING (auth.uid() = user_id);

-- Also fix non-finance tables: anuncios, pedidos, metas, profiles
DROP POLICY IF EXISTS "Users can view own anuncios" ON anuncios;
DROP POLICY IF EXISTS "Users can insert own anuncios" ON anuncios;
DROP POLICY IF EXISTS "Users can update own anuncios" ON anuncios;
DROP POLICY IF EXISTS "Users can delete own anuncios" ON anuncios;
CREATE POLICY "Users can view own anuncios" ON anuncios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anuncios" ON anuncios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anuncios" ON anuncios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anuncios" ON anuncios FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own pedidos" ON pedidos;
DROP POLICY IF EXISTS "Users can insert own pedidos" ON pedidos;
DROP POLICY IF EXISTS "Users can update own pedidos" ON pedidos;
DROP POLICY IF EXISTS "Users can delete own pedidos" ON pedidos;
CREATE POLICY "Users can view own pedidos" ON pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pedidos" ON pedidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pedidos" ON pedidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pedidos" ON pedidos FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own metas" ON metas;
DROP POLICY IF EXISTS "Users can insert own metas" ON metas;
DROP POLICY IF EXISTS "Users can update own metas" ON metas;
DROP POLICY IF EXISTS "Users can delete own metas" ON metas;
CREATE POLICY "Users can view own metas" ON metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metas" ON metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metas" ON metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metas" ON metas FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
