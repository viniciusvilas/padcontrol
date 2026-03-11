

## Plano: Corrigir filtro para 5 dias úteis

### Alteração

No arquivo `src/pages/PrestesAChegar.tsx`, substituir `differenceInCalendarDays` por uma função que conta apenas dias úteis (seg-sex) entre hoje e a data de previsão.

Criar uma função `businessDaysDiff(from: Date, to: Date): number` que itera dia a dia e conta apenas dias que não são sábado/domingo. Usar essa função no filtro ao invés de `differenceInCalendarDays`.

A lógica do filtro muda de:
```ts
const dias = differenceInCalendarDays(parseISO(p.previsao_entrega), new Date());
return dias <= 5;
```
Para:
```ts
const dias = businessDaysDiff(new Date(), parseISO(p.previsao_entrega));
return dias <= 5; // inclui atrasados (dias negativos)
```

Atrasados (previsão no passado) continuam aparecendo normalmente.

