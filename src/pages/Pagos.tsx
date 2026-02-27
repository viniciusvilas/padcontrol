import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

export default function Pagos() {
  const { user } = useAuth();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos-pagos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .eq("pedido_pago", true)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const totalValor = pedidos.reduce((s, p) => s + Number(p.valor), 0);
  const totalFrete = pedidos.filter((p) => p.plataforma === "Five").length * 35;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold">Pedidos Pagos</h1>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Recebido</p>
          <p className="text-lg font-bold">R$ {totalValor.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Frete (Five)</p>
          <p className="text-lg font-bold text-amber-600">R$ {totalFrete.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Líquido</p>
          <p className="text-lg font-bold text-emerald-600">R$ {(totalValor - totalFrete).toFixed(2)}</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : pedidos.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido pago</TableCell></TableRow>
            ) : (
              pedidos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell className="whitespace-nowrap">{p.data_entrega || "—"}</TableCell>
                  <TableCell className="font-medium">{p.cliente}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                  <TableCell>{p.plataforma}</TableCell>
                  <TableCell>{p.estado || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
