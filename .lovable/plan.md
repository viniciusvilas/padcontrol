

## Problema

Todas as tabelas financeiras possuem políticas RLS do tipo **RESTRICTIVE** (`Permissive: No`). No PostgreSQL, políticas RESTRICTIVE sem uma contraparte PERMISSIVE bloqueiam **100% do acesso** aos dados. Este é um problema já identificado anteriormente no projeto e que precisa ser corrigido definitivamente em todas as tabelas.

## Solução

Recriar todas as políticas RLS das tabelas financeiras como **PERMISSIVE** (o padrão do PostgreSQL). Isso envolve dropar as políticas existentes e recriá-las com a mesma lógica, mas sem a cláusula RESTRICTIVE.

### Tabelas afetadas (9 tabelas financeiras)

- `finance_accounts`
- `finance_transactions`
- `finance_transfers`
- `finance_bills`
- `finance_budgets`
- `finance_categories`
- `finance_envelopes`
- `finance_distribution_rules`
- `finance_investments`
- `finance_income_sources`
- `finance_receivables`
- `finance_receivable_installments`

### Ação

Uma única migration SQL que para cada tabela:
1. `DROP POLICY` das 4 políticas existentes (SELECT, INSERT, UPDATE, DELETE)
2. `CREATE POLICY` com a mesma lógica mas como PERMISSIVE (padrão)

Nenhuma alteração de código frontend necessária.

