

## Plano: Dois novos gráficos no Simulador de Investimento

### Gráfico 1 — Pagamentos em R$ por dia
- Substituir o gráfico atual de fluxo de caixa (que mostra quantidade de pagamentos) por um gráfico de colunas verticais mostrando o **valor em R$** dos pagamentos recebidos em cada dia
- Do dia 1 da projeção até o último pagamento (dia final + 12 dias do ciclo)
- Cada barra = `pedidosPorDia × ticketMedioPagos` nos dias em que há recebimento (dias 13 em diante)

### Gráfico 2 — Acumulado: Gasto vs Receita
- Novo gráfico de colunas com duas séries sobrepostas por dia (do dia 1 até o último pagamento):
  - **Gasto acumulado**: soma do investimento diário acumulado até aquele dia
  - **Receita acumulada**: soma dos pagamentos recebidos acumulados até aquele dia
- Permite visualizar o ponto de break-even (quando receita ultrapassa gasto)

### Detalhes técnicos
- **Arquivo**: `src/pages/Projecao.tsx`
- Atualizar `fluxoCaixaData` para incluir valor em R$ (`valorPagamentos`) e campos acumulados (`gastoAcumulado`, `receitaAcumulada`)
- Gerar array do dia 1 até dia `simDias + 12`, com todos os dias preenchidos
- Atualizar `fluxoChartConfig` para incluir as novas séries
- Adicionar novo `ChartConfig` para o gráfico acumulado
- Substituir o gráfico existente e adicionar o segundo gráfico abaixo

