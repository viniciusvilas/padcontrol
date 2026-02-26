

## Plano: Anúncios, Dashboard reformulado e ações rápidas na tabela de Pedidos

### 1. Tela de Anúncios (`src/pages/Anuncios.tsx`) — reescrever
- CRUD de registros diários de anúncios (tabela `anuncios` já existe com `data`, `orcamento`, `valor_investido`)
- Formulário para adicionar/editar gasto por dia
- Tabela listando todos os registros com data, orçamento e valor investido
- Resumo: total investido, CPA médio (total investido / total pedidos pagos)

### 2. Dashboard reformulado (`src/pages/Dashboard.tsx`) — reescrever
Buscar dados de `pedidos` e `anuncios`. Novas métricas:

**Cards:**
- Lucro de pedidos pagos (soma valor dos pagos - frete Five dos pagos)
- Valor total de pedidos agendados (todos)
- Valor de pedidos agendados excluindo pagos
- Qtd pedidos feitos
- Qtd pedidos pagos
- Qtd pedidos aguardando pagamento (!pago && !perdido)
- Investimento total em anúncios
- CPA médio (investimento / pedidos pagos)
- CPA do dia (input de orçamento do dia / pedidos do dia) com campo editável
- Taxa de inadimplência (pedidos com +7 dias aguardando / total elegível)
- ROI investido vs pago (lucro pagos / investimento)
- ROI investido vs agendado (valor agendado / investimento)

**Gráficos:**
- Barras: qtd pedidos feitos por dia/semana/mês (toggle)
- Barras: qtd pagamentos por dia/semana/mês (toggle)
- Pizza: pedidos agendados vs entregues vs pagos
- Barras: pedidos por estado (UF)

### 3. Tela de Pedidos (`src/pages/Pedidos.tsx`) — ajustar
- Summary bar: trocar "Frete (Five)" por "Investimento em Anúncios" (buscar soma de `anuncios`)
- Lucro líquido = soma valor dos pedidos pagos - frete Five dos pagos (não de todos)
- Tornar os campos booleanos (Chegou, Chamado, Cobrado, Pago, Perdido) clicáveis diretamente na tabela com checkboxes/switches que fazem `UPDATE` inline sem abrir formulário de edição

### Arquivos alterados
- `src/pages/Anuncios.tsx` — reescrever com CRUD completo
- `src/pages/Dashboard.tsx` — reescrever com novas métricas e gráficos
- `src/pages/Pedidos.tsx` — ajustar summary bar e adicionar toggle inline nos booleanos

