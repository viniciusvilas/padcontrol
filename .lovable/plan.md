

## Plan: Pagamento parcial com valor e conta destino

### 1. Migration SQL -- adicionar colunas na tabela `pedidos`

- `valor_pago` (numeric, default 0) -- valor efetivamente recebido
- `conta_destino_id` (uuid, nullable, FK para finance_accounts) -- conta onde o dinheiro caiu

### 2. Componente Dialog de Pagamento (`src/components/PagamentoDialog.tsx`)

Novo dialog que abre ao clicar "Pago" em qualquer lugar (Cobranca, Pedidos, etc.):
- Campo **Valor Pago** (pre-preenchido com o valor total do pedido, editavel)
- Select **Conta Destino** (lista as contas ativas do usuario via `useFinanceAccounts`)
- Botoes Confirmar / Cancelar
- Ao confirmar: atualiza `pedido_pago = true`, `status = "pago"`, `valor_pago`, `conta_destino_id`

### 3. Atualizar paginas que usam "marcar como pago"

- **Cobranca.tsx**: substituir chamada direta `marcarPago(id)` por abrir o PagamentoDialog
- **Pedidos.tsx**: o checkbox de `pedido_pago` tambem abre o dialog (apenas ao marcar true)
- **PrestesAChegar.tsx**: se tiver botao de pago, tambem usar o dialog

### 4. Exibir valor pago na tabela

- Na coluna Valor das tabelas, mostrar o valor pago quando diferente do valor total (ex: "R$ 201,50 (pago: R$ 150,00)")

### Detalhes tecnicos

- O hook `useFinanceAccounts` ja existe e retorna `activeAccounts` com id/name
- O dialog sera um componente reutilizavel recebendo `pedido`, `open`, `onOpenChange`, `onSuccess`
- Nao cria transacao financeira automaticamente (apenas registra no pedido para qual conta foi)

