
-- Fix ALL RLS policies to be PERMISSIVE (drop restrictive ones, recreate as permissive)

-- ========== anuncios ==========
DROP POLICY IF EXISTS "Users can view own anuncios" ON anuncios;
DROP POLICY IF EXISTS "Users can insert own anuncios" ON anuncios;
DROP POLICY IF EXISTS "Users can update own anuncios" ON anuncios;
DROP POLICY IF EXISTS "Users can delete own anuncios" ON anuncios;
CREATE POLICY "anuncios_select" ON anuncios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anuncios_insert" ON anuncios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anuncios_update" ON anuncios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anuncios_delete" ON anuncios FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== pedidos ==========
DROP POLICY IF EXISTS "Users can view own pedidos" ON pedidos;
DROP POLICY IF EXISTS "Users can insert own pedidos" ON pedidos;
DROP POLICY IF EXISTS "Users can update own pedidos" ON pedidos;
DROP POLICY IF EXISTS "Users can delete own pedidos" ON pedidos;
CREATE POLICY "pedidos_select" ON pedidos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pedidos_delete" ON pedidos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== metas ==========
DROP POLICY IF EXISTS "Users can view own metas" ON metas;
DROP POLICY IF EXISTS "Users can insert own metas" ON metas;
DROP POLICY IF EXISTS "Users can update own metas" ON metas;
DROP POLICY IF EXISTS "Users can delete own metas" ON metas;
CREATE POLICY "metas_select" ON metas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "metas_insert" ON metas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "metas_update" ON metas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "metas_delete" ON metas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== profiles ==========
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_accounts ==========
DROP POLICY IF EXISTS "Users can view own finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can insert own finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can update own finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can delete own finance_accounts" ON finance_accounts;
CREATE POLICY "fa_select" ON finance_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fa_insert" ON finance_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fa_update" ON finance_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fa_delete" ON finance_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_transactions ==========
DROP POLICY IF EXISTS "Users can view own finance_transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can insert own finance_transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can update own finance_transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can delete own finance_transactions" ON finance_transactions;
CREATE POLICY "ft_select" ON finance_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ft_insert" ON finance_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ft_update" ON finance_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ft_delete" ON finance_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_transfers ==========
DROP POLICY IF EXISTS "Users can view own finance_transfers" ON finance_transfers;
DROP POLICY IF EXISTS "Users can insert own finance_transfers" ON finance_transfers;
DROP POLICY IF EXISTS "Users can update own finance_transfers" ON finance_transfers;
DROP POLICY IF EXISTS "Users can delete own finance_transfers" ON finance_transfers;
CREATE POLICY "ftr_select" ON finance_transfers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ftr_insert" ON finance_transfers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ftr_update" ON finance_transfers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ftr_delete" ON finance_transfers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_bills ==========
DROP POLICY IF EXISTS "Users can view own finance_bills" ON finance_bills;
DROP POLICY IF EXISTS "Users can insert own finance_bills" ON finance_bills;
DROP POLICY IF EXISTS "Users can update own finance_bills" ON finance_bills;
DROP POLICY IF EXISTS "Users can delete own finance_bills" ON finance_bills;
CREATE POLICY "fb_select" ON finance_bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fb_insert" ON finance_bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fb_update" ON finance_bills FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fb_delete" ON finance_bills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_budgets ==========
DROP POLICY IF EXISTS "Users can view own finance_budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can insert own finance_budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can update own finance_budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can delete own finance_budgets" ON finance_budgets;
CREATE POLICY "fbu_select" ON finance_budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fbu_insert" ON finance_budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fbu_update" ON finance_budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fbu_delete" ON finance_budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_categories ==========
DROP POLICY IF EXISTS "Users can view own finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can insert own finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can update own finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can delete own finance_categories" ON finance_categories;
CREATE POLICY "fc_select" ON finance_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fc_insert" ON finance_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fc_update" ON finance_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fc_delete" ON finance_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_envelopes ==========
DROP POLICY IF EXISTS "Users can view own finance_envelopes" ON finance_envelopes;
DROP POLICY IF EXISTS "Users can insert own finance_envelopes" ON finance_envelopes;
DROP POLICY IF EXISTS "Users can update own finance_envelopes" ON finance_envelopes;
DROP POLICY IF EXISTS "Users can delete own finance_envelopes" ON finance_envelopes;
CREATE POLICY "fe_select" ON finance_envelopes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fe_insert" ON finance_envelopes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fe_update" ON finance_envelopes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fe_delete" ON finance_envelopes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_distribution_rules ==========
DROP POLICY IF EXISTS "Users can view own finance_distribution_rules" ON finance_distribution_rules;
DROP POLICY IF EXISTS "Users can insert own finance_distribution_rules" ON finance_distribution_rules;
DROP POLICY IF EXISTS "Users can update own finance_distribution_rules" ON finance_distribution_rules;
DROP POLICY IF EXISTS "Users can delete own finance_distribution_rules" ON finance_distribution_rules;
CREATE POLICY "fdr_select" ON finance_distribution_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fdr_insert" ON finance_distribution_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fdr_update" ON finance_distribution_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fdr_delete" ON finance_distribution_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_investments ==========
DROP POLICY IF EXISTS "Users can view own finance_investments" ON finance_investments;
DROP POLICY IF EXISTS "Users can insert own finance_investments" ON finance_investments;
DROP POLICY IF EXISTS "Users can update own finance_investments" ON finance_investments;
DROP POLICY IF EXISTS "Users can delete own finance_investments" ON finance_investments;
CREATE POLICY "fi_select" ON finance_investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fi_insert" ON finance_investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fi_update" ON finance_investments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fi_delete" ON finance_investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_income_sources ==========
DROP POLICY IF EXISTS "Users can view own finance_income_sources" ON finance_income_sources;
DROP POLICY IF EXISTS "Users can insert own finance_income_sources" ON finance_income_sources;
DROP POLICY IF EXISTS "Users can update own finance_income_sources" ON finance_income_sources;
DROP POLICY IF EXISTS "Users can delete own finance_income_sources" ON finance_income_sources;
CREATE POLICY "fis_select" ON finance_income_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fis_insert" ON finance_income_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fis_update" ON finance_income_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fis_delete" ON finance_income_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_receivables ==========
DROP POLICY IF EXISTS "Users can view own finance_receivables" ON finance_receivables;
DROP POLICY IF EXISTS "Users can insert own finance_receivables" ON finance_receivables;
DROP POLICY IF EXISTS "Users can update own finance_receivables" ON finance_receivables;
DROP POLICY IF EXISTS "Users can delete own finance_receivables" ON finance_receivables;
CREATE POLICY "fr_select" ON finance_receivables FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fr_insert" ON finance_receivables FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fr_update" ON finance_receivables FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fr_delete" ON finance_receivables FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== finance_receivable_installments ==========
DROP POLICY IF EXISTS "Users can view own finance_receivable_installments" ON finance_receivable_installments;
DROP POLICY IF EXISTS "Users can insert own finance_receivable_installments" ON finance_receivable_installments;
DROP POLICY IF EXISTS "Users can update own finance_receivable_installments" ON finance_receivable_installments;
DROP POLICY IF EXISTS "Users can delete own finance_receivable_installments" ON finance_receivable_installments;
CREATE POLICY "fri_select" ON finance_receivable_installments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fri_insert" ON finance_receivable_installments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fri_update" ON finance_receivable_installments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fri_delete" ON finance_receivable_installments FOR DELETE TO authenticated USING (auth.uid() = user_id);
