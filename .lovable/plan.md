

## Plano: Dashboard Financeiro

### Dados Disponíveis

Todos os dados vêm da tabela `pedidos` do usuário logado. Cada pedido tem: `data`, `valor`, `plataforma` (Five/Keed), `pedido_pago`, `pedido_perdido`, `status`.

Regras financeiras: frete Five = R$35 por pedido, Keed = R$0. Lucro líquido = valor bruto - frete.

### Componentes do Dashboard

**1. Filtro de período** - Seletor com opções: Últimos 7 dias, 30 dias, 90 dias, Este mês, Tudo.

**2. Cards de resumo (topo)**
- Faturamento Bruto total
- Frete acumulado (Five)
- Lucro Líquido
- Total de Pedidos
- Taxa de conversão (pagos / total)

**3. Gráfico de Barras - Faturamento por mês** (Recharts BarChart)
- Agrupa pedidos por mês (formato MMM/yyyy)
- Barras empilhadas: valor bruto vs frete
- Eixo X = mês, Eixo Y = R$

**4. Gráfico de Linha - Lucro líquido acumulado** (Recharts LineChart)
- Linha mostrando a evolução do lucro líquido acumulado ao longo dos meses

**5. Gráfico de Pizza - Distribuição por produto** (Recharts PieChart)
- Fatias: 3+1, 5+1, 12
- Mostra quantidade e percentual

**6. Gráfico de Barras - Pedidos por status** (Recharts BarChart horizontal)
- Criado, Aguardando, Em Cobrança, Pago, Perdido

### Implementação

1. **Reescrever `src/pages/Dashboard.tsx`** com:
   - Query dos pedidos via TanStack Query (mesmo padrão da página Pedidos)
   - Lógica de agrupamento por mês usando `date-fns`
   - Filtro de período com estado local
   - 4 gráficos usando `recharts` + componentes `ChartContainer`/`ChartTooltip` do shadcn/ui
   - Cards de métricas no topo
   - Layout responsivo em grid

Nenhuma mudança no banco de dados é necessária.

