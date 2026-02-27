

## Transformar em app instalavel

Sim, e com pouco trabalho. Existem duas abordagens:

### Opção 1: App Instalavel via navegador (PWA) — Recomendado
- Funciona em **celular e PC**
- O usuario acessa o site e clica em "Instalar" no navegador
- Fica com icone na tela inicial / area de trabalho, abre sem barra do navegador
- Funciona offline para telas ja carregadas
- **Nenhuma loja de apps necessaria** (ideal para poucas pessoas)
- Trabalho: **pequeno** — configurar manifest, icones e service worker

### Opção 2: App nativo (Capacitor)
- App real publicado na App Store / Google Play
- Acesso total a recursos do celular (notificacoes push, camera, etc.)
- Requer Xcode (iOS) e Android Studio (Android) na sua maquina
- Trabalho: **medio a alto** — setup local, build, publicacao nas lojas

### Recomendacao

Para **poucas pessoas** e sem necessidade de loja de apps, a **Opção 1 (PWA)** e a melhor escolha. O usuario so precisa acessar o link e instalar pelo navegador. Funciona tanto no celular quanto no PC.

### Implementacao (PWA)
1. Instalar `vite-plugin-pwa` e configurar no `vite.config.ts`
2. Criar manifest com nome, icones e cores do app
3. Adicionar meta tags mobile no `index.html`
4. Criar pagina `/install` com instrucoes para o usuario instalar

