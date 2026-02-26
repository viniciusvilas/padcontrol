

## Plano: Reescrever a tela de Projeção

A página será reescrita do zero com duas seções principais:

### Seção 1 — Projeção de Chegada de Pedidos + Cenários de Inadimplência

- **Seletor de período**: Slider ou input numérico para escolher "próximos X dias" (7, 10, 14, 20, 30, etc.)
- **Cálculo**: Usa a média diária de pedidos históricos (pedidos feitos / dias com dados) para projetar quantos pedidos chegarão no período escolhido
- **Tabela de cenários de inadimplência**: Para o período selecionado, mostra uma tabela/grid com faixas de inadimplência de 0% a 50% (a cada 5% ou 10%), exibindo para cada faixa:
  - Pedidos previstos que pagam
  - Faturamento esperado (com base no ticket médio dos pagos)
  - Lucro esperado (faturamento - frete Five dos pagos)
- **Dados fonte**: busca todos os `pedidos` do usuário para calcular médias históricas

### Seção 2 — Projeção baseada em CPA (Simulador de Investimento)

- **CPA editável**: Campo pré-preenchido com o CPA atual (investimento total / pedidos feitos), editável pelo usuário para simular cenários
- **Seletor de período**: Escolher projetar por dias, semanas ou meses (ex: próximos 7 dias, 2 semanas, 1-3 meses)
- **Investimento diário editável**: Campo para definir quanto pretende investir por dia
- **Resultados calculados**:
  - Pedidos esperados = (investimento diário × dias) / CPA
  - Faturamento esperado = pedidos × ticket médio
  - Lucro esperado = faturamento - frete - investimento total
  - ROI projetado = lucro / investimento
- Cards com os resultados e possivelmente um gráfico de barras simples mostrando a projeção

### Detalhes técnicos

- **Arquivo**: `src/pages/Projecao.tsx` — reescrever completamente
- **Queries**: Reutiliza as queries de `pedidos` e `anuncios` já existentes
- **Sem mudanças no banco**: Não precisa de novas tabelas (a tabela `metas` continua existindo mas não será usada nesta tela)
- **Componentes**: Cards, Slider, Input, Tabs do shadcn/ui já instalados
- **Gráficos**: recharts para visualização dos cenários

