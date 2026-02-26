

## Plano: Corrigir dados e mostrar todas as informações na tabela

### 1. Atualizar dados existentes no banco

Usar a ferramenta de insert/update para executar:
- `UPDATE pedidos SET produto = '3+1' WHERE produto = 'T1'` (43 pedidos)
- `UPDATE pedidos SET produto = '5+1' WHERE produto = 'T2'` (7 pedidos)
- `UPDATE pedidos SET produto = '12' WHERE produto = 'T3'` (1 pedido)
- `UPDATE pedidos SET plataforma = 'Keed' WHERE plataforma = 'Five'` (51 pedidos)

Depois o usuário altera manualmente os que são Five.

### 2. Expandir tabela em `src/pages/Pedidos.tsx`

Adicionar as colunas que faltam na tabela para que todas as informações fiquem visíveis:
- **Plataforma** (Five/Keed)
- **Telefone**
- **Estado (UF)**
- **Prazo**
- **Previsão de Entrega**
- **Rastreio**

Atualizar o `colSpan` das linhas de loading/empty para refletir o novo total de colunas.

### Arquivos alterados
- `src/pages/Pedidos.tsx` — adicionar colunas faltantes na tabela

