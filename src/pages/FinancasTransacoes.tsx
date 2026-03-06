import { useState, useMemo } from "react";
import { ArrowLeftRight, Plus, Search, Pencil, Trash2, RotateCcw, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceCategories } from "@/hooks/useFinanceCategories";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { format, parseISO, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface TxForm {
  id?: string;
  date: string;
  description: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  source: string;
  is_recurring: boolean;
  notes: string;
  account_id: string;
}

const emptyForm: TxForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  description: "",
  amount: "",
  type: "expense",
  category: "",
  source: "",
  is_recurring: false,
  notes: "",
  account_id: "",
};

const periodOptions = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Tudo" },
];

const PAGE_SIZE = 15;

export default function FinancasTransacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { filtered: incomeCategories } = useFinanceCategories("income");
  const { filtered: expenseCategories } = useFinanceCategories("expense");
  const { categories: allCats } = useFinanceCategories();
  const { activeAccounts, accounts: allAccounts } = useFinanceAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TxForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(0);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["fin-transactions-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // All categories for filter: merge dynamic + any legacy from transactions
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    allCats.forEach((c) => set.add(c.name));
    transactions.forEach((t: any) => { if (t.category) set.add(t.category); });
    return Array.from(set).sort();
  }, [transactions, allCats]);

  const filtered = useMemo(() => {
    let result = transactions as any[];
    // Period
    if (period !== "all") {
      const now = new Date();
      const cutoff = period === "month" ? startOfMonth(now) : subDays(now, Number(period));
      result = result.filter((t) => parseISO(t.date) >= cutoff);
    }
    if (typeFilter !== "all") result = result.filter((t) => t.type === typeFilter);
    if (categoryFilter !== "all") result = result.filter((t) => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.description?.toLowerCase().includes(q));
    }
    return result;
  }, [transactions, period, typeFilter, categoryFilter, search]);

  const totalReceitas = filtered.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalDespesas = filtered.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (f: TxForm) => {
      const payload: any = {
        user_id: user!.id,
        date: f.date,
        description: f.description,
        amount: Number(f.amount),
        type: f.type,
        category: f.category,
        source: f.source,
        is_recurring: f.is_recurring,
        notes: f.notes || null,
        account_id: f.account_id || null,
      };
      if (f.id) {
        const { error } = await supabase.from("finance_transactions").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_transactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-transactions-all"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions-6m"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Transação salva!");
    },
    onError: () => toast.error("Erro ao salvar transação."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-transactions-all"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions-6m"] });
      setDeleteId(null);
      toast.success("Transação excluída!");
    },
    onError: () => toast.error("Erro ao excluir transação."),
  });

  const openEdit = (tx: any) => {
    setForm({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      category: tx.category || "",
      source: tx.source || "",
      is_recurring: tx.is_recurring,
      notes: tx.notes || "",
      account_id: tx.account_id || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => { setForm(emptyForm); setDialogOpen(true); };

  // Import sales from pedidos
  const importSalesMutation = useMutation({
    mutationFn: async () => {
      // Fetch ALL paid orders without limit
      const { data: paidOrders, error: e1 } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user!.id)
        .eq("pedido_pago", true);
      if (e1) throw e1;
      if (!paidOrders || paidOrders.length === 0) return { imported: 0, skipped: 0 };

      // Fetch all existing imported notes for duplicate check
      const { data: existing, error: e2 } = await supabase
        .from("finance_transactions")
        .select("id, notes")
        .eq("user_id", user!.id)
        .eq("category", "Pay After Delivery");
      if (e2) throw e2;

      // Build map of existing imported transactions for duplicate check & date update
      const existingMap = new Map<string, string>();
      (existing || []).forEach((t: any) => { if (t.notes && t.id) existingMap.set(t.notes, t.id); });

      const toInsert: any[] = [];
      const toUpdate: { id: string; date: string }[] = [];
      let skipped = 0;

      for (const o of paidOrders) {
        const ref = `pedido:${o.id}`;
        const correctDate = o.data_entrega || o.data;
        if (existingMap.has(ref)) {
          // Update date of already-imported transaction to use delivery date
          toUpdate.push({ id: existingMap.get(ref)!, date: correctDate });
          skipped++;
          continue;
        }
        toInsert.push({
          user_id: user!.id,
          date: correctDate,
          description: `Venda: ${o.cliente} - ${o.produto}`,
          amount: Number(o.valor),
          type: "income" as const,
          category: "Pay After Delivery",
          source: "Módulo de Vendas",
          is_recurring: false,
          notes: ref,
        });
      }

      // Update dates of existing transactions
      for (const u of toUpdate) {
        await supabase.from("finance_transactions").update({ date: u.date }).eq("id", u.id);
      }

      // Insert in batches of 50
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { error: e3 } = await supabase.from("finance_transactions").insert(batch);
        if (e3) throw e3;
      }
      return { imported: toInsert.length, skipped };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["fin-transactions-all"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions"] });
      qc.invalidateQueries({ queryKey: ["fin-transactions-6m"] });
      if (result.imported === 0 && result.skipped === 0) {
        toast.info("Nenhuma venda paga encontrada.");
      } else {
        toast.success(`${result.imported} importados, ${result.skipped} atualizados (datas corrigidas)`);
      }
    },
    onError: () => toast.error("Erro ao importar vendas."),
  });

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando transações...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Transações</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => importSalesMutation.mutate()}
            disabled={importSalesMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {importSalesMutation.isPending ? "Sincronizando..." : "Sincronizar Vendas"}
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Transação</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Receitas</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-success">R$ {totalReceitas.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Despesas</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-destructive">R$ {totalDespesas.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">Saldo</CardTitle></CardHeader>
          <CardContent><div className={`text-xl font-bold ${totalReceitas - totalDespesas >= 0 ? "text-success" : "text-destructive"}`}>R$ {(totalReceitas - totalDespesas).toFixed(2)}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar descrição..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(0); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periodOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Recorrente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Nenhuma transação encontrada.</TableCell></TableRow>
                ) : paginated.map((tx: any, i: number) => (
                  <TableRow key={tx.id} className={i % 2 === 0 ? "bg-purple-50/60 dark:bg-purple-950/20" : "bg-purple-100/60 dark:bg-purple-900/20"}>
                    <TableCell className="whitespace-nowrap">{format(parseISO(tx.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                    <TableCell>{tx.category || "—"}</TableCell>
                    <TableCell>{tx.source || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "income" ? "default" : "destructive"} className={tx.type === "income" ? "bg-success text-success-foreground" : ""}>
                        {tx.type === "income" ? "Receita" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">R$ {Number(tx.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-center">{tx.is_recurring ? <RotateCcw className="h-4 w-4 mx-auto text-primary" /> : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(tx.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{filtered.length} transações · Página {page + 1} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(form.type === "income" ? incomeCategories : expenseCategories).map((c) => (
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fonte</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Ex: Pay After Delivery" />
              </div>
              <div>
                <Label>Conta</Label>
                <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
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
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_recurring} onCheckedChange={(v) => setForm({ ...form, is_recurring: !!v })} />
              <Label className="cursor-pointer">Transação recorrente</Label>
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

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir transação?</DialogTitle></DialogHeader>
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
