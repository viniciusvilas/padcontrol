

## Plan: Auto-generate tracking link for Keed orders + CPF formatting

### What will be done

1. **CPF auto-formatting** — Add a mask function that formats CPF input as `xxx.xxx.xxx-xx` automatically as the user types. Apply this in:
   - `PedidoFormDialog.tsx` (CPF input field)
   - Import logic (`importPedidos.ts`) to normalize imported CPFs

2. **Auto-generate rastreio for Keed orders** — When the platform is "Keed" and a CPF is present, automatically set the `rastreio` field to `https://app.arcologistica.com.br/tracking?type=document&query={cpf_formatado}`. This happens:
   - In the form's `set` function: whenever `cpf` or `plataforma` changes, recalculate rastreio if platform is Keed
   - On submit (`handleSubmit`): ensure rastreio is set correctly before saving
   - If CPF is empty and platform is Keed, rastreio stays empty

3. **Display rastreio as clickable link** — In `Pedidos.tsx` table, if rastreio starts with `http`, render it as a clickable link (opening in new tab) instead of plain text. Same treatment in other pages that show rastreio.

### Technical details

**CPF mask utility** (in `set` function or inline):
```typescript
const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
```

**Rastreio auto-generation logic** in `PedidoFormDialog.tsx` `set` function:
- When `cpf` or `plataforma` changes, if `plataforma === "Keed"` and CPF has 11 digits, set `rastreio` to the tracking URL with formatted CPF. If CPF is empty, clear rastreio.
- When platform is "Five", don't auto-set rastreio (leave manual).

**Files to modify:**
- `src/components/PedidoFormDialog.tsx` — CPF mask + auto-rastreio logic
- `src/pages/Pedidos.tsx` — Render rastreio as clickable link
- `src/lib/importPedidos.ts` — Format CPF on import if present

