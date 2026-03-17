

## Correção de Bugs de Alta Severidade

### 1. Select no PagamentoDialog sem proteção de foco
**Arquivo:** `src/components/PagamentoDialog.tsx`
- Adicionar `onCloseAutoFocus={(e) => e.preventDefault()}` no `<SelectContent>` (conta destino)
- Adicionar `key={open ? 'open' : 'closed'}` no `<DialogContent>`

### 2. Select na ListaTelefonicaDialog sem proteção de foco
**Arquivo:** `src/components/ListaTelefonicaDialog.tsx`
- Adicionar `onCloseAutoFocus={(e) => e.preventDefault()}` no `<SelectContent>` (plataforma)
- Adicionar `key={open ? 'open' : 'closed'}` no `<DialogContent>`

### 3. Exclusão de pedido sem confirmação
**Arquivo:** `src/pages/Pedidos.tsx`
- Importar `AlertDialog` e componentes relacionados
- Adicionar estado para armazenar o pedido a ser excluído
- Substituir a exclusão direta no botão Trash2 por abertura do AlertDialog
- Renderizar o AlertDialog com mensagem "Tem certeza que deseja excluir este pedido?" e botões Cancelar/Excluir

