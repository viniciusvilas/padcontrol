import { useQuery } from "@tanstack/react-query";
import { PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

export default function FaltaChamar() {
  const { user } = useAuth();

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ["pedidos-falta-chamar", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .eq("pedido_chegou", true)
        .eq("ja_foi_chamado", false)
        .eq("pedido_perdido", false)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const marcarChamado = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ ja_foi_chamado: true }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como chamado!"); refetch(); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <PhoneCall className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Falta Chamar</h1>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>
      <p className="text-muted-foreground mb-4">Pedidos que já chegaram mas o cliente ainda não foi chamado.</p>

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
              <TableHead>Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[140px]">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : pedidos.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Todos os clientes já foram chamados 🎉</TableCell></TableRow>
            ) : (
              pedidos.map((p, i) => (
                <TableRow key={p.id} className={i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20"}>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell className="font-medium">{p.cliente}</TableCell>
                  <TableCell>{p.telefone || "—"}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                  <TableCell>{p.plataforma}</TableCell>
                  <TableCell>{p.local_entrega || "—"}</TableCell>
                  <TableCell>{p.estado || "—"}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => marcarChamado(p.id)}>
                      <PhoneCall className="h-3.5 w-3.5 mr-1" /> Já chamou
                    </Button>
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
