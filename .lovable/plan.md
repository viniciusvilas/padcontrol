

## Plano: Importação de Pedidos da Planilha

### Mapeamento de Colunas (Planilha → Banco de Dados)

```text
Planilha                  →  Campo no DB (pedidos)
─────────────────────────────────────────────────
DATA                      →  data
NOME                      →  cliente
VALOR                     →  valor
TICKET                    →  produto (T1, T2, T3)
NUMERO                    →  telefone
ENTREGA                   →  local_entrega (CASA/CORREIOS)
DIAS_UTEIS                →  prazo
PREVISAO_CHEGADA          →  previsao_entrega
JA_CHEGOU?                →  pedido_chegou
JA_FOI_CHAMADO            →  ja_foi_chamado
JA_FOI_COBRADO            →  cliente_cobrado
STATUS_DA_COBRANCA        →  status (mapeado)
GANHO_OU_PERDA            →  pedido_pago/pedido_perdido
```

Colunas ignoradas (calculadas ou redundantes): `DIA_QUE_CHEGOU`, `DIAS_POS_ENTREGA`, `RISCO_INADIMPLENCIA`, `NOME_MAIUSCULO`.

### Implementação

1. **Criar página de Pedidos completa (Fase 2)** com listagem, filtros e formulário de cadastro manual, incluindo tabela com cores por status.

2. **Adicionar funcionalidade de importação CSV/XLSX** na página de Pedidos:
   - Botão "Importar Planilha" que aceita `.xlsx` e `.csv`
   - Instalar biblioteca `xlsx` (SheetJS) para parse de arquivos Excel no navegador
   - Tela de mapeamento mostrando preview dos dados antes de confirmar
   - Lógica de conversão: datas BR (dd/mm/yyyy), booleans (TRUE/FALSE), valores numéricos
   - Filtragem de linhas vazias (como as linhas sem nome no final da planilha)
   - Inserção em lote no banco de dados via Supabase

3. **Dados da planilha** (~50 pedidos reais) serão importados automaticamente com o mapeamento correto, incluindo status derivado (PAGO → `pedido_pago=true`, GANHO/PERDA, etc.).

### Detalhes Técnicos

- **Biblioteca**: `xlsx` (SheetJS) para parse client-side de XLSX
- **Validação**: linhas sem `cliente` ou `valor` serão descartadas
- **Conversão de status**: `GANHO_OU_PERDA="GANHO"` → `pedido_pago=true`; `"PERDA"` → `pedido_perdido=true`
- **Datas**: parse de formato `dd/mm/yyyy` e `m/d/yy` para formato ISO

