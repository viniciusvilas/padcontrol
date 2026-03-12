

## Plano: Botao "Gerar Lista Telefonica" na pagina de Pedidos

### O que sera feito

Adicionar um botao na pagina de Pedidos que abre um dialog onde o usuario:
1. Escolhe uma data (date picker)
2. Clica em "Gerar Lista"
3. Ve a lista gerada no formato `Nome / Telefone` em um textarea
4. Copia com um botao "Copiar"

Numeros de telefone com 10 digitos (faltando o 9) serao corrigidos automaticamente inserindo o "9" apos o DDD (posicao 3).

### Detalhes tecnicos

**Novo componente: `src/components/ListaTelefonicaDialog.tsx`**
- Dialog com DatePicker para selecionar a data
- Ao gerar, faz query em `pedidos` filtrando por `data = data_selecionada` e `user_id`
- Formata cada pedido como `cliente / telefone_corrigido`
- Logica de correcao do telefone: remove caracteres nao-numericos; se tem 10 digitos, insere "9" na posicao 3 (apos DDD)
- Exibe resultado em textarea readonly com botao "Copiar" usando `navigator.clipboard`

**Arquivo editado: `src/pages/Pedidos.tsx`**
- Importar e adicionar botao que abre o `ListaTelefonicaDialog`
- Botao ao lado dos existentes (Importar, Novo Pedido)

### Arquivos
- (novo) `src/components/ListaTelefonicaDialog.tsx`
- (editado) `src/pages/Pedidos.tsx`

