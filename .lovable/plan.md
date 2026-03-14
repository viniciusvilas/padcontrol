

## Problema Identificado

O card **"Valor Pago 7 dias"** filtra pedidos pagos pela **data de criação do pedido** (`p.data`), não pela **data em que o pagamento foi registrado**. Um pedido criado há 30 dias mas pago ontem não aparece no cálculo.

Além disso, pedidos antigos marcados como pagos antes da implementação do diálogo de pagamento têm `valor_pago = 0`, fazendo o valor total aparecer menor que o real.

## Correção

No `src/pages/Dashboard.tsx`, alterar a lógica do "Valor Pago 7 dias":

1. **Filtrar por `updated_at`** ao invés de `data` para pedidos pagos, pois `updated_at` é atualizado quando o pagamento é registrado
2. **Usar `valor` como fallback** quando `valor_pago` for 0, já que pedidos antigos podem não ter esse campo preenchido

```text
Antes:  filtra por p.data (data de criação)
Depois: filtra por p.updated_at (data de atualização/pagamento)

Antes:  soma apenas valor_pago (pode ser 0)
Depois: soma valor_pago || valor (fallback)
```

Mudança restrita a ~4 linhas no arquivo `src/pages/Dashboard.tsx`.

