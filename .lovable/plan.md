

## Plano: Botao global "Recarregar Dados" no header do app

### O que sera feito

Adicionar um botao visivel no header global (`AppLayout.tsx`) que, ao clicar:

1. **Invalida e refaz** todas as queries do React Query (financas, pedidos, anuncios, tudo)
2. Se apos 5 segundos os dados nao voltarem, **faz reload completo da pagina** (fallback F5)
3. Mostra um toast informando o status ("Recarregando dados..." / "Dados atualizados!")

### Detalhes tecnicos

**Arquivo: `src/components/AppLayout.tsx`**
- Importar `useQueryClient` do `@tanstack/react-query`
- Adicionar estado `isRefreshing` para feedback visual (spinner no icone)
- Criar funcao `handleRefreshAll`:
  - Chama `queryClient.invalidateQueries()` (sem filtro = invalida TUDO)
  - Aguarda `queryClient.refetchQueries()` com timeout de 5s
  - Se o refetch falhar ou estourar o timeout, executa `window.location.reload()`
  - Mostra toast de sucesso ou fallback
- Substituir o botao `RefreshCw` existente (que ja faz `window.location.reload()`) por essa logica mais inteligente
- O icone fica girando (`animate-spin`) enquanto recarrega

O botao ja existe no header (linha 26-30), entao sera apenas uma melhoria do comportamento dele -- nao precisa adicionar elemento novo.

### Arquivos alterados
- `src/components/AppLayout.tsx` (unico arquivo)

