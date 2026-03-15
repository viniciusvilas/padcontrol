

## Plan: Filter Prioridade to 7+ Days Since Delivery

### Current Behavior
The page shows **all** charged-but-unpaid orders, regardless of how long ago they were delivered.

### Change
In `src/pages/Prioridade.tsx`, add a client-side filter after fetching to only show orders where `data_entrega` is set and the delivery was **more than 7 days ago**.

Specifically, after the query returns, filter the results:
```typescript
.filter(p => {
  if (!p.data_entrega) return false;
  return differenceInCalendarDays(new Date(), parseISO(p.data_entrega)) > 7;
})
```

This ensures only orders delivered 7+ days ago appear on this screen, matching the business rule for priority collection (inadimplência).

