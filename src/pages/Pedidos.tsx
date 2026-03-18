import { useState, useMemo } from "react";
import { Package, Upload, Plus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePedidos, type Pedido } from "@/hooks/usePedidos";
import { useAnuncios } from "@/hooks/useAnuncios";
import { FRETE_FIVE } from "@/lib/constants";
import PedidoFilters from "@/components/pedidos/PedidoFilters";
import PedidoTable from "@/components/pedidos/PedidoTable";
import PedidoFormDialog from "@/components/pedidos/PedidoFormDialog";
import PagamentoDialog from "@/components/pedidos/PagamentoDialog";
import ImportPedidosDialog from "@/components/pedidos/ImportPedidosDialog";
import ListaTelefonicaDialog from "@/components/pedidos/ListaTelefonicaDialog";
import MetricCard from "@/components/shared/MetricCard";

export default function Pedidos() {
  const { pedidos, isLoading, refetch, toggleField, deletePedido } = usePedidos();
  const { totalInvestido } = useAnuncios();
  const [importOpen, setImportOpen] = useState(false);
  const [listaOpen, setListaOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [pagamentoPedido, setPagamentoPedido] = useState<Pedido | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [plataformaFilter, setPlataformaFilter] = useState("todas");

  const estados = useMemo(() =>
    Array.from(new Set(pedidos.map((p) => p.estado).filter(Boolean))).sort() as string[],
    [pedidos]
  );

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      const searchLower = search.toLowerCase();
      const searchDigits = search.replace(/\D/g, "");
      const matchSearch = !search ||
        p.cliente.toLowerCase().includes(searchLower) ||
        p.produto.toLowerCase().includes(searchLower) ||
        (searchDigits.length > 0 && p.cpf && p.cpf.replace(/\D/g, "").includes(searchDigits));
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      const matchEstado = estadoFilter === "todos" || p.estado === estadoFilter;
      const matchPlataforma = plataformaFilter === "todas" || p.plataforma === plataformaFilter;
      return matchSearch && matchStatus && matchEstado && matchPlataforma;
    });
  }, [pedidos, search, statusFilter, estadoFilter, plataformaFilter]);

  const pagos = filtered.filter((p) => p.pedido_pago);
  const faturamentoPagos = pagos.reduce((s, p) => s + (Number(p.valor_pago) > 0 ? Number(p.valor_pago) : Number(p.valor)), 0);
  const totalValor = filtered.reduce((sum, p) => sum + Number(p.valor), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditPedido(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1" /> Importar</Button>
          <Button variant="outline" onClick={() => setListaOpen(true)}><Phone className="h-4 w-4 mr-1" /> Lista Tel.</Button>
        </div>
      </div>

      <PedidoFilters
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
        estadoFilter={estadoFilter} onEstadoFilterChange={setEstadoFilter}
        plataformaFilter={plataformaFilter} onPlataformaFilterChange={setPlataformaFilter}
        estados={estados}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <MetricCard title="Total" value={String(filtered.length)} />
        <MetricCard title="Valor Bruto" value={`R$ ${totalValor.toFixed(2)}`} />
        <MetricCard title="Faturamento Pagos" value={`R$ ${faturamentoPagos.toFixed(2)}`} className="text-primary" />
        <MetricCard title="Pagos" value={String(pagos.length)} className="text-emerald-600" />
        <MetricCard title="Perdidos" value={String(filtered.filter((p) => p.pedido_perdido).length)} className="text-destructive" />
      </div>

      <PedidoTable
        pedidos={filtered}
        isLoading={isLoading}
        onEdit={(p) => { setEditPedido(p); setFormOpen(true); }}
        onDelete={deletePedido}
        onToggleField={toggleField}
        onPagar={setPagamentoPedido}
      />

      <PagamentoDialog pedido={pagamentoPedido} open={!!pagamentoPedido} onOpenChange={(open) => { if (!open) setPagamentoPedido(null); }} onSuccess={refetch} />
      <ImportPedidosDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={refetch} />
      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={refetch} pedido={editPedido} />
      <ListaTelefonicaDialog open={listaOpen} onOpenChange={setListaOpen} />
    </div>
  );
}
