import { useState, useMemo } from "react";
import { PieChart as PieChartIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceCategories } from "@/hooks/useFinanceCategories";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface BudgetForm {
  id?: string;
  category: string;
  monthly_limit: string;
}

const emptyForm: BudgetForm = { category: "", monthly_limit: "" };

function buildMonthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    opts.push({
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase()),
    });
  }
  return opts;
}

export default function FinancasOrcamento() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { filtered: expenseCategories } = useFinanceCategories("expense");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const monthOptions = useMemo(buildMonthOptions, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BudgetForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthStart = format(startOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");
  const monthFirstDay = format(startOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");

  // Budgets for the month
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["fin-budgets", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_budgets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("month", monthFirstDay)
        .order("category");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Expense transactions for the month (to compute spent per category)
  const { data: expenses = [] } = useQuery({
    queryKey: ["fin-expenses-month", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("category, amount")
        .eq("user_id", user!.id)
        .eq("type", "expense")
        .gte("date", monthStart)
        .lte("date", monthEnd);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Categories from hook (already loaded via useFinanceCategories)
  const categories = useMemo(() => expenseCategories.map((c) => c.name).sort(), [expenseCategories]);

  // Spent per category
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((t: any) => {
      const cat = t.category || "Sem categoria";
      map.set(cat, (map.get(cat) || 0) + Number(t.amount));
    });
    return map;
  }, [expenses]);

  // Budget cards data
  const budgetCards = useMemo(() => {
    return budgets.map((b: any) => {
      const spent = spentByCategory.get(b.category) || 0;
      const limit = Number(b.monthly_limit);
      const remaining = limit - spent;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { ...b, spent, remaining, pct, limit };
    });
  }, [budgets, spentByCategory]);

  const saveMutation = useMutation({
    mutationFn: async (f: BudgetForm) => {
      const payload = {
        user_id: user!.id,
        category: f.category,
        monthly_limit: Number(f.monthly_limit),
        month: monthFirstDay,
      };
      if (f.id) {
        const { error } = await supabase.from("finance_budgets").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_budgets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-budgets"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Orçamento salvo!");
    },
    onError: (err: any) => {
      if (err?.message?.includes("duplicate")) {
        toast.error("Já existe um orçamento para essa categoria neste mês.");
      } else {
        toast.error("Erro ao salvar orçamento.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-budgets"] });
      setDeleteId(null);
      toast.success("Orçamento excluído!");
    },
    onError: () => toast.error("Erro ao excluir orçamento."),
  });

  const openEdit = (b: any) => {
    setForm({ id: b.id, category: b.category, monthly_limit: String(b.monthly_limit) });
    setDialogOpen(true);
  };

  const openNew = () => { setForm(emptyForm); setDialogOpen(true); };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return "bg-destructive";
    if (pct >= 70) return "bg-yellow-500";
    return "bg-success";
  };

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando orçamentos...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <PieChartIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Orçamento por Categoria</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Definir Orçamento</Button>
        </div>
      </div>

      {/* Budget Cards */}
      {budgetCards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum orçamento definido para este mês. Clique em "Definir Orçamento" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetCards.map((b: any) => (
            <Card key={b.id} className={b.pct >= 100 ? "border-destructive/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {b.category}
                  {b.pct >= 100 && <Badge variant="destructive">Estourado</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite: <strong className="text-foreground">R$ {b.limit.toFixed(2)}</strong></span>
                  <span className="text-muted-foreground">Gasto: <strong className={b.pct >= 100 ? "text-destructive" : "text-foreground"}>R$ {b.spent.toFixed(2)}</strong></span>
                </div>
                <div className="relative">
                  <Progress value={Math.min(b.pct, 100)} className="h-3" />
                  <div
                    className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor(b.pct)}`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{b.pct.toFixed(0)}% usado</span>
                  <span className={b.remaining < 0 ? "text-destructive font-medium" : ""}>
                    {b.remaining >= 0
                      ? `R$ ${b.remaining.toFixed(2)} restantes`
                      : `R$ ${Math.abs(b.remaining).toFixed(2)} acima`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Orçamento" : "Definir Orçamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Categoria</Label>
              {categories.length > 0 ? (
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Alimentação"
                  required
                />
              )}
            </div>
            <div>
              <Label>Limite Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.monthly_limit}
                onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending || !form.category}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir orçamento?</DialogTitle></DialogHeader>
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
