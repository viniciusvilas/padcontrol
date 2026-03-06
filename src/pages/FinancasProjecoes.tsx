import { useState, useMemo } from "react";
import { LineChart as LineChartIcon, Plus, Pencil, Trash2, Target } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, ComposedChart } from "recharts";
import { toast } from "sonner";

const chartConfig: ChartConfig = {
  income: { label: "Receita Projetada", color: "hsl(var(--success))" },
  expense: { label: "Despesa Projetada", color: "hsl(var(--destructive))" },
  balance: { label: "Saldo Acumulado", color: "hsl(var(--primary))" },
};

interface SourceForm {
  id?: string;
  name: string;
  expected_monthly_amount: string;
  is_active: boolean;
  notes: string;
}

const emptyForm: SourceForm = { name: "", expected_monthly_amount: "", is_active: true, notes: "" };

export default function FinancasProjecoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SourceForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [goalAmount, setGoalAmount] = useState("");
  const [goalMonths, setGoalMonths] = useState("6");

  // Income sources
  const { data: sources = [], isLoading: loadingSources } = useQuery({
    queryKey: ["fin-income-sources", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_income_sources")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Recurring bills
  const { data: recurringBills = [] } = useQuery({
    queryKey: ["fin-bills-recurring", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_bills")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_recurring", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const monthlyIncome = sources.filter((s: any) => s.is_active).reduce((sum: number, s: any) => sum + Number(s.expected_monthly_amount), 0);
  const monthlyExpense = recurringBills.reduce((sum: number, b: any) => sum + Number(b.amount), 0);

  // Chart data: 6 months projection
  const projectionData = useMemo(() => {
    const data: { label: string; income: number; expense: number; balance: number }[] = [];
    let accumulated = 0;
    for (let i = 0; i < 6; i++) {
      const d = addMonths(new Date(), i);
      const label = format(d, "MMM/yy", { locale: ptBR });
      accumulated += monthlyIncome - monthlyExpense;
      data.push({ label, income: monthlyIncome, expense: monthlyExpense, balance: accumulated });
    }
    return data;
  }, [monthlyIncome, monthlyExpense]);

  // Goal check
  const goalValue = Number(goalAmount) || 0;
  const goalMonthsNum = Number(goalMonths) || 6;
  const projectedBalance = (monthlyIncome - monthlyExpense) * goalMonthsNum;
  const goalReachable = projectedBalance >= goalValue;

  // CRUD
  const saveMutation = useMutation({
    mutationFn: async (f: SourceForm) => {
      const payload = {
        user_id: user!.id,
        name: f.name,
        expected_monthly_amount: Number(f.expected_monthly_amount),
        is_active: f.is_active,
        notes: f.notes || null,
      };
      if (f.id) {
        const { error } = await supabase.from("finance_income_sources").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_income_sources").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-income-sources"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Fonte de renda salva!");
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_income_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-income-sources"] });
      setDeleteId(null);
      toast.success("Fonte excluída!");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const openEdit = (s: any) => {
    setForm({
      id: s.id,
      name: s.name,
      expected_monthly_amount: String(s.expected_monthly_amount),
      is_active: s.is_active,
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  if (loadingSources) return <div className="text-muted-foreground p-6">Carregando projeções...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LineChartIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Projeções Financeiras</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Receita Mensal Esperada</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">R$ {monthlyIncome.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Despesas Fixas Mensais</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">R$ {monthlyExpense.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Saldo Projetado/Mês</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyIncome - monthlyExpense >= 0 ? "text-success" : "text-destructive"}`}>
              R$ {(monthlyIncome - monthlyExpense).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Projeção de Fluxo de Caixa (6 meses)</CardTitle></CardHeader>
        <CardContent>
          {monthlyIncome === 0 && monthlyExpense === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Cadastre fontes de renda e contas recorrentes para ver a projeção.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ComposedChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="balance" stroke="var(--color-balance)" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Goal card + Income sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> Meta Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta de saldo (R$)</Label>
                <Input type="number" step="0.01" min="0" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="Ex: 10000" />
              </div>
              <div>
                <Label>Em quantos meses?</Label>
                <Input type="number" min="1" max="60" value={goalMonths} onChange={(e) => setGoalMonths(e.target.value)} />
              </div>
            </div>
            {goalValue > 0 && (
              <div className={`p-4 rounded-lg border ${goalReachable ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
                <p className="font-medium text-sm">
                  {goalReachable ? "✅ Meta atingível!" : "❌ Meta não será atingida com a projeção atual."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo projetado em {goalMonthsNum} meses: <span className="font-semibold">R$ {projectedBalance.toFixed(2)}</span>
                  {!goalReachable && ` — Faltam R$ ${(goalValue - projectedBalance).toFixed(2)}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Sources */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fontes de Renda</CardTitle>
            <Button size="sm" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />Nova Fonte
            </Button>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma fonte de renda cadastrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((s: any, i: number) => (
                    <TableRow key={s.id} className={i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20"}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">R$ {Number(s.expected_monthly_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.is_active ? "default" : "outline"} className={s.is_active ? "bg-success text-success-foreground" : ""}>
                          {s.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{form.id ? "Editar Fonte" : "Nova Fonte de Renda"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Freelance" required />
            </div>
            <div>
              <Label>Valor Mensal Esperado</Label>
              <Input type="number" step="0.01" min="0" value={form.expected_monthly_amount} onChange={(e) => setForm({ ...form, expected_monthly_amount: e.target.value })} required />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
              <Label className="cursor-pointer">Fonte ativa</Label>
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
          <DialogHeader><DialogTitle>Excluir fonte de renda?</DialogTitle></DialogHeader>
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
