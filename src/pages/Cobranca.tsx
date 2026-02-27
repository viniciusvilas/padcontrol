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
        .eq("pedido_chegou", true)
        .eq("pedido_pago", false)
        .eq("pedido_perdido", false)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const naoCobrados = pedidos.filter((p) => !p.cliente_cobrado);
  const cobrados = pedidos.filter((p) => p.cliente_cobrado);

  const marcarCobrado = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ cliente_cobrado: true }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como cobrado!"); refetch(); }
  };

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

  const renderTable = (items: Pedido[], showCobradoBtn: boolean) => (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead className="w-[220px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum pedido</TableCell></TableRow>
          ) : (
            items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                <TableCell className="whitespace-nowrap">{p.data_entrega || "—"}</TableCell>
                <TableCell className="font-medium">{p.cliente}</TableCell>
                <TableCell>{p.telefone || "—"}</TableCell>
                <TableCell>{p.produto}</TableCell>
                <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                <TableCell>{p.plataforma}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {showCobradoBtn ? (
                      <Button size="sm" variant="outline" onClick={() => marcarCobrado(p.id)}>📞 Cobrado</Button>
                    ) : (
                      <Button size="sm" onClick={() => marcarPago(p.id)}>💰 Pago</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => marcarPerdido(p.id)}>❌ Perdido</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Phone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Cobrança</h1>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>

      <h2 className="text-lg font-semibold mb-2">Aguardando Cobrança <Badge variant="outline">{naoCobrados.length}</Badge></h2>
      <p className="text-muted-foreground mb-3 text-sm">Pedidos entregues que ainda não foram cobrados.</p>
      {renderTable(naoCobrados, true)}

      <h2 className="text-lg font-semibold mt-8 mb-2">Já Cobrados <Badge variant="outline">{cobrados.length}</Badge></h2>
      <p className="text-muted-foreground mb-3 text-sm">Pedidos já cobrados aguardando pagamento.</p>
      {renderTable(cobrados, false)}
    </div>
  );
}
