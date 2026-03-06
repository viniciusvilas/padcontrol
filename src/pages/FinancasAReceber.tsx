import { useState, useMemo } from "react";
import { DollarSign, CalendarDays, CheckCircle, AlertTriangle, Plus, ChevronDown, ChevronRight, Trash2, ClipboardList } from "lucide-react";
import { useFinanceReceivables, type FinanceInstallment } from "@/hooks/useFinanceReceivables";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { format, parseISO, startOfMonth, endOfMonth, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  partial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/10 text-green-600 border-green-500/30",
  overdue: "bg-red-500/10 text-red-600 border-red-500/30",
  paid: "bg-green-500/10 text-green-600 border-green-500/30",
};
const statusLabels: Record<string, string> = {
  pending: "Pendente", partial: "Parcial", completed: "Concluído", overdue: "Em Atraso", paid: "Pago",
};

export default function FinancasAReceber() {
  const { receivables, allInstallments, createReceivable, markInstallmentPaid, deleteReceivable, isLoading } = useFinanceReceivables();
  const { activeAccounts } = useFinanceAccounts();
  const hoje = startOfDay(new Date());
  const mesInicio = startOfMonth(hoje);
  const mesFim = endOfMonth(hoje);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Summary metrics
  const totalAReceber = useMemo(() =>
    allInstallments.filter((i) => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0),
    [allInstallments]);

  const aReceberMes = useMemo(() =>
    allInstallments.filter((i) => {
      if (i.status !== "pending") return false;
      const d = parseISO(i.due_date);
      return d >= mesInicio && d <= mesFim;
    }).reduce((s, i) => s + Number(i.amount), 0),
    [allInstallments, mesInicio, mesFim]);

  const recebidoMes = useMemo(() =>
    allInstallments.filter((i) => {
      if (i.status !== "paid" || !i.paid_at) return false;
      const d = parseISO(i.paid_at);
      return d >= mesInicio && d <= mesFim;
    }).reduce((s, i) => s + Number(i.amount), 0),
    [allInstallments, mesInicio, mesFim]);

  const emAtraso = useMemo(() =>
    allInstallments.filter((i) => i.status === "pending" && isBefore(parseISO(i.due_date), hoje))
      .reduce((s, i) => s + Number(i.amount), 0),
    [allInstallments, hoje]);

  // Categories for filter
  const categories = useMemo(() => {
    const set = new Set(receivables.map((r) => r.category).filter(Boolean));
    return Array.from(set).sort();
  }, [receivables]);

  // Filtered receivables
  const filtered = useMemo(() => {
    return receivables.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterClient && !r.client_name.toLowerCase().includes(filterClient.toLowerCase())) return false;
      return true;
    });
  }, [receivables, filterStatus, filterCategory, filterClient]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getInstallmentsFor = (receivableId: string) =>
    allInstallments.filter((i) => i.receivable_id === receivableId);

  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    activeAccounts.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [activeAccounts]);

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Valores a Receber</h1>
        </div>
        <NewReceivableDialog open={openDialog} onOpenChange={setOpenDialog} accounts={activeAccounts} onCreate={createReceivable.mutateAsync} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={DollarSign} title="Total a Receber" value={fmt(totalAReceber)} color="text-primary" />
        <SummaryCard icon={CalendarDays} title="A Receber este Mês" value={fmt(aReceberMes)} color="text-primary" />
        <SummaryCard icon={CheckCircle} title="Recebido este Mês" value={fmt(recebidoMes)} color="text-success" />
        <SummaryCard icon={AlertTriangle} title="Em Atraso" value={fmt(emAtraso)} color="text-destructive" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="overdue">Em Atraso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar cliente..." value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="w-48" />
      </div>

      {/* Receivables List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum valor a receber encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const installments = getInstallmentsFor(r.id);
            const paidCount = installments.filter((i) => i.status === "paid").length;
            const isExpanded = expandedIds.has(r.id);
            return (
              <Card key={r.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(r.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <div>
                            <p className="font-semibold text-sm">{r.client_name}</p>
                            <p className="text-xs text-muted-foreground">{r.description} {r.category && `· ${r.category}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{paidCount}/{installments.length} parcelas</span>
                          <Badge className={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
                          <span className="font-bold text-sm">{fmt(Number(r.total_amount))}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteReceivable.mutate(r.id); }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {installments.map((inst) => {
                            const isOverdue = inst.status === "pending" && isBefore(parseISO(inst.due_date), hoje);
                            return (
                              <TableRow key={inst.id}>
                                <TableCell>{inst.installment_number}</TableCell>
                                <TableCell>{fmt(Number(inst.amount))}</TableCell>
                                <TableCell>{format(parseISO(inst.due_date), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-xs">{inst.account_id ? accountMap.get(inst.account_id) || "—" : "—"}</TableCell>
                                <TableCell>
                                  <Badge className={statusColors[isOverdue ? "overdue" : inst.status]}>
                                    {isOverdue ? "Em Atraso" : statusLabels[inst.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {inst.status !== "paid" && (
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markInstallmentPaid.mutate(inst)}>
                                      <CheckCircle className="h-3 w-3 mr-1" /> Recebido
                                    </Button>
                                  )}
                                  {inst.status === "paid" && inst.paid_at && (
                                    <span className="text-xs text-muted-foreground">Pago em {format(parseISO(inst.paid_at), "dd/MM/yyyy")}</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: string; color?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function NewReceivableDialog({ open, onOpenChange, accounts, onCreate }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: any[];
  onCreate: (p: any) => Promise<any>;
}) {
  const [form, setForm] = useState({
    client_name: "", description: "", category: "", total_amount: "", installments_count: "1",
    first_due_date: new Date().toISOString().split("T")[0], account_id: "none", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.client_name || !form.description || !form.total_amount) return;
    setSaving(true);
    try {
      await onCreate({
        client_name: form.client_name,
        description: form.description,
        category: form.category,
        total_amount: Number(form.total_amount),
        installments_count: Number(form.installments_count) || 1,
        first_due_date: form.first_due_date,
        account_id: form.account_id === "none" ? null : form.account_id,
        notes: form.notes || null,
      });
      setForm({ client_name: "", description: "", category: "", total_amount: "", installments_count: "1", first_due_date: new Date().toISOString().split("T")[0], account_id: "none", notes: "" });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Novo Valor a Receber</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Valor a Receber</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Cliente *</Label>
            <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div>
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Input placeholder="Consultoria, Venda..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Valor Total *</Label>
              <Input type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Parcelas</Label>
              <Input type="number" min="1" value={form.installments_count} onChange={(e) => setForm({ ...form, installments_count: e.target.value })} />
            </div>
            <div>
              <Label>1ª Parcela</Label>
              <Input type="date" value={form.first_due_date} onChange={(e) => setForm({ ...form, first_due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Conta Destino</Label>
            <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
