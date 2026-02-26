

## Correções no Dashboard

### 1. Corrigir cálculo do Lucro
**Atual:** `Lucro = soma(valor dos pagos) - frete Five dos pagos`
**Correto:** `Lucro = soma(valor dos pagos) - investimento em anúncios - (R$35 × pedidos perdidos Five)`
- Pedidos pagos: o frete volta, então não desconta
- Pedidos perdidos na plataforma Five: prejuízo de R$35 cada
- Subtrair o total investido em anúncios do período

### 2. Adicionar métricas faltantes
- **Aguardando Pagamento**: pedidos com `pedido_chegou = true`, `pedido_pago = false`, `pedido_perdido = false`
- **Em Prioridade**: pedidos com `cliente_cobrado = true`, `pedido_pago = false`, `pedido_perdido = false`

### 3. Corrigir gráfico "Pedidos Feitos" (agrupamento por dia)
- Quando agrupado por "dia", gerar os últimos 14 dias fixos (de hoje - 13 até hoje)
- Preencher dias sem pedidos com `count: 0`
- Ordenar do mais antigo para o mais recente

### Arquivo alterado
- `src/pages/Dashboard.tsx`

