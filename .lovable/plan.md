

## Ajustar taxa de inadimplência

### Mudança em `src/pages/Dashboard.tsx`

A lógica atual exclui pedidos perdidos. A nova lógica deve contar como inadimplente qualquer pedido entregue e não pago que:
- Tenha mais de 7 dias desde a entrega (independente de ser perdido ou não), **OU**
- Esteja marcado como perdido

**De:**
```ts
const entreguesSemPgto = filtered.filter((p) => p.pedido_chegou && !p.pedido_pago && !p.pedido_perdido && p.data_entrega && differenceInCalendarDays(now, parseISO(p.data_entrega)) > 7);
```

**Para:**
```ts
const inadimplentes = filtered.filter((p) =>
  p.pedido_chegou && !p.pedido_pago && (
    p.pedido_perdido ||
    (p.data_entrega && differenceInCalendarDays(now, parseISO(p.data_entrega)) > 7)
  )
);
```

Atualizar referências de `entreguesSemPgto` para `inadimplentes` no cálculo da taxa e no subtitle do card.

