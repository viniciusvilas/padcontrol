import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Pencil, Trash2, DollarSign, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Anuncio = Tables<"anuncios">;

export default function Anuncios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Anuncio | null>(null);
  const [formData, setFormData] = useState({ data: format(new Date(), "yyyy-MM-dd"), orcamento: "", valor_investido: "" });

  const { data: anuncios = [], isLoading } = useQuery({
    queryKey: ["anuncios", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("user_id", user!.id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Anuncio[];
    },
    enabled: !!user,
  });

  const { data: pedidosPagos = 0 } = useQuery({
    queryKey: ["pedidos-pagos-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("pedido_pago", true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        data: formData.data,
        orcamento: Number(formData.orcamento) || 0,
        valor_investido: Number(formData.valor_investido) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("anuncios").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anuncios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Atualizado!" : "Registrado!");
      qc.invalidateQueries({ queryKey: ["anuncios"] });
      closeForm();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anuncios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Excluído!");
      qc.invalidateQueries({ queryKey: ["anuncios"] });
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const openNew = () => {
    setEditing(null);
    setFormData({ data: format(new Date(), "yyyy-MM-dd"), orcamento: "", valor_investido: "" });
    setFormOpen(true);
  };

  const openEdit = (a: Anuncio) => {
    setEditing(a);
    setFormData({ data: a.data, orcamento: String(a.orcamento), valor_investido: String(a.valor_investido) });
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const totalInvestido = anuncios.reduce((s, a) => s + Number(a.valor_investido), 0);
  const cpaMedio = pedidosPagos > 0 ? totalInvestido / pedidosPagos : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Anúncios</h1>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Registro</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ {totalInvestido.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">CPA Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ {cpaMedio.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pedidosPagos}</div></CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Valor Investido</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : anuncios.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
            ) : (
              anuncios.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.data}</TableCell>
                  <TableCell>R$ {Number(a.orcamento).toFixed(2)}</TableCell>
                  <TableCell>R$ {Number(a.valor_investido).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Registro" : "Novo Registro de Anúncio"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Data</Label><Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} /></div>
            <div><Label>Orçamento do Dia (R$)</Label><Input type="number" step="0.01" value={formData.orcamento} onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })} /></div>
            <div><Label>Valor Investido (R$)</Label><Input type="number" step="0.01" value={formData.valor_investido} onChange={(e) => setFormData({ ...formData, valor_investido: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{editing ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
