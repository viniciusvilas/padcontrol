import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { toast } from "sonner";
import type { Pedido } from "@/hooks/usePedidos";

interface Props {
  pedido: Pedido | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PagamentoDialog({ pedido, open, onOpenChange, onSuccess }: Props) {
  const { activeAccounts } = useFinanceAccounts();
  const [valorPago, setValorPago] = useState("");
  const [contaDestinoId, setContaDestinoId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && pedido) {
      setValorPago(String(pedido.valor));
      setContaDestinoId("");
    }
  }, [open, pedido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;
    const valor = parseFloat(valorPago);
    if (isNaN(valor) || valor <= 0) return toast.error("Informe um valor válido");

    setLoading(true);
    const updateData: Record<string, any> = { pedido_pago: true, status: "pago", valor_pago: valor };
    if (contaDestinoId) updateData.conta_destino_id = contaDestinoId;

    const { error } = await supabase.from("pedidos").update(updateData).eq("id", pedido.id);
    if (error) { setLoading(false); toast.error("Erro ao registrar pagamento"); return; }

    if (contaDestinoId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("finance_transactions").insert({
          user_id: user.id, account_id: contaDestinoId, type: "income" as const,
          amount: valor, description: `Pagamento: ${pedido.cliente} - ${pedido.produto}`,
          category: "Pay After Delivery", source: pedido.plataforma,
          date: new Date().toISOString().split("T")[0],
        });
      }
    }

    setLoading(false);
    toast.success("Pagamento registrado!");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
        {pedido && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>{pedido.cliente}</strong> — {pedido.produto} (R$ {Number(pedido.valor).toFixed(2)})
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor-pago">Valor Pago</Label>
                <Input id="valor-pago" type="number" step="0.01" min="0" value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Conta Destino</Label>
                <Select value={contaDestinoId} onValueChange={setContaDestinoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta..." /></SelectTrigger>
                  <SelectContent position="popper">
                    {activeAccounts.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Confirmar"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
