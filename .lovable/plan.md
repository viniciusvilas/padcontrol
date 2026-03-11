

## Diagnóstico: Por que as finanças somem aleatoriamente

Identifiquei **dois problemas** que causam o desaparecimento dos dados:

### Problema 1: Políticas RLS ainda RESTRICTIVE
Apesar da migração anterior, as políticas de acesso no banco de dados **ainda estão marcadas como RESTRICTIVE** (bloqueantes). O PostgreSQL tem duas formas de criar políticas: PERMISSIVE (permite acesso) e RESTRICTIVE (bloqueia). As políticas atuais usam o modo errado, o que pode causar bloqueio intermitente de acesso aos dados.

### Problema 2: Sessão de autenticação instável
O sistema de autenticação tem uma fragilidade: quando o token de acesso expira e tenta renovar automaticamente, há um momento em que o app interpreta que o usuário não está logado. Nesse instante, todas as consultas ao banco são desabilitadas e retornam listas vazias, fazendo tudo "sumir". Quando o token se renova com sucesso, os dados voltam -- mas dependendo do timing, podem não voltar automaticamente.

---

### Plano de Correção

**1. Migração SQL: Forçar políticas PERMISSIVE**
- Recriar todas as políticas em todas as 16 tabelas usando `CREATE POLICY ... AS PERMISSIVE` explicitamente (ao invés de depender do padrão)
- Cobrir: `pedidos`, `anuncios`, `metas`, `profiles`, e todas as 12 tabelas `finance_*`

**2. Melhorar AuthContext (`src/contexts/AuthContext.tsx`)**
- Não limpar o `user` durante eventos de refresh de token (`TOKEN_REFRESHED`)
- Só definir `user = null` quando o evento for `SIGNED_OUT` explicitamente
- Manter o último `user` válido durante renovações de sessão
- Adicionar tratamento para quando `getSession` retorna sessão expirada

**3. Adicionar retry e tratamento de erro nas queries**
- Configurar o `QueryClient` no `App.tsx` com `retry: 2` para queries que falham por motivos transitórios
- Isso garante que se uma query falhar durante a renovação do token, ela será refeita automaticamente

