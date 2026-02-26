import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

export default function Cobranca() {
  const { user } = useAuth();

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ["pedidos-cobranca", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "em_cobranca")
        .eq("pedido_pago", false)
        .eq("pedido_perdido", false)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const marcarPago = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ pedido_pago: true, status: "pago" }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como pago!"); refetch(); }
  };

  const marcarPerdido = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ pedido_perdido: true, status: "perdido" }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como perdido"); refetch(); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Phone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Cobrança</h1>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>
      <p className="text-muted-foreground mb-4">Pedidos em cobrança aguardando pagamento.</p>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Cobrado</TableHead>
              <TableHead className="w-[200px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : pedidos.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum pedido em cobrança</TableCell></TableRow>
            ) : (
              pedidos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell className="font-medium">{p.cliente}</TableCell>
                  <TableCell>{p.telefone || "—"}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                  <TableCell>{p.plataforma}</TableCell>
                  <TableCell>{p.cliente_cobrado ? "✅" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => marcarPago(p.id)}>💰 Pago</Button>
                      <Button size="sm" variant="destructive" onClick={() => marcarPerdido(p.id)}>❌ Perdido</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
