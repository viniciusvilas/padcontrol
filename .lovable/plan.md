

## Plano: Corrigir vulnerabilidade do pacote `xlsx`

### Problema
O pacote `xlsx` (SheetJS) na versao `^0.18.5` tem vulnerabilidades conhecidas (Prototype Pollution e ReDoS). O pacote no npm esta abandonado e nao recebe correcoes.

### Solucao

O uso do `xlsx` e limitado a um unico arquivo (`src/lib/importPedidos.ts`) para importar planilhas. A abordagem mais segura e migrar para o **SheetJS CE** distribuido diretamente pelo projeto (pacote `xlsx` na versao mais recente do CDN) ou, preferencialmente, usar a alternativa **`read-excel-file`** que e mantida ativamente e nao tem vulnerabilidades conhecidas.

Porem, a opcao mais simples e pragmatica: o `xlsx` na versao do npm e a unica que suporta tanto `.xlsx` quanto `.csv` com a mesma API. A alternativa com menor impacto e:

1. **Remover o pacote `xlsx`** do `package.json`
2. **Instalar `read-excel-file`** (pacote leve, sem vulnerabilidades)
3. **Reescrever `src/lib/importPedidos.ts`** para usar `read-excel-file` — a logica de parsing (mapeamento de colunas, correcao de datas, etc.) permanece igual, apenas a leitura do arquivo muda

### Arquivos alterados
- `package.json` — trocar `xlsx` por `read-excel-file`
- `src/lib/importPedidos.ts` — adaptar import e leitura do arquivo

