

## Plano: Registrar data de entrega ao marcar pedido como chegou

### Problema
Atualmente, a página Prioridade calcula os dias usando `p.data` (data do pedido). Se um pedido atrasa para chegar, os dias ficam inflados e ele aparece como prioridade alta indevidamente.

### Solução
Adicionar coluna `data_entrega` (date, nullable) na tabela `pedidos`. Sempre que `pedido_chegou` for marcado como `true`, registrar `data_entrega = hoje`. A página Prioridade usará `data_entrega` em vez de `data` para calcular os dias desde a entrega.

### Implementação

1. **Migration**: Adicionar coluna `data_entrega` (date, nullable) à tabela `pedidos`

2. **`src/pages/PrestesAChegar.tsx`**: Na função `marcarChegou`, incluir `data_entrega: new Date().toISOString().split('T')[0]` no update

3. **`src/pages/Pedidos.tsx`**: No `toggleField`, quando o campo for `pedido_chegou`, setar `data_entrega` para a data de hoje se ativando, ou `null` se desativando

4. **`src/pages/Prioridade.tsx`**: Alterar `diasDesdeCobranca` para usar `p.data_entrega ?? p.data` como fallback (compatibilidade com pedidos antigos sem data_entrega)

5. **`src/components/PedidoFormDialog.tsx`**: Ao marcar `pedido_chegou` no formulário, também setar `data_entrega`

