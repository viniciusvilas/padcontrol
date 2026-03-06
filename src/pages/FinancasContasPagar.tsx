import { useState, useMemo, useEffect } from "react";
import { Receipt, Plus, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceCategories } from "@/hooks/useFinanceCategories";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { format, parseISO, isBefore, startOfDay, startOfMonth, endOfMonth, subMonths, addMonths, addWeeks, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface BillForm {
  id?: string;
  name: string;
  amount: string;
  due_date: string;
  category: string;
  is_recurring: boolean;
  recurrence_interval: string;
  notes: string;
  account_id: string;
}

const emptyForm: BillForm = {
  name: "",
  amount: "",
  due_date: format(new Date(), "yyyy-MM-dd"),
  category: "",
  is_recurring: false,
  recurrence_interval: "",
  notes: "",
  account_id: "",
};

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

export default function FinancasContasPagar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { filtered: expenseCategories } = useFinanceCategories("expense");
  const { activeAccounts } = useFinanceAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BillForm>(emptyForm);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const monthOptions = useMemo(buildMonthOptions, []);

  const monthStart = format(startOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd");

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["fin-bills", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_bills")
        .select("*")
        .eq("user_id", user!.id)
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-update overdue bills
  useEffect(() => {
    const today = startOfDay(new Date());
    const overdueBills = bills.filter(
      (b: any) => b.status === "pending" && isBefore(parseISO(b.due_date), today)
    );
    if (overdueBills.length > 0) {
      Promise.all(
        overdueBills.map((b: any) =>
          supabase.from("finance_bills").update({ status: "overdue" }).eq("id", b.id)
        )
      ).then(() => {
        qc.invalidateQueries({ queryKey: ["fin-bills"] });
      });
    }
  }, [bills, qc]);

  // Columns
  const aVencer = bills.filter((b: any) => b.status === "pending");
  const vencidas = bills.filter((b: any) => b.status === "overdue");
  const pagas = bills.filter((b: any) => b.status === "paid");

  // Save bill
  const saveMutation = useMutation({
    mutationFn: async (f: BillForm) => {
      const payload: any = {
        user_id: user!.id,
        name: f.name,
        amount: Number(f.amount),
        due_date: f.due_date,
        category: f.category,
        is_recurring: f.is_recurring,
        recurrence_interval: f.is_recurring && f.recurrence_interval ? f.recurrence_interval : null,
        notes: f.notes || null,
        status: "pending",
        account_id: f.account_id || null,
      };
      if (f.id) {
        const { status, ...updatePayload } = payload;
        const { error } = await supabase.from("finance_bills").update(updatePayload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_bills").insert(payload);
        if (error) throw error;

        // If recurring, create future bills
        if (f.is_recurring && f.recurrence_interval) {
          const futureBills = [];
          let nextDate = parseISO(f.due_date);
          for (let i = 0; i < 11; i++) {
            if (f.recurrence_interval === "monthly") nextDate = addMonths(nextDate, 1);
            else if (f.recurrence_interval === "weekly") nextDate = addWeeks(nextDate, 1);
            else nextDate = addYears(nextDate, 1);
            futureBills.push({ ...payload, due_date: format(nextDate, "yyyy-MM-dd") });
          }
          if (futureBills.length > 0) {
            await supabase.from("finance_bills").insert(futureBills);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-bills"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Conta salva!");
    },
    onError: () => toast.error("Erro ao salvar conta."),
  });

  // Mark as paid
  const markPaidMutation = useMutation({
    mutationFn: async (bill: any) => {
      // Update bill status
      const { error: e1 } = await supabase.from("finance_bills").update({ status: "paid" }).eq("id", bill.id);
      if (e1) throw e1;
      // Create expense transaction
      const { error: e2 } = await supabase.from("finance_transactions").insert({
        user_id: user!.id,
        date: format(new Date(), "yyyy-MM-dd"),
        description: `Conta paga: ${bill.name}`,
        amount: Number(bill.amount),
        type: "expense",
        category: bill.category || "Conta",
        source: "",
        is_recurring: bill.is_recurring,
        notes: `Conta a pagar #${bill.id}`,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-bills"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions-all"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions-6m"] });
      toast.success("Conta marcada como paga e transação registrada!");
    },
    onError: () => toast.error("Erro ao marcar como paga."),
  });

  const openNew = () => { setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (bill: any) => {
    setForm({
      id: bill.id,
      name: bill.name,
      amount: String(bill.amount),
      due_date: bill.due_date,
      category: bill.category || "",
      is_recurring: bill.is_recurring,
      recurrence_interval: bill.recurrence_interval || "",
      notes: bill.notes || "",
      account_id: bill.account_id || "",
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando contas...</div>;

  const BillCard = ({ bill }: { bill: any }) => {
    const isOverdue = bill.status === "overdue";
    const isPaid = bill.status === "paid";
    return (
      <div
        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
          isOverdue ? "border-destructive/60 bg-destructive/5" : isPaid ? "border-success/40 bg-success/5" : "border-border hover:border-primary/30"
        }`}
        onClick={() => !isPaid && openEdit(bill)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm truncate">{bill.name}</h3>
          <Badge
            variant={isOverdue ? "destructive" : isPaid ? "default" : "outline"}
            className={isPaid ? "bg-success text-success-foreground" : ""}
          >
            {isOverdue ? "Vencida" : isPaid ? "Paga" : "Pendente"}
          </Badge>
        </div>
        <p className="text-lg font-bold">R$ {Number(bill.amount).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Vencimento: {format(parseISO(bill.due_date), "dd/MM/yyyy")}
          {bill.category && ` · ${bill.category}`}
        </p>
        {!isPaid && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full text-success border-success/30 hover:bg-success/10"
            onClick={(e) => { e.stopPropagation(); markPaidMutation.mutate(bill); }}
            disabled={markPaidMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Paga
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Conta</Button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning" /> A Vencer
              <Badge variant="outline" className="ml-auto">{aVencer.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aVencer.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta a vencer.</p>
            ) : aVencer.map((b: any) => <BillCard key={b.id} bill={b} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" /> Vencidas
              <Badge variant="destructive" className="ml-auto">{vencidas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vencidas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta vencida.</p>
            ) : vencidas.map((b: any) => <BillCard key={b.id} bill={b} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" /> Pagas
              <Badge variant="outline" className="ml-auto bg-success/10">{pagas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pagas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta paga.</p>
            ) : pagas.map((b: any) => <BillCard key={b.id} bill={b} />)}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Aluguel" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta</Label>
              <Select value={form.account_id || "none"} onValueChange={(v) => setForm({ ...form, account_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_recurring} onCheckedChange={(v) => setForm({ ...form, is_recurring: !!v })} />
              <Label className="cursor-pointer">Conta recorrente</Label>
            </div>
            {form.is_recurring && (
              <div>
                <Label>Intervalo de recorrência</Label>
                <Select value={form.recurrence_interval} onValueChange={(v) => setForm({ ...form, recurrence_interval: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
    </div>
  );
}
