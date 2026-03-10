import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

interface PagamentoDialogProps {
  pedido: Pedido | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PagamentoDialog({ pedido, open, onOpenChange, onSuccess }: PagamentoDialogProps) {
  const { activeAccounts } = useFinanceAccounts();
  const [valorPago, setValorPago] = useState("");
  const [contaDestinoId, setContaDestinoId] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset fields when pedido changes
  useEffect(() => {
    if (open && pedido) {
      setValorPago(String(pedido.valor));
      setContaDestinoId("");
    }
  }, [open, pedido]);

  const handleConfirm = async () => {
    if (!pedido) return;
    const valor = parseFloat(valorPago);
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setLoading(true);
    const updateData: any = {
      pedido_pago: true,
      status: "pago",
      valor_pago: valor,
    };
    if (contaDestinoId) {
      updateData.conta_destino_id = contaDestinoId;
    }

    const { error } = await supabase.from("pedidos").update(updateData).eq("id", pedido.id);

    if (error) {
      setLoading(false);
      toast.error("Erro ao registrar pagamento");
      return;
    }

    // Create income transaction if a destination account was selected
    if (contaDestinoId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("finance_transactions").insert({
          user_id: user.id,
          account_id: contaDestinoId,
          type: "income" as const,
          amount: valor,
          description: `Pagamento: ${pedido.cliente} - ${pedido.produto}`,
          category: "Pay After Delivery",
          source: pedido.plataforma,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        {pedido && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>{pedido.cliente}</strong> — {pedido.produto} (R$ {Number(pedido.valor).toFixed(2)})
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-pago">Valor Pago</Label>
              <Input
                id="valor-pago"
                type="number"
                step="0.01"
                min="0"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta-destino">Conta Destino</Label>
              <Select value={contaDestinoId} onValueChange={setContaDestinoId}>
                <SelectTrigger id="conta-destino">
                  <SelectValue placeholder="Selecione a conta..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
