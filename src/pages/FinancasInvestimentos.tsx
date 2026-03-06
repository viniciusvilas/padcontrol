import { useState, useMemo } from "react";
import { TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

const pieConfig: ChartConfig = { value: { label: "Valor" } };
const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))",
  "hsl(var(--info))", "hsl(var(--accent-foreground))", "hsl(var(--destructive))",
  "hsl(245 58% 70%)", "hsl(38 70% 60%)", "hsl(160 50% 45%)",
];

interface InvForm {
  id?: string;
  name: string;
  type: string;
  invested_amount: string;
  current_value: string;
  last_updated: string;
  notes: string;
}

const emptyForm: InvForm = {
  name: "",
  type: "",
  invested_amount: "",
  current_value: "",
  last_updated: format(new Date(), "yyyy-MM-dd"),
  notes: "",
};

export default function FinancasInvestimentos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<InvForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["fin-investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_investments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalInvested = investments.reduce((s: number, i: any) => s + Number(i.invested_amount), 0);
  const totalCurrent = investments.reduce((s: number, i: any) => s + Number(i.current_value), 0);
  const rentGeral = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

  // Donut by type
  const donutData = useMemo(() => {
    const map = new Map<string, number>();
    investments.forEach((inv: any) => {
      const t = inv.type || "Outro";
      map.set(t, (map.get(t) || 0) + Number(inv.current_value));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [investments]);

  const saveMutation = useMutation({
    mutationFn: async (f: InvForm) => {
      const payload = {
        user_id: user!.id,
        name: f.name,
        type: f.type,
        invested_amount: Number(f.invested_amount),
        current_value: Number(f.current_value),
        last_updated: f.last_updated,
        notes: f.notes || null,
      };
      if (f.id) {
        const { error } = await supabase.from("finance_investments").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_investments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-investments"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Investimento salvo!");
    },
    onError: () => toast.error("Erro ao salvar investimento."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-investments"] });
      setDeleteId(null);
      toast.success("Investimento excluído!");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const openEdit = (inv: any) => {
    setForm({
      id: inv.id,
      name: inv.name,
      type: inv.type || "",
      invested_amount: String(inv.invested_amount),
      current_value: String(inv.current_value),
      last_updated: inv.last_updated,
      notes: inv.notes || "",
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando investimentos...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Investimentos</h1>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Adicionar Ativo
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Total Investido</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ {totalInvested.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Valor Atual Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">R$ {totalCurrent.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Rentabilidade Geral</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${rentGeral >= 0 ? "text-success" : "text-destructive"}`}>
              {rentGeral >= 0 ? "+" : ""}{rentGeral.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donut + Asset cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Distribuição por Tipo</CardTitle></CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem ativos</p>
            ) : (
              <ChartContainer config={pieConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={95}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Asset cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {investments.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full text-center py-10">Nenhum investimento cadastrado.</p>
          ) : investments.map((inv: any) => {
            const rent = Number(inv.invested_amount) > 0
              ? ((Number(inv.current_value) - Number(inv.invested_amount)) / Number(inv.invested_amount)) * 100
              : 0;
            return (
              <Card key={inv.id} className="relative">
                <CardHeader className="pb-2 space-y-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium truncate">{inv.name}</CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">{inv.type || "Outro"}</Badge>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investido</span>
                    <span>R$ {Number(inv.invested_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Atual</span>
                    <span className="font-semibold">R$ {Number(inv.current_value).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rentabilidade</span>
                    <span className={`font-bold ${rent >= 0 ? "text-success" : "text-destructive"}`}>
                      {rent >= 0 ? "+" : ""}{rent.toFixed(2)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar Ativo" : "Adicionar Ativo"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Tesouro Selic" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Ex: Renda Fixa" required />
              </div>
              <div>
                <Label>Última Atualização</Label>
                <Input type="date" value={form.last_updated} onChange={(e) => setForm({ ...form, last_updated: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Investido</Label>
                <Input type="number" step="0.01" min="0" value={form.invested_amount} onChange={(e) => setForm({ ...form, invested_amount: e.target.value })} required />
              </div>
              <div>
                <Label>Valor Atual</Label>
                <Input type="number" step="0.01" min="0" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir investimento?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
