
-- Drop ALL existing restrictive policies and recreate as permissive (default)
-- PEDIDOS
DROP POLICY IF EXISTS "pedidos_sel" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_ins" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_upd" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_del" ON public.pedidos;
CREATE POLICY "pedidos_sel" ON public.pedidos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pedidos_ins" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pedidos_upd" ON public.pedidos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pedidos_del" ON public.pedidos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ANUNCIOS
DROP POLICY IF EXISTS "anuncios_sel" ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_ins" ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_upd" ON public.anuncios;
DROP POLICY IF EXISTS "anuncios_del" ON public.anuncios;
CREATE POLICY "anuncios_sel" ON public.anuncios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anuncios_ins" ON public.anuncios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anuncios_upd" ON public.anuncios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anuncios_del" ON public.anuncios FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- METAS
DROP POLICY IF EXISTS "metas_sel" ON public.metas;
DROP POLICY IF EXISTS "metas_ins" ON public.metas;
DROP POLICY IF EXISTS "metas_upd" ON public.metas;
DROP POLICY IF EXISTS "metas_del" ON public.metas;
CREATE POLICY "metas_sel" ON public.metas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "metas_ins" ON public.metas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "metas_upd" ON public.metas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "metas_del" ON public.metas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROFILES
DROP POLICY IF EXISTS "profiles_sel" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upd" ON public.profiles;
CREATE POLICY "profiles_sel" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_ins" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_upd" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_ACCOUNTS
DROP POLICY IF EXISTS "finance_accounts_sel" ON public.finance_accounts;
DROP POLICY IF EXISTS "finance_accounts_ins" ON public.finance_accounts;
DROP POLICY IF EXISTS "finance_accounts_upd" ON public.finance_accounts;
DROP POLICY IF EXISTS "finance_accounts_del" ON public.finance_accounts;
CREATE POLICY "finance_accounts_sel" ON public.finance_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_accounts_ins" ON public.finance_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_accounts_upd" ON public.finance_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_accounts_del" ON public.finance_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_BILLS
DROP POLICY IF EXISTS "finance_bills_sel" ON public.finance_bills;
DROP POLICY IF EXISTS "finance_bills_ins" ON public.finance_bills;
DROP POLICY IF EXISTS "finance_bills_upd" ON public.finance_bills;
DROP POLICY IF EXISTS "finance_bills_del" ON public.finance_bills;
CREATE POLICY "finance_bills_sel" ON public.finance_bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_bills_ins" ON public.finance_bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_bills_upd" ON public.finance_bills FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_bills_del" ON public.finance_bills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_BUDGETS
DROP POLICY IF EXISTS "finance_budgets_sel" ON public.finance_budgets;
DROP POLICY IF EXISTS "finance_budgets_ins" ON public.finance_budgets;
DROP POLICY IF EXISTS "finance_budgets_upd" ON public.finance_budgets;
DROP POLICY IF EXISTS "finance_budgets_del" ON public.finance_budgets;
CREATE POLICY "finance_budgets_sel" ON public.finance_budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_budgets_ins" ON public.finance_budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_budgets_upd" ON public.finance_budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_budgets_del" ON public.finance_budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_CATEGORIES
DROP POLICY IF EXISTS "finance_categories_sel" ON public.finance_categories;
DROP POLICY IF EXISTS "finance_categories_ins" ON public.finance_categories;
DROP POLICY IF EXISTS "finance_categories_upd" ON public.finance_categories;
DROP POLICY IF EXISTS "finance_categories_del" ON public.finance_categories;
CREATE POLICY "finance_categories_sel" ON public.finance_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_categories_ins" ON public.finance_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_categories_upd" ON public.finance_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_categories_del" ON public.finance_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_DISTRIBUTION_RULES
DROP POLICY IF EXISTS "finance_distribution_rules_sel" ON public.finance_distribution_rules;
DROP POLICY IF EXISTS "finance_distribution_rules_ins" ON public.finance_distribution_rules;
DROP POLICY IF EXISTS "finance_distribution_rules_upd" ON public.finance_distribution_rules;
DROP POLICY IF EXISTS "finance_distribution_rules_del" ON public.finance_distribution_rules;
CREATE POLICY "finance_distribution_rules_sel" ON public.finance_distribution_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_distribution_rules_ins" ON public.finance_distribution_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_distribution_rules_upd" ON public.finance_distribution_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_distribution_rules_del" ON public.finance_distribution_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_ENVELOPES
DROP POLICY IF EXISTS "finance_envelopes_sel" ON public.finance_envelopes;
DROP POLICY IF EXISTS "finance_envelopes_ins" ON public.finance_envelopes;
DROP POLICY IF EXISTS "finance_envelopes_upd" ON public.finance_envelopes;
DROP POLICY IF EXISTS "finance_envelopes_del" ON public.finance_envelopes;
CREATE POLICY "finance_envelopes_sel" ON public.finance_envelopes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_envelopes_ins" ON public.finance_envelopes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_envelopes_upd" ON public.finance_envelopes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_envelopes_del" ON public.finance_envelopes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_INCOME_SOURCES
DROP POLICY IF EXISTS "finance_income_sources_sel" ON public.finance_income_sources;
DROP POLICY IF EXISTS "finance_income_sources_ins" ON public.finance_income_sources;
DROP POLICY IF EXISTS "finance_income_sources_upd" ON public.finance_income_sources;
DROP POLICY IF EXISTS "finance_income_sources_del" ON public.finance_income_sources;
CREATE POLICY "finance_income_sources_sel" ON public.finance_income_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_income_sources_ins" ON public.finance_income_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_income_sources_upd" ON public.finance_income_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_income_sources_del" ON public.finance_income_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_INVESTMENTS
DROP POLICY IF EXISTS "finance_investments_sel" ON public.finance_investments;
DROP POLICY IF EXISTS "finance_investments_ins" ON public.finance_investments;
DROP POLICY IF EXISTS "finance_investments_upd" ON public.finance_investments;
DROP POLICY IF EXISTS "finance_investments_del" ON public.finance_investments;
CREATE POLICY "finance_investments_sel" ON public.finance_investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_investments_ins" ON public.finance_investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_investments_upd" ON public.finance_investments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_investments_del" ON public.finance_investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_RECEIVABLE_INSTALLMENTS
DROP POLICY IF EXISTS "finance_receivable_installments_sel" ON public.finance_receivable_installments;
DROP POLICY IF EXISTS "finance_receivable_installments_ins" ON public.finance_receivable_installments;
DROP POLICY IF EXISTS "finance_receivable_installments_upd" ON public.finance_receivable_installments;
DROP POLICY IF EXISTS "finance_receivable_installments_del" ON public.finance_receivable_installments;
CREATE POLICY "finance_receivable_installments_sel" ON public.finance_receivable_installments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_receivable_installments_ins" ON public.finance_receivable_installments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_receivable_installments_upd" ON public.finance_receivable_installments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_receivable_installments_del" ON public.finance_receivable_installments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_RECEIVABLES
DROP POLICY IF EXISTS "finance_receivables_sel" ON public.finance_receivables;
DROP POLICY IF EXISTS "finance_receivables_ins" ON public.finance_receivables;
DROP POLICY IF EXISTS "finance_receivables_upd" ON public.finance_receivables;
DROP POLICY IF EXISTS "finance_receivables_del" ON public.finance_receivables;
CREATE POLICY "finance_receivables_sel" ON public.finance_receivables FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_receivables_ins" ON public.finance_receivables FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_receivables_upd" ON public.finance_receivables FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_receivables_del" ON public.finance_receivables FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_TRANSACTIONS
DROP POLICY IF EXISTS "finance_transactions_sel" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_ins" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_upd" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_del" ON public.finance_transactions;
CREATE POLICY "finance_transactions_sel" ON public.finance_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_transactions_ins" ON public.finance_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_transactions_upd" ON public.finance_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_transactions_del" ON public.finance_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_TRANSFERS
DROP POLICY IF EXISTS "finance_transfers_sel" ON public.finance_transfers;
DROP POLICY IF EXISTS "finance_transfers_ins" ON public.finance_transfers;
DROP POLICY IF EXISTS "finance_transfers_upd" ON public.finance_transfers;
DROP POLICY IF EXISTS "finance_transfers_del" ON public.finance_transfers;
CREATE POLICY "finance_transfers_sel" ON public.finance_transfers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_transfers_ins" ON public.finance_transfers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_transfers_upd" ON public.finance_transfers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "finance_transfers_del" ON public.finance_transfers FOR DELETE TO authenticated USING (auth.uid() = user_id);
