

## Entendimento

Na Five, quando o pedido é pago, o valor do frete volta para você. Ou seja, o frete é custo real apenas para pedidos Five **não pagos** (perdidos ou ainda pendentes). Valores recebidos: 3+1 = R$201,35 / 5+1 = R$251,35 (produto + frete devolvido).

## Plano

### 1. Ajustar cálculo de lucro no Dashboard (`src/pages/Dashboard.tsx`)

Separar o frete em duas categorias:
- **Frete pendente**: pedidos Five que ainda NÃO foram pagos (custo real)
- **Frete devolvido**: pedidos Five que JÁ foram pagos (não é custo)

```
gastoFreteReal = (Five não pagos) × 35,50
freteDevolvido = (Five pagos) × 35,50
lucroPagos = faturamentoPagos - totalInvestido - gastoFreteReal
```

### 2. Atualizar cards de métricas

- Card "Gasto com Frete" → mostrar o frete real (apenas não pagos) como valor principal
- Adicionar subtitle mostrando "R$ X devolvido (Y pedidos pagos)"

### 3. Ajustar página Pagos (`src/pages/Pagos.tsx`)

- O card "Frete (Five)" deve indicar que o frete foi devolvido
- O card "Líquido" não precisa subtrair o frete dos pagos, já que ele volta

### Arquivos alterados
- `src/pages/Dashboard.tsx` — cálculo de frete e card de métricas
- `src/pages/Pagos.tsx` — ajuste no cálculo líquido

