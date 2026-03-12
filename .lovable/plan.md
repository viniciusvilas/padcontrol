

## Linhas alternadas com tons de roxo nas tabelas de pedidos

### O que será feito
Adicionar cores de fundo alternadas (roxo claro e roxo mais forte) nas linhas das tabelas de pedidos para melhorar a legibilidade visual.

### Abordagem
A forma mais limpa é usar o índice do `.map()` para aplicar classes de fundo alternadas nas `TableRow`. Isso será feito em todas as 6 páginas que listam pedidos:

1. **Pedidos.tsx** — `filtered.map((p, i) =>` com classe condicional
2. **Perdidos.tsx**
3. **Pagos.tsx**
4. **Prioridade.tsx**
5. **FaltaChamar.tsx**
6. **PrestesAChegar.tsx**

### Classes CSS
- Linhas pares: `bg-purple-50/60 dark:bg-purple-950/20`
- Linhas ímpares: `bg-purple-100/60 dark:bg-purple-900/20`

Serão aplicadas via `className` condicional no `<TableRow>`: `className={i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20"}`, preservando o hover existente.

