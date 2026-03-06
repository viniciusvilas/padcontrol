

## Analise

O problema esta na linha 206: `date: o.data` — usa a data de criacao do pedido ao inves da data de pagamento.

A tabela `pedidos` nao tem um campo `data_pagamento` explicito. Porem, tem `data_entrega` que e preenchido quando o pedido chega/e entregue. No modelo Pay After Delivery, o pagamento acontece apos a entrega, entao `data_entrega` e o melhor proxy disponivel.

Olhando os dados reais, o pedido do Arlindo Zamboni tem `data: 2026-02-19` e `data_entrega: 2026-03-05`, confirmando que a data de pagamento deveria ser em marco, nao fevereiro.

## Plano

### 1. Alterar a logica de importacao em `FinancasTransacoes.tsx`

Na linha 206, trocar:
```typescript
date: o.data,
```
por:
```typescript
date: o.data_entrega || o.data,
```

Isso usa `data_entrega` como data da transacao (proxy para data de pagamento). Se `data_entrega` estiver nulo, cai de volta para `o.data`.

### 2. (Opcional) Adicionar campo `data_pagamento` na tabela `pedidos`

Se quiser maior precisao, posso criar uma migracao adicionando a coluna `data_pagamento` (date, nullable) na tabela `pedidos`. Porem, isso exigiria que a data de pagamento fosse preenchida manualmente ou automaticamente quando `pedido_pago` e marcado como true. Atualmente `data_entrega` ja serve como aproximacao suficiente.

### 3. Atualizar transacoes ja importadas

As 21 transacoes ja importadas estao com a data errada (data do pedido). Seria necessario reexecutar a sincronizacao apos deletar as transacoes existentes, ou atualizar manualmente. A abordagem mais simples: ao clicar "Sincronizar Vendas", alem de importar novos, atualizar a data das transacoes ja existentes com a `data_entrega` correta.

### Arquivos a editar
- `src/pages/FinancasTransacoes.tsx` — linha 206 e logica de update para existentes

