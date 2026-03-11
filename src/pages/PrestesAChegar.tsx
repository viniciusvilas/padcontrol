import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Pencil, PackageCheck, Copy, Truck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import PedidoFormDialog from "@/components/PedidoFormDialog";
import type { Tables } from "@/integrations/supabase/types";
import { parseISO, isWeekend, addDays } from "date-fns";

function businessDaysDiff(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  if (end >= start) {
    let count = 0;
    let current = new Date(start);
    while (current < end) {
      current = addDays(current, 1);
      if (!isWeekend(current)) count++;
    }
    return count;
  } else {
    let count = 0;
    let current = new Date(end);
    while (current < start) {
      current = addDays(current, 1);
      if (!isWeekend(current)) count++;
    }
    return -count;
  }
}

type Pedido = Tables<"pedidos">;

export default function PrestesAChegar() {
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ["pedidos-prestes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .eq("pedido_chegou", false)
        .eq("pedido_perdido", false)
        .order("previsao_entrega", { ascending: true });
      if (error) throw error;
      return (data as Pedido[]).filter((p) => {
        if (!p.previsao_entrega) return false;
        const dias = businessDaysDiff(new Date(), parseISO(p.previsao_entrega));
        return dias <= 5;
      });
    },
    enabled: !!user,
  });

  const emRota = pedidos.filter((p) => (p as any).em_rota);
  const aguardando = pedidos.filter((p) => !(p as any).em_rota);

  const diasRestantes = (previsao: string | null) => {
    if (!previsao) return null;
    const dias = differenceInCalendarDays(parseISO(previsao), new Date());
    if (dias < 0) return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/20">Atrasado {Math.abs(dias)}d</Badge>;
    if (dias === 0) return <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-200">Hoje</Badge>;
    return <Badge variant="outline" className="bg-blue-500/15 text-blue-700 border-blue-200">{dias}d restante{dias > 1 ? "s" : ""}</Badge>;
  };

  const marcarChegou = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ pedido_chegou: true, data_entrega: new Date().toISOString().split('T')[0] } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como chegou!"); refetch(); }
  };

  const toggleEmRota = async (id: string, valor: boolean) => {
    const { error } = await supabase.from("pedidos").update({ em_rota: valor } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success(valor ? "Marcado como em rota!" : "Removido da rota"); refetch(); }
  };

  const renderTable = (items: Pedido[], isEmRota: boolean) => (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Previsão</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Rastreio</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[160px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum pedido</TableCell></TableRow>
          ) : (
            items.map((p, i) => (
              <TableRow key={p.id} className={isEmRota
                ? (i % 2 === 0 ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "bg-emerald-100/60 dark:bg-emerald-900/20")
                : (i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20")
              }>
                <TableCell className="whitespace-nowrap">{p.previsao_entrega}</TableCell>
                <TableCell>{diasRestantes(p.previsao_entrega)}</TableCell>
                <TableCell className="font-medium">{p.cliente}</TableCell>
                <TableCell>{p.telefone || "—"}</TableCell>
                <TableCell>{p.produto}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {p.rastreio ? (
                    <span className="flex items-center gap-1">
                      {p.rastreio.startsWith("http") ? (
                        <a href={p.rastreio} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Rastrear</a>
                      ) : p.rastreio}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(p.rastreio!); toast.success("Link copiado!"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>{p.local_entrega || "—"}</TableCell>
                <TableCell>{p.estado || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => marcarChegou(p.id)} className="gap-1">
                      <PackageCheck className="h-3.5 w-3.5" /> Chegou
                    </Button>
                    {isEmRota ? (
                      <Button size="sm" variant="ghost" onClick={() => toggleEmRota(p.id, false)} className="gap-1 text-muted-foreground">
                        <X className="h-3.5 w-3.5" /> Tirar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toggleEmRota(p.id, true)} className="gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        <Truck className="h-3.5 w-3.5" /> Em Rota
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPedido(p); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
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
        <Clock className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Prestes a Chegar</h1>
        <Badge variant="secondary">{pedidos.length}</Badge>
      </div>
      <p className="text-muted-foreground mb-4">Pedidos com previsão de entrega nos próximos 5 dias úteis ou atrasados.</p>

      {emRota.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" /> Em Rota <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-200">{emRota.length}</Badge>
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">Pedidos que estão a caminho da entrega.</p>
          {renderTable(emRota, true)}
          <div className="mt-6" />
        </>
      )}

      <h2 className="text-lg font-semibold mb-2">Aguardando <Badge variant="outline">{aguardando.length}</Badge></h2>
      <p className="text-muted-foreground mb-3 text-sm">Pedidos aguardando entrega.</p>
      {renderTable(aguardando, false)}

      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={refetch} pedido={editPedido} />
    </div>
  );
}
