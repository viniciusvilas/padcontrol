

## Plan: Remove PWA Configuration

### Changes

1. **`vite.config.ts`** — Remove `vite-plugin-pwa` import and the entire `VitePWA(...)` plugin call. Keep everything else intact.

2. **`src/main.tsx`** — Remove the `serviceWorker` listener block (lines 7-12). Keep the React render code.

3. **`index.html`** — Remove PWA-specific meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `apple-touch-icon` link, and `theme-color`.

4. **`src/pages/Install.tsx`** — Delete this file (no longer needed).

5. **`src/App.tsx`** — Remove the `/install` route and its import.

6. **`src/components/AppSidebar.tsx`** — Remove any navigation link to the Install page if present.

7. **`package.json`** — Remove `vite-plugin-pwa` from dependencies.

8. **`public/`** — Delete `pwa-192x192.png` and `pwa-512x512.png` (PWA icons no longer needed).

