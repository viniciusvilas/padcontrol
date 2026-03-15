# CHANGELOG — PAD Manager

Registro de todos os módulos e funcionalidades implementados no projeto.

---

## 📦 Módulo de Vendas (Pay After Delivery)

Sistema completo de gestão de pedidos PAD com fluxo de acompanhamento do ciclo de vida do pedido.

### Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Todos os Pedidos — listagem geral com busca por nome, produto e CPF |
| `/prestes-a-chegar` | Pedidos próximos da entrega |
| `/falta-chamar` | Pedidos que ainda não foram chamados para retirada |
| `/cobranca` | Pedidos em fase de cobrança |
| `/prioridade` | Pedidos prioritários |
| `/pagos` | Pedidos já pagos |
| `/perdidos` | Pedidos perdidos / cancelados |

### Funcionalidades

- CRUD completo de pedidos com dialog de formulário
- Importação em massa de pedidos via planilha
- Lista telefônica para contato rápido com clientes
- Registro de pagamento com dialog dedicado
- Marcação de cliente problemático
- Controle de rastreio e status de entrega
- Campo de conta destino (vinculado a `finance_accounts`)
- Busca por nome do cliente, produto ou CPF

### Páginas Complementares

| Rota | Descrição |
|------|-----------|
| `/anuncios` | Registro de investimento diário em anúncios |
| `/dashboard` | Dashboard com métricas: faturamento, CPA médio, CPA 7d, investimento com imposto (12,5%), projeção |
| `/projecao` | Projeção de vendas e faturamento |
| `/nivel` | Sistema de níveis baseado em faturamento acumulado |
| `/install` | Instruções para instalação do PWA |

---

## 💰 Módulo de Finanças Pessoais

Módulo independente e completo de gestão financeira pessoal/empresarial.

### Páginas

| Rota | Descrição |
|------|-----------|
| `/financas` | Dashboard financeiro consolidado com cards de saldo, receitas, despesas, alertas de envelopes e card de valores a receber |
| `/financas/transacoes` | CRUD de transações (receitas e despesas) com filtros por conta, categoria e período |
| `/financas/contas-a-pagar` | Gestão de contas a pagar com suporte a recorrência (mensal, semanal, anual). Gera despesa automaticamente ao marcar como pago |
| `/financas/orcamento` | Orçamento mensal por categoria com limites e acompanhamento de gastos |
| `/financas/investimentos` | Controle de investimentos ativos com rentabilidade automática |
| `/financas/a-receber` | Valores a receber com sistema de parcelas. Ao marcar parcela como recebida, cria transação de receita automaticamente |
| `/financas/projecoes` | Projeções financeiras semanais e mensais |
| `/financas/categorias` | Categorias customizáveis (receita, despesa ou ambos) com cor e status ativo/inativo |
| `/financas/contas` | Gestão de contas bancárias e de plataforma |

### Sistema de 6 Contas

| Conta | Tipo | Titular |
|-------|------|---------|
| PJ Vinicius | PJ | Vinicius |
| PF Vinicius | PF | Vinicius |
| PJ Esposa | PJ | Esposa |
| PF Esposa | PF | Esposa |
| Plataforma Keed | Plataforma | Esposa |
| Plataforma Five | Plataforma | Vinicius |

- Saldo calculado dinamicamente: saldo inicial + receitas − despesas + transferências recebidas − transferências enviadas
- Suporte a transferências entre contas

### Sistema de Envelopes

- Envelopes vinculados a contas específicas para alocação de metas
- Regras de distribuição automática (percentual por envelope) aplicadas à conta **PJ Esposa**
- Cálculo de **Dinheiro Livre** = Saldo da conta − Total alocado nos envelopes
- Alertas no sidebar quando envelopes estão abaixo de 20% da meta

### Categorias Customizáveis (`finance_categories`)

- Tipos: Receita, Despesa ou Ambos
- Campos: nome, tipo, cor, ícone, status ativo/inativo
- Utilizadas em transações, contas a pagar e orçamentos

### Integração Vendas → Finanças

- Botão **"Sincronizar Vendas"** no dashboard financeiro
- Importa pedidos pagos como transações de receita
- Vincula automaticamente à conta de plataforma correspondente (Keed ou Five)
- Usa ID do pedido no campo `notes` (formato `pedido:ID`) para evitar duplicatas
- Prioriza `data_entrega` como data de recebimento

### Valores a Receber (`finance_receivables` + `finance_receivable_installments`)

- Gestão de contratos e vendas parceladas (consultorias, serviços)
- Criação de parcelas mensais automáticas ou personalizadas
- Ao marcar parcela como recebida → cria transação de receita na conta vinculada
- Card dedicado no Dashboard Financeiro
- Alimenta projeções semanais/mensais

---

## 🗄️ Tabelas no Backend (Lovable Cloud)

| Tabela | Descrição |
|--------|-----------|
| `pedidos` | Pedidos PAD |
| `anuncios` | Investimento diário em anúncios |
| `metas` | Metas mensais de faturamento e pedidos |
| `profiles` | Perfis de usuário com faturamento acumulado |
| `finance_transactions` | Transações financeiras |
| `finance_bills` | Contas a pagar |
| `finance_investments` | Investimentos |
| `finance_budgets` | Orçamentos mensais por categoria |
| `finance_categories` | Categorias customizáveis |
| `finance_accounts` | Contas bancárias e de plataforma |
| `finance_transfers` | Transferências entre contas |
| `finance_envelopes` | Envelopes de alocação |
| `finance_distribution_rules` | Regras de distribuição automática |
| `finance_receivables` | Valores a receber |
| `finance_receivable_installments` | Parcelas dos valores a receber |
| `finance_income_sources` | Fontes de renda |

Todas as tabelas possuem RLS habilitado com políticas permissivas por `user_id`.

---

## 🔐 Autenticação

- Login e cadastro por e-mail/senha
- Confirmação de e-mail obrigatória
- Proteção de rotas via `AuthContext`

---

## 📱 PWA

- Manifesto e service worker configurados
- Ícones 192x192 e 512x512
- Página `/install` com instruções de instalação

---

*Última atualização: 15 de março de 2026*
