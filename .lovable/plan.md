

## Plano: Ajustar Projeção com pedidos reais e fluxo de caixa

### Seção 1 — Chegada & Inadimplência (pedidos reais)

**Mudança principal**: Em vez de projetar pedidos inexistentes com base em média, usar os pedidos já existentes que têm `previsao_entrega` dentro do período selecionado (hoje + X dias).

- Filtrar pedidos onde `previsao_entrega` cai entre hoje e hoje + dias selecionados, e que ainda não foram pagos nem perdidos
- Data de pagamento estimada = `previsao_entrega + 3 dias`
- Tabela de cenários aplica as faixas de inadimplência (0%-50%) sobre esses pedidos reais filtrados
- Mostrar total de pedidos encontrados no período, faturamento e lucro por cenário

### Seção 2 — Simulador de Investimento

**Novos inputs**:
- Slider/input de **% inadimplência esperada** (0-50%)
- O cálculo de pedidos pagos = pedidos esperados × (1 - inadimplência%)

**Fluxo de caixa médio (12 dias)**:
- Cada pedido gerado na simulação tem pagamento estimado em `data_pedido + 12 dias`
- Distribuir os pedidos esperados uniformemente ao longo do período de investimento
- Gerar gráfico de barras por dia mostrando quantidade de pagamentos previstos, incluindo dias além do período de investimento (até último pagamento = último dia + 12)

### Detalhes técnicos

- **Arquivo**: `src/pages/Projecao.tsx` — reescrever lógica dos dois `useMemo` e adicionar novo state + gráfico
- Novo state: `inadimplenciaSim` para o slider de % no simulador
- Novo `useMemo` para gerar `fluxoCaixaData` (array de `{dia, pagamentos}`)
- Novo gráfico `BarChart` para o fluxo de caixa diário
- Imports adicionais: `addDays, format` do `date-fns`

