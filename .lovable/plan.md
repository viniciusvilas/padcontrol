
# PAD Manager – Plano de Implementação

## Fase 1: Fundação (Backend + Layout)
1. **Configurar Lovable Cloud (Supabase)** – Criar tabelas: `pedidos` (todos os campos do GDD: data, cliente, telefone, produto, valor, plataforma, local_entrega, estado, prazo, previsao_entrega, rastreio, observacoes, status, checkboxes operacionais), `anuncios` (data, orcamento, valor_investido), e `perfil_usuario` (tipo afiliado, faturamento acumulado)
2. **Autenticação** – Login/cadastro com email em PT-BR
3. **Layout principal** – Sidebar com navegação: Pedidos, Prestes a Chegar, Cobrança, Prioridade, Pagos, Perdidos, Anúncios, Dashboard, Projeção, Nível

## Fase 2: Gestão de Pedidos
4. **Tela de pedidos** – Listagem com cores por status (cinza=criado, azul=transporte, amarelo=entregue, verde=pago, vermelho=inadimplente), formulário de cadastro com todos os campos, cálculo automático de previsão de entrega
5. **Status automático** – Lógica de transição: Criado → Em transporte (ao adicionar rastreio) → Prestes a chegar (2 dias antes) → Entregue → Em cobrança → Prioridade (7 dias úteis sem pagar) → Pago/Perdido
6. **Checkboxes operacionais** – "Já foi chamado?", "Pedido chegou?", "Cliente cobrado?", "Pedido pago?", "Pedido perdido?"
7. **Filtros avançados** – Por estado, plataforma, data, nome, telefone, status, pago/não pago, inadimplente

## Fase 3: Áreas Especiais
8. **Telas por status** – Prestes a Chegar, Cobrança, Prioridade de Cobrança, Pagos, Perdidos – cada uma filtrando pedidos pelo status correspondente

## Fase 4: Controle de Anúncios
9. **Cadastro diário de anúncios** – Data, orçamento do dia, valor investido
10. **Cálculos automáticos** – Investimento total, investimento por período, CPA médio (investimento ÷ pedidos), CPA do dia

## Fase 5: Dashboard e Finanças
11. **Métricas financeiras** – Lucro de pedidos pagos (Five: valor - R$35 - CPA; Keed: valor - CPA), valor agendado, entrada prevista/confirmada, perda projetada, ROI
12. **Métricas operacionais** – Total pedidos, pagos, aguardando, inadimplentes, médias diárias/semanais/mensais, taxa de inadimplência
13. **Gráficos** – Pedidos por dia/semana/mês (colunas), pagamentos por dia/semana/mês, distribuição por status (pizza), pedidos por estado (colunas)

## Fase 6: Projeção e Gamificação
14. **Sistema de projeção** – Escolher período (7/15/30 dias) e % esperado, calcular receita projetada
15. **Sistema de níveis** – 10 níveis baseados em faturamento acumulado (5k a 2.000k), barra de progresso, valor restante para próximo nível
