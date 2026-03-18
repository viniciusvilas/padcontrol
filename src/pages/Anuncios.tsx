import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Pencil, Trash2, DollarSign, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAnuncios, type Anuncio } from "@/hooks/useAnuncios";
import { usePedidos } from "@/hooks/usePedidos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import MetricCard from "@/components/shared/MetricCard";

export default function Anuncios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { anuncios, isLoading, totalInvestido } = useAnuncios();
  const { pedidos } = usePedidos();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Anuncio | null>(null);
  const [formData, setFormData] = useState({ data: format(new Date(), "yyyy-MM-dd"), valor_investido: "" });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { user_id: user!.id, data: formData.data, valor_investido: Number(formData.valor_investido) || 0 };
      if (editing) {
        const { error } = await supabase.from("anuncios").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anuncios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Atualizado!" : "Registrado!"); qc.invalidateQueries({ queryKey: ["anuncios"] }); closeForm(); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anuncios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluído!"); qc.invalidateQueries({ queryKey: ["anuncios"] }); },
    onError: () => toast.error("Erro ao excluir"),
  });

  const openNew = () => { setEditing(null); setFormData({ data: format(new Date(), "yyyy-MM-dd"), valor_investido: "" }); setFormOpen(true); };
  const openEdit = (a: Anuncio) => { setEditing(a); setFormData({ data: a.data, valor_investido: String(a.valor_investido) }); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const cpaMedio = pedidos.length > 0 ? totalInvestido / pedidos.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Anúncios</h1>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Registro</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={DollarSign} title="Total Investido" value={`R$ ${totalInvestido.toFixed(2)}`} subtitle={`c/ imposto: R$ ${(totalInvestido * 1.125).toFixed(2)}`} />
        <MetricCard icon={Target} title="CPA Médio" value={`R$ ${cpaMedio.toFixed(2)}`} subtitle={`c/ imposto: R$ ${(cpaMedio * 1.125).toFixed(2)}`} />
        <MetricCard icon={Target} title="Pedidos Feitos" value={String(pedidos.length)} />
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Valor Investido</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : anuncios.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
            ) : (
              anuncios.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.data}</TableCell>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Registro" : "Novo Registro de Anúncio"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
            <div className="space-y-4">
              <div><Label>Data</Label><Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} /></div>
              <div><Label>Valor Investido (R$)</Label><Input type="number" step="0.01" value={formData.valor_investido} onChange={(e) => setFormData({ ...formData, valor_investido: e.target.value })} /></div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{editing ? "Salvar" : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
