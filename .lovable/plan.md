

## Plan: Corrigir RLS -- Converter todas as policies para PERMISSIVE

O problema persiste: **todas as tabelas ainda estao com policies RESTRICTIVE** (`Permissive: No`). A migration anterior nao resolveu porque provavelmente recriou as policies ainda como RESTRICTIVE.

### Acao unica: Migration SQL

Dropar e recriar TODAS as policies de TODAS as 16 tabelas usando a sintaxe correta do PostgreSQL para garantir que sejam PERMISSIVE (que e o default do `CREATE POLICY` sem o modificador `AS RESTRICTIVE`).

Tabelas afetadas:
- `pedidos`, `anuncios`, `metas`, `profiles`
- `finance_accounts`, `finance_bills`, `finance_budgets`, `finance_categories`
- `finance_distribution_rules`, `finance_envelopes`, `finance_income_sources`
- `finance_investments`, `finance_receivable_installments`, `finance_receivables`
- `finance_transactions`, `finance_transfers`

Para cada tabela:
1. `DROP POLICY IF EXISTS` nas 4 policies (sel, ins, upd, del)
2. `CREATE POLICY` sem `AS RESTRICTIVE` (default = PERMISSIVE) com `USING (auth.uid() = user_id)` / `WITH CHECK (auth.uid() = user_id)`

Excecao: `profiles` nao tem policy de DELETE, entao so recria sel, ins, upd.

Nenhuma alteracao de codigo necessaria.

