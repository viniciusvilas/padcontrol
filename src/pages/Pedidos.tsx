import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Upload, Plus, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImportPedidosDialog from "@/components/ImportPedidosDialog";
import PedidoFormDialog from "@/components/PedidoFormDialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "criado", label: "Criado" },
  { value: "aguardando", label: "Aguardando" },
  { value: "em_cobranca", label: "Em Cobrança" },
  { value: "pago", label: "Pago" },
  { value: "perdido", label: "Perdido" },
];

const statusStyle = (s: string) => {
  switch (s) {
    case "pago": return "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400";
    case "perdido": return "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400";
    case "em_cobranca": return "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-400";
    case "aguardando": return "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function Pedidos() {
  const { user } = useAuth();
  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ["pedidos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const filtered = pedidos.filter((p) => {
    const matchSearch = !search || p.cliente.toLowerCase().includes(search.toLowerCase()) || p.produto.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValor = filtered.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalFrete = filtered.filter((p) => p.plataforma === "Five").length * 35;
  const totalLiquido = totalValor - totalFrete;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Todos os Pedidos</h1>
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditPedido(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Pedido
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold">{filtered.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Valor Bruto</p>
          <p className="text-lg font-bold">R$ {totalValor.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Frete (Five)</p>
          <p className="text-lg font-bold text-amber-600">R$ {totalFrete.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Líquido</p>
          <p className="text-lg font-bold text-primary">R$ {totalLiquido.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Pagos</p>
          <p className="text-lg font-bold text-emerald-600">{filtered.filter((p) => p.pedido_pago).length}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Perdidos</p>
          <p className="text-lg font-bold text-red-600">{filtered.filter((p) => p.pedido_perdido).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Rastreio</TableHead>
              <TableHead>Chegou</TableHead>
              <TableHead>Chamado</TableHead>
              <TableHead>Cobrado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Perdido</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={18} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={18} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium whitespace-nowrap">{p.cliente}</TableCell>
                  <TableCell className="whitespace-nowrap">{p.telefone || "—"}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell className="whitespace-nowrap">R$ {Number(p.valor).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.plataforma === "Five" ? "bg-amber-500/15 text-amber-700 border-amber-200" : "bg-blue-500/15 text-blue-700 border-blue-200"}>
                      {p.plataforma}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell>{p.prazo}d</TableCell>
                  <TableCell className="whitespace-nowrap">{p.previsao_entrega || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyle(p.status)}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>{p.estado || "—"}</TableCell>
                  <TableCell>{p.local_entrega || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{p.rastreio || "—"}</TableCell>
                  <TableCell>{p.pedido_chegou ? "✅" : "—"}</TableCell>
                  <TableCell>{p.ja_foi_chamado ? "✅" : "—"}</TableCell>
                  <TableCell>{p.cliente_cobrado ? "✅" : "—"}</TableCell>
                  <TableCell>{p.pedido_pago ? "✅" : "—"}</TableCell>
                  <TableCell>{p.pedido_perdido ? "❌" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPedido(p); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={async () => {
                        const { error } = await supabase.from("pedidos").delete().eq("id", p.id);
                        if (error) toast.error("Erro ao excluir");
                        else { toast.success("Pedido excluído"); refetch(); }
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImportPedidosDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={refetch} />
      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={refetch} pedido={editPedido} />
    </div>
  );
}
