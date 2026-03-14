import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import PagamentoDialog from "@/components/PagamentoDialog";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

export default function Cobranca() {
  const { user } = useAuth();
  const [pagamentoPedido, setPagamentoPedido] = useState<Pedido | null>(null);
  const [editingObs, setEditingObs] = useState<string | null>(null);
  const [obsValue, setObsValue] = useState("");

  const salvarObservacao = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ observacoes: obsValue }).eq("id", id);
    if (error) toast.error("Erro ao salvar observação");
    else { toast.success("Observação salva!"); refetch(); }
    setEditingObs(null);
  };

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

  const problematicos = pedidos.filter((p) => p.cliente_problematico);
  const normais = pedidos.filter((p) => !p.cliente_problematico && p.plataforma !== "Five");
  const fivePedidos = pedidos.filter((p) => !p.cliente_problematico && p.plataforma === "Five");
  const naoCobrados = normais.filter((p) => !p.cliente_cobrado);
  const cobrados = normais.filter((p) => p.cliente_cobrado);

  const marcarCobrado = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ cliente_cobrado: true }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como cobrado!"); refetch(); }
  };

  const marcarPerdido = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ pedido_perdido: true, status: "perdido" }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Marcado como perdido"); refetch(); }
  };

  const toggleProblematico = async (id: string, valor: boolean) => {
    const { error } = await supabase.from("pedidos").update({ cliente_problematico: valor } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success(valor ? "Marcado como problemático" : "Removido dos problemáticos"); refetch(); }
  };

  const renderTable = (items: Pedido[], showCobradoBtn: boolean, isProblematico = false) => (
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
            <TableHead>Observação</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead className="w-[280px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum pedido</TableCell></TableRow>
          ) : (
            items.map((p, i) => (
              <TableRow key={p.id} className={isProblematico
                ? (i % 2 === 0 ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-amber-100/60 dark:bg-amber-900/20")
                : (i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20")
              }>
                <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                <TableCell className="whitespace-nowrap">{p.data_entrega || "—"}</TableCell>
                <TableCell className="font-medium">{p.cliente}</TableCell>
                <TableCell>{p.telefone || "—"}</TableCell>
                <TableCell>{p.produto}</TableCell>
                <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                <TableCell>
                  {editingObs === p.id ? (
                    <div className="flex flex-col gap-1 max-w-[200px]">
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        rows={3}
                        value={obsValue}
                        onChange={(e) => setObsValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); salvarObservacao(p.id); } if (e.key === "Escape") setEditingObs(null); }}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => salvarObservacao(p.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingObs(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="max-w-[200px] px-2 py-1 text-xs font-bold whitespace-pre-wrap break-words cursor-pointer hover:opacity-70 min-h-[24px]"
                      title="Clique para editar"
                      onClick={() => { setEditingObs(p.id); setObsValue(p.observacoes || ""); }}
                    >
                      {p.observacoes || <span className="text-muted-foreground italic font-normal">Adicionar obs...</span>}
                    </div>
                  )}
                </TableCell>
                <TableCell>{p.plataforma}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {isProblematico ? (
                      <>
                        <Button size="sm" onClick={() => setPagamentoPedido(p)}>💰 Pago</Button>
                        <Button size="sm" variant="destructive" onClick={() => marcarPerdido(p.id)}>❌ Perdido</Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleProblematico(p.id, false)} className="text-muted-foreground">✅ Remover</Button>
                      </>
                    ) : (
                      <>
                        {showCobradoBtn ? (
                          <Button size="sm" variant="outline" onClick={() => marcarCobrado(p.id)}>📞 Cobrado</Button>
                        ) : (
                          <Button size="sm" onClick={() => setPagamentoPedido(p)}>💰 Pago</Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => marcarPerdido(p.id)}>❌ Perdido</Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleProblematico(p.id, true)} className="text-amber-600 hover:text-amber-700">
                          ⚠️ Problemático
                        </Button>
                      </>
                    )}
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

      {fivePedidos.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-8 mb-2 flex items-center gap-2">
            📦 Pedidos Five (cobrança pela plataforma) <Badge variant="outline" className="bg-blue-500/15 text-blue-700 border-blue-200">{fivePedidos.length}</Badge>
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">Pedidos da Five — a cobrança é feita pela própria plataforma.</p>
          {renderTable(fivePedidos, false)}
        </>
      )}

      {problematicos.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-8 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Clientes Problemáticos <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-200">{problematicos.length}</Badge>
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">Clientes que enrolam para responder ou pagar.</p>
          {renderTable(problematicos, false, true)}
        </>
      )}

      <PagamentoDialog
        pedido={pagamentoPedido}
        open={!!pagamentoPedido}
        onOpenChange={(open) => { if (!open) setPagamentoPedido(null); }}
        onSuccess={refetch}
      />
    </div>
  );
}
