

## Plano: Distribuição aleatória de pedidos por dia no simulador

### Problema atual
O `fluxoCaixaData` distribui pedidos uniformemente (`pedidosPorDia = pedidosPagos / simDias`), resultando em barras idênticas todos os dias no gráfico.

### Solução
Usar uma distribuição aleatória com seed determinística (baseada nos inputs) para que:
- O total de pedidos pagos no período seja respeitado (mesmo CPA total)
- Cada dia tenha uma quantidade variável de pedidos (mais realista)
- O resultado seja reprodutível enquanto os inputs não mudarem

### Implementação — `src/pages/Projecao.tsx`

1. **Criar função de random com seed** (pseudorandom determinístico usando um simple LCG ou mulberry32) para que o gráfico não mude a cada re-render, apenas quando os inputs mudam.

2. **Refatorar `fluxoCaixaData`**:
   - Em vez de `pedidosPorDia` fixo, distribuir `simulacao.pedidosPagos` pedidos aleatoriamente entre os `simDias` dias
   - Gerar um array de pesos aleatórios por dia, normalizar para que a soma = `pedidosPagos`
   - Cada dia terá um número diferente de pedidos, mas o total respeita o CPA
   - Manter o ciclo de 12 dias para pagamento: pedidos do dia `d` geram pagamento no dia `d + 12`

3. **Seed determinística**: usar hash simples de `simDias + pedidosPagos + investDiario + inadimplenciaSim` para que o cenário mude apenas quando os parâmetros mudam

4. **Botão "Novo Cenário"**: adicionar um botão que incrementa um counter no state (`cenarioSeed`), forçando nova distribuição aleatória mantendo os mesmos parâmetros

### Detalhes técnicos
- Novo state: `cenarioSeed` (number, default 0)
- Função `seededRandom(seed: number)` retornando gerador determinístico
- O `useMemo` de `fluxoCaixaData` inclui `cenarioSeed` nas dependências
- Botão posicionado acima dos gráficos de fluxo de caixa

