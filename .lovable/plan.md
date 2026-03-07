

## Diagnóstico

No código atual (linha 118-126 de `Projecao.tsx`), o filtro da seção "Chegada & Inadimplência" exclui pedidos atrasados:

```typescript
return prev >= hoje && prev <= limite;
```

Isso significa que pedidos com `previsao_entrega` anterior a hoje (atrasados, ainda não chegaram) **não aparecem** na projeção. Apenas pedidos com previsão futura dentro do período selecionado são incluídos.

## Plano

Alterar o filtro `pedidosFiltrados` para incluir também pedidos atrasados (previsão no passado, mas que ainda não chegaram, não foram pagos e não foram perdidos):

1. **Modificar o filtro em `pedidosFiltrados`** para remover a condição `prev >= hoje`, mantendo apenas `prev <= limite`. Pedidos atrasados (previsão antes de hoje) serão automaticamente incluídos pois não têm `pedido_pago`, `pedido_perdido` nem `pedido_chegou`.

2. **Adicionar `pedido_chegou` ao filtro** — pedidos que já chegaram mas não foram pagos devem continuar aparecendo (já está excluindo apenas pagos e perdidos, o que está correto).

3. **Atualizar o texto descritivo** do card de cenários para refletir que inclui pedidos atrasados, algo como: "X pedidos pendentes (incluindo Y atrasados)".

4. **Adicionar indicador visual** na tabela ou resumo mostrando quantos pedidos estão atrasados vs dentro do prazo.

### Mudança principal (1 arquivo):
- `src/pages/Projecao.tsx`: Ajustar filtro para `prev <= limite` (sem `prev >= hoje`), adicionar contagem de atrasados no resumo.

