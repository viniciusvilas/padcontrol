import { useQuery } from "@tanstack/react-query";
import { XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

export default function Perdidos() {
  const { user } = useAuth();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos-perdidos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .eq("pedido_perdido", true)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const totalPerdido = pedidos.reduce((s, p) => s + Number(p.valor), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <XCircle className="h-6 w-6 text-destructive" />
        <h1 className="text-2xl font-bold">Pedidos Perdidos</h1>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>

      <div className="bg-card rounded-lg border p-3 mb-4 max-w-xs">
        <p className="text-xs text-muted-foreground">Total Perdido</p>
        <p className="text-lg font-bold text-destructive">R$ {totalPerdido.toFixed(2)}</p>
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
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : pedidos.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido perdido 🎉</TableCell></TableRow>
            ) : (
              pedidos.map((p, i) => (
                <TableRow key={p.id} className={i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20"}>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell className="whitespace-nowrap">{p.data_entrega || "—"}</TableCell>
                  <TableCell className="font-medium">{p.cliente}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                  <TableCell>{p.plataforma}</TableCell>
                  <TableCell className="text-sm">{p.observacoes || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
