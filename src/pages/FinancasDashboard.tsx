import { useState, useMemo, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Scale, Landmark, AlertTriangle, ArrowLeftRight, Package, PieChart as PieChartIcon, Building2, Wallet2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAccounts, isPlatformAccount, isBankAccount } from "@/hooks/useFinanceAccounts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInCalendarDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

const barConfig: ChartConfig = {
  income: { label: "Receitas", color: "hsl(var(--success))" },
  expense: { label: "Despesas", color: "hsl(var(--destructive))" },
};
const pieConfig: ChartConfig = { value: { label: "Valor" } };
const envelopeChartConfig: ChartConfig = { value: { label: "Alocado" } };
const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent-foreground))", "hsl(var(--success))",
  "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))",
  "hsl(245 58% 70%)", "hsl(38 70% 60%)", "hsl(160 50% 45%)",
];

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

export default function FinancasDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const monthOptions = useMemo(buildMonthOptions, []);
  const { accounts, activeAccounts } = useFinanceAccounts();

  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd = endOfMonth(monthStart);

  // Transactions for selected month
  const { data: transactions = [] } = useQuery({
    queryKey: ["fin-transactions", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions").select("*")
        .eq("user_id", user!.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Transactions for last 6 months (bar chart)
  const sixMonthsAgo = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd");
  const { data: sixMonthTx = [] } = useQuery({
    queryKey: ["fin-transactions-6m", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions").select("*")
        .eq("user_id", user!.id)
        .gte("date", sixMonthsAgo)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Bills
  const { data: bills = [] } = useQuery({
    queryKey: ["fin-bills-upcoming", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_bills").select("*")
        .eq("user_id", user!.id).eq("status", "pending")
        .order("due_date", { ascending: true }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Bills for current month (pending + overdue) for summary cards
  const { data: billsMonth = [] } = useQuery({
    queryKey: ["fin-bills-month-summary", user?.id],
    queryFn: async () => {
      const now = new Date();
      const ms = format(startOfMonth(now), "yyyy-MM-dd");
      const me = format(endOfMonth(now), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("finance_bills").select("*")
        .eq("user_id", user!.id)
        .in("status", ["pending", "overdue"])
        .gte("due_date", ms)
        .lte("due_date", me);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Investments
  const { data: investments = [] } = useQuery({
    queryKey: ["fin-investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_investments").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Budgets
  const { data: budgets = [] } = useQuery({
    queryKey: ["fin-budgets", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_budgets").select("*")
        .eq("user_id", user!.id)
        .eq("month", format(monthStart, "yyyy-MM-dd"))
        .order("category");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Envelopes
  const { data: envelopes = [] } = useQuery({
    queryKey: ["finance-envelopes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_envelopes").select("*")
        .eq("user_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Transfers (last 5)
  const { data: recentTransfers = [] } = useQuery({
    queryKey: ["finance-transfers-recent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transfers").select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // PAD revenue
  const { data: pedidosPagos = [] } = useQuery({
    queryKey: ["pad-revenue", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos").select("valor")
        .eq("user_id", user!.id).eq("pedido_pago", true)
        .gte("data", format(monthStart, "yyyy-MM-dd"))
        .lte("data", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-create PAD income source
  const { data: last3mPedidos = [] } = useQuery({
    queryKey: ["pad-avg-3m", user?.id],
    queryFn: async () => {
      const threeMonthsAgo = format(startOfMonth(subMonths(new Date(), 3)), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("pedidos").select("valor")
        .eq("user_id", user!.id).eq("pedido_pago", true)
        .gte("data", threeMonthsAgo);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: existingPadSource } = useQuery({
    queryKey: ["pad-income-source", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_income_sources").select("id")
        .eq("user_id", user!.id).eq("name", "Pay After Delivery").maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || existingPadSource !== null || last3mPedidos.length === 0) return;
    const avg = last3mPedidos.reduce((s: number, p: any) => s + Number(p.valor), 0) / 3;
    if (avg > 0) {
      supabase.from("finance_income_sources").insert({
        user_id: user.id, name: "Pay After Delivery",
        expected_monthly_amount: Math.round(avg * 100) / 100, is_active: true,
        notes: "Criado automaticamente com base na média dos últimos 3 meses de vendas.",
      }).then(() => {
        qc.invalidateQueries({ queryKey: ["fin-income-sources"] });
        qc.invalidateQueries({ queryKey: ["pad-income-source"] });
      });
    }
  }, [user, existingPadSource, last3mPedidos, qc]);

  const padRevenue = pedidosPagos.reduce((s: number, p: any) => s + Number(p.valor), 0);

  // Metrics
  const receitas = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const despesas = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const saldo = receitas - despesas;

  // Account totals - separate bank from platform
  const activeBankAccounts = activeAccounts.filter(isBankAccount);
  const activePlatformAccounts = activeAccounts.filter(isPlatformAccount);
  const totalBalance = activeBankAccounts.reduce((s, a) => s + a.computedBalance, 0);
  const totalPlatformBalance = activePlatformAccounts.reduce((s, a) => s + a.computedBalance, 0);
  const totalAllocated = (envelopes as any[]).filter((e: any) => e.is_active).reduce((s: number, e: any) => s + Number(e.allocated_amount), 0);
  const dinheiroLivre = totalBalance - totalAllocated;

  // Account map
  const accountMap = useMemo(() => {
    const m = new Map<string, any>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return budgets.map((b: any) => {
      const spent = transactions
        .filter((t: any) => t.type === "expense" && t.category === b.category)
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const limit = Number(b.monthly_limit);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { category: b.category, limit, spent, pct, remaining: limit - spent };
    }).sort((a: any, b: any) => b.pct - a.pct);
  }, [budgets, transactions]);

  const overspentCategories = budgetAlerts.filter((b: any) => b.pct >= 100);
  const topBudgetAlerts = budgetAlerts.slice(0, 3);

  // Envelope alerts: below 20% of target
  const envelopeAlerts = useMemo(() => {
    return (envelopes as any[])
      .filter((e: any) => e.is_active && e.target_amount > 0)
      .map((e: any) => {
        const pct = (Number(e.allocated_amount) / Number(e.target_amount)) * 100;
        return { ...e, pct };
      })
      .filter((e: any) => e.pct < 20)
      .sort((a: any, b: any) => a.pct - b.pct);
  }, [envelopes]);

  // Envelope donut data
  const envelopeDonutData = useMemo(() => {
    return (envelopes as any[])
      .filter((e: any) => e.is_active && Number(e.allocated_amount) > 0)
      .map((e: any) => ({ name: e.name, value: Number(e.allocated_amount), color: e.color }));
  }, [envelopes]);

  const barData = useMemo(() => {
    const months: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM/yy", { locale: ptBR });
      const monthTx = sixMonthTx.filter((t: any) => t.date?.startsWith(key));
      months.push({
        label,
        income: monthTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0),
        expense: monthTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0),
      });
    }
    return months;
  }, [sixMonthTx]);

  // Donut chart (expenses by category this month)
  const donutData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const cat = t.category || "Sem categoria";
      map.set(cat, (map.get(cat) || 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ═══ CONSOLIDATED ACCOUNTS SECTION ═══ */}
      <div className="space-y-4">
        {/* Mini-cards per account + total + free money */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {activeBankAccounts.map((acc) => (
            <Card key={acc.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                  {acc.name}
                  <Badge variant="outline" className="text-[9px] ml-auto">{acc.type.toUpperCase()}</Badge>
                </p>
                <p className={`text-lg font-bold mt-1 ${(acc.computedBalance ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {(acc.computedBalance ?? 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Saldo Consolidado (bank only) */}
          <Link to="/financas/contas">
            <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer h-full">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Saldo Consolidado (Bancário)
                </p>
                <p className={`text-lg font-bold mt-1 ${totalBalance >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {totalBalance.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Dinheiro Livre */}
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet2 className="h-3 w-3" /> 💰 Dinheiro Livre Total
              </p>
              <p className={`text-lg font-bold mt-1 ${dinheiroLivre >= 0 ? "text-success" : "text-destructive"}`}>
                R$ {dinheiroLivre.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">Saldo bancário - Envelopes alocados</p>
            </CardContent>
          </Card>

          {/* Saldo Total (banco + plataformas) */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="h-3 w-3" /> 🏦 Saldo Total Geral
              </p>
              <p className={`text-lg font-bold mt-1 ${(totalBalance + totalPlatformBalance) >= 0 ? "text-success" : "text-destructive"}`}>
                R$ {(totalBalance + totalPlatformBalance).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">Bancário + Plataformas</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform accounts section */}
        {activePlatformAccounts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {activePlatformAccounts.map((acc) => (
              <Card key={acc.id} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                    {acc.name}
                    <Badge variant="outline" className="text-[9px] ml-auto">PLATAFORMA</Badge>
                  </p>
                  <p className={`text-lg font-bold mt-1 ${(acc.computedBalance ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                    R$ {(acc.computedBalance ?? 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground font-medium">💸 Total a Sacar</p>
                <p className="text-lg font-bold text-warning mt-1">
                  R$ {totalPlatformBalance.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">Dinheiro ainda nas plataformas</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Budget/Envelope alerts banner */}
      {(overspentCategories.length > 0 || envelopeAlerts.length > 0) && (
        <div className="space-y-2">
          {overspentCategories.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">Orçamento estourado!</p>
                <p className="text-xs text-muted-foreground">
                  {overspentCategories.map((b: any) => b.category).join(", ")}
                </p>
              </div>
            </div>
          )}
          {envelopeAlerts.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <Wallet2 className="h-5 w-5 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">
                  {envelopeAlerts.length} envelope{envelopeAlerts.length > 1 ? "s" : ""} abaixo de 20% da meta
                </p>
                <p className="text-xs text-muted-foreground">
                  {envelopeAlerts.map((e: any) => `${e.name} (${e.pct.toFixed(0)}%)`).join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Receitas do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">R$ {receitas.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">R$ {despesas.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saldo do mês</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className={`text-2xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>R$ {saldo.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">R$ {investments.reduce((s: number, inv: any) => s + Number(inv.current_value), 0).toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Receita PAD</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ {padRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{pedidosPagos.length} vendas pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Receitas vs Despesas (6m)</CardTitle></CardHeader>
          <CardContent>
            {barData.every((d) => d.income === 0 && d.expense === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            ) : (
              <ChartContainer config={barConfig} className="h-[250px] w-full">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Donut */}
        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem despesas</p>
            ) : (
              <ChartContainer config={pieConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={85}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Envelope Donut */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet2 className="h-4 w-4" /> Envelopes</CardTitle></CardHeader>
          <CardContent>
            {envelopeDonutData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem envelopes alocados</p>
            ) : (
              <ChartContainer config={envelopeChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={envelopeDonutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={85}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {envelopeDonutData.map((d, i) => <Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget alerts section */}
      {topBudgetAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" /> Orçamento do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topBudgetAlerts.map((b: any) => {
                const color = b.pct >= 100 ? "bg-destructive" : b.pct >= 70 ? "bg-yellow-500" : "bg-success";
                return (
                  <div key={b.category} className={`p-3 rounded-lg border ${b.pct >= 100 ? "border-destructive/50" : "border-border"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{b.category}</span>
                      {b.pct >= 100 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Estourado</Badge>}
                    </div>
                    <div className="relative h-2 rounded-full bg-muted mb-1">
                      <div className={`absolute inset-0 h-2 rounded-full ${color}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R$ {b.spent.toFixed(2)} / R$ {b.limit.toFixed(2)}</span>
                      <span>{b.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contas a Vencer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Contas a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta pendente.</p>
            ) : bills.map((bill: any) => {
              const daysUntil = differenceInCalendarDays(parseISO(bill.due_date), today);
              const urgent = daysUntil <= 3 && daysUntil >= 0;
              const overdue = isBefore(parseISO(bill.due_date), today);
              return (
                <div key={bill.id} className={`flex items-center justify-between p-3 rounded-lg border ${overdue ? "border-destructive/50 bg-destructive/5" : urgent ? "border-warning/50 bg-warning/5" : "border-border"}`}>
                  <div>
                    <p className="font-medium text-sm">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(bill.due_date), "dd/MM/yyyy")}
                      {bill.category && ` · ${bill.category}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(urgent || overdue) && (
                      <Badge variant={overdue ? "destructive" : "outline"} className={overdue ? "" : "border-warning text-warning"}>
                        {overdue ? "Vencida" : `${daysUntil}d`}
                      </Badge>
                    )}
                    <span className="font-semibold text-sm">R$ {Number(bill.amount).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Últimas Transações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Últimas Transações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma transação no mês.</p>
            ) : transactions.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(tx.date), "dd/MM/yyyy")}
                    {tx.category && ` · ${tx.category}`}
                  </p>
                </div>
                <span className={`font-semibold text-sm ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : "-"} R$ {Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimas Transferências */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Transferências Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma transferência.</p>
            ) : recentTransfers.map((t: any) => {
              const from = accountMap.get(t.from_account_id);
              const to = accountMap.get(t.to_account_id);
              return (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: from?.color || "#999" }} />
                      {from?.name || "?"} → <span className="w-2 h-2 rounded-full" style={{ backgroundColor: to?.color || "#999" }} />
                      {to?.name || "?"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(t.date), "dd/MM/yyyy")}
                      {t.category && ` · ${t.category}`}
                    </p>
                  </div>
                  <span className="font-semibold text-sm">R$ {Number(t.amount).toFixed(2)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
