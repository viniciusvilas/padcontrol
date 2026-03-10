

## Plan: Botao "Em Rota" e Clientes Problematicos

### 1. Migration SQL -- adicionar 2 colunas na tabela `pedidos`

- `em_rota` (boolean, default false) -- marca pedidos que estao em rota de entrega
- `cliente_problematico` (boolean, default false) -- marca pedidos cujos clientes enrolam para responder

RLS ja esta configurada para a tabela pedidos com CRUD completo.

### 2. Pagina Prestes a Chegar (`src/pages/PrestesAChegar.tsx`)

- Adicionar botao "Em Rota" ao lado do botao "Chegou" nas acoes de cada pedido
- Ao clicar, seta `em_rota = true` no banco
- Separar a tabela em duas secoes:
  - **Em Rota** (pedidos com `em_rota = true`) -- destaque visual diferente (ex: fundo verde)
  - **Aguardando** (pedidos com `em_rota = false`) -- tabela atual
- Botao para reverter ("Tirar da rota") nos pedidos em rota

### 3. Pagina Cobranca (`src/pages/Cobranca.tsx`)

- Adicionar uma terceira secao: **Clientes Problematicos**
- Nas tabelas existentes (Aguardando Cobranca e Ja Cobrados), adicionar botao "⚠️ Problematico" em cada linha
- Ao clicar, seta `cliente_problematico = true` e o pedido aparece na secao de problematicos
- Na secao de problematicos, botao para remover da lista (seta `cliente_problematico = false`)
- A secao de problematicos mantem os botoes de acao normais (Pago/Perdido)

### Detalhes tecnicos

- A query de PrestesAChegar ja busca pedidos com `pedido_chegou = false`, entao `em_rota` sera apenas um marcador visual sem alterar o fluxo
- A query de Cobranca ja busca pedidos com `pedido_chegou = true, pedido_pago = false, pedido_perdido = false`, entao `cliente_problematico` sera um filtro adicional para separar visualmente

