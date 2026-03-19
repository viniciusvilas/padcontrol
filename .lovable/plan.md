

## Plano: Botão de Exportar Pedidos (CSV)

### O que será feito
Adicionar um botão "Exportar" na barra de ações da página de Pedidos que gera um arquivo CSV com todos os dados dos pedidos filtrados, incluindo data de chegada e data de pagamento.

### Detalhes técnicos

**Arquivo:** `src/pages/Pedidos.tsx`

1. Adicionar o ícone `Download` do lucide-react nos imports
2. Criar uma função `exportCSV` que:
   - Pega os pedidos filtrados (`filtered`)
   - Gera um CSV com todas as colunas: Data, Cliente, CPF, Telefone, Produto, Valor, Valor Pago, Plataforma, Prazo, Previsão Entrega, Status, Estado, Local Entrega, Rastreio, Chegou, Data Entrega, Chamado, Cobrado, Pago, Perdido, Observações
   - Usa `Blob` + `URL.createObjectURL` para download automático
   - Nome do arquivo: `pedidos_YYYY-MM-DD.csv`
3. Adicionar o botão "Exportar" ao lado dos botões existentes (Novo Pedido, Importar, Lista Telefônica)

Nenhuma alteração no banco de dados é necessária.

