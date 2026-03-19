import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Upload, Plus, Search, Filter, Pencil, Trash2, Megaphone, Copy, Phone, Download } from "lucide-react";
import PagamentoDialog from "@/components/PagamentoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImportPedidosDialog from "@/components/ImportPedidosDialog";
import PedidoFormDialog from "@/components/PedidoFormDialog";
import ListaTelefonicaDialog from "@/components/ListaTelefonicaDialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

const FRETE_FIVE = 35.5;

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
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [listaOpen, setListaOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [pagamentoPedido, setPagamentoPedido] = useState<Pedido | null>(null);

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ["pedidos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("pedidos").select("*").eq("user_id", user.id).order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const { data: totalAnuncios = 0 } = useQuery({
    queryKey: ["anuncios-total", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("anuncios").select("valor_investido").eq("user_id", user!.id);
      if (error) throw error;
      return data.reduce((s, a) => s + Number(a.valor_investido), 0);
    },
    enabled: !!user,
  });

  const estados = Array.from(new Set(pedidos.map((p) => p.estado).filter(Boolean))).sort() as string[];

  const filtered = pedidos.filter((p) => {
    const searchLower = search.toLowerCase();
    const searchDigits = search.replace(/\D/g, "");
    const matchSearch = !search || 
      p.cliente.toLowerCase().includes(searchLower) || 
      p.produto.toLowerCase().includes(searchLower) ||
      (searchDigits.length > 0 && p.cpf && p.cpf.replace(/\D/g, "").includes(searchDigits));
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    const matchEstado = estadoFilter === "todos" || p.estado === estadoFilter;
    return matchSearch && matchStatus && matchEstado;
  });

  const pagos = filtered.filter((p) => p.pedido_pago);
  const lucroLiquido = pagos.reduce((s, p) => s + Number(p.valor) - (p.plataforma === "Five" ? FRETE_FIVE : 0), 0);
  const totalValor = filtered.reduce((sum, p) => sum + Number(p.valor), 0);

  const toggleField = async (pedido: Pedido, field: "pedido_chegou" | "ja_foi_chamado" | "cliente_cobrado" | "pedido_pago" | "pedido_perdido") => {
    const newVal = !(pedido as any)[field];
    const updateData: any = { [field]: newVal };
    if (field === "pedido_chegou") {
      updateData.data_entrega = newVal ? new Date().toISOString().split('T')[0] : null;
    }
    const { error } = await supabase.from("pedidos").update(updateData).eq("id", pedido.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    qc.invalidateQueries({ queryKey: ["pedidos"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Todos os Pedidos</h1>
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditPedido(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Pedido</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1" /> Importar</Button>
          <Button variant="outline" onClick={() => setListaOpen(true)}><Phone className="h-4 w-4 mr-1" /> Lista Telefônica</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Estados</SelectItem>
            {estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <SummaryCard label="Total" value={String(filtered.length)} />
        <SummaryCard label="Valor Bruto" value={`R$ ${totalValor.toFixed(2)}`} />
        <SummaryCard label="Investimento Anúncios" value={`R$ ${totalAnuncios.toFixed(2)}`} className="text-amber-600" icon={<Megaphone className="h-3 w-3" />} />
        <SummaryCard label="Lucro (Pagos)" value={`R$ ${lucroLiquido.toFixed(2)}`} className="text-primary" />
        <SummaryCard label="Pagos" value={String(pagos.length)} className="text-emerald-600" />
        <SummaryCard label="Perdidos" value={String(filtered.filter((p) => p.pedido_perdido).length)} className="text-red-600" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Plataforma</TableHead>
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
              <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow key={p.id} className={i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20"}>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{p.cliente}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {p.cpf || "—"}
                      {p.cpf && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(p.cpf!); toast.success("CPF copiado!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {p.telefone || "—"}
                      {p.telefone && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(p.telefone!); toast.success("Telefone copiado!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    R$ {Number(p.valor).toFixed(2)}
                    {p.pedido_pago && p.valor_pago > 0 && p.valor_pago !== p.valor && (
                      <span className="block text-xs text-muted-foreground">(pago: R$ {Number(p.valor_pago).toFixed(2)})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.plataforma === "Five" ? "bg-amber-500/15 text-amber-700 border-amber-200" : "bg-blue-500/15 text-blue-700 border-blue-200"}>{p.plataforma}</Badge>
                  </TableCell>
                  <TableCell>{p.prazo}d</TableCell>
                  <TableCell className="whitespace-nowrap">{p.previsao_entrega || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusStyle(p.status)}>{p.status}</Badge></TableCell>
                  <TableCell>{p.estado || "—"}</TableCell>
                  <TableCell>{p.local_entrega || "—"}</TableCell>
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
                  <TableCell><Checkbox checked={p.pedido_chegou} onCheckedChange={() => toggleField(p, "pedido_chegou")} /></TableCell>
                  <TableCell><Checkbox checked={p.ja_foi_chamado} onCheckedChange={() => toggleField(p, "ja_foi_chamado")} /></TableCell>
                  <TableCell><Checkbox checked={p.cliente_cobrado} onCheckedChange={() => toggleField(p, "cliente_cobrado")} /></TableCell>
                  <TableCell><Checkbox checked={p.pedido_pago} onCheckedChange={(checked) => {
                    if (checked) { setPagamentoPedido(p); } else { toggleField(p, "pedido_pago"); }
                  }} /></TableCell>
                  <TableCell><Checkbox checked={p.pedido_perdido} onCheckedChange={() => toggleField(p, "pedido_perdido")} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPedido(p); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={async () => {
                        const { error } = await supabase.from("pedidos").delete().eq("id", p.id);
                        if (error) toast.error("Erro ao excluir");
                        else { toast.success("Pedido excluído"); refetch(); }
                      }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PagamentoDialog
        pedido={pagamentoPedido}
        open={!!pagamentoPedido}
        onOpenChange={(open) => { if (!open) setPagamentoPedido(null); }}
        onSuccess={refetch}
      />
      <ImportPedidosDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={refetch} />
      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={refetch} pedido={editPedido} />
      <ListaTelefonicaDialog open={listaOpen} onOpenChange={setListaOpen} />
    </div>
  );
}

function SummaryCard({ label, value, className, icon }: { label: string; value: string; className?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className={`text-lg font-bold ${className || ""}`}>{value}</p>
    </div>
  );
}
