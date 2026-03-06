import { useState, useMemo, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Scale, Landmark, AlertTriangle, ArrowLeftRight, Package, PieChart as PieChartIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInCalendarDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const barConfig: ChartConfig = {
  income: { label: "Receitas", color: "hsl(var(--success))" },
  expense: { label: "Despesas", color: "hsl(var(--destructive))" },
};
const pieConfig: ChartConfig = { value: { label: "Valor" } };
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

  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd = endOfMonth(monthStart);

  // Transactions for selected month
  const { data: transactions = [] } = useQuery({
    queryKey: ["fin-transactions", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
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
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", sixMonthsAgo)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Bills (pending, upcoming)
  const { data: bills = [] } = useQuery({
    queryKey: ["fin-bills-upcoming", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_bills")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(5);
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
        .from("finance_investments")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Budgets for the month
  const { data: budgets = [] } = useQuery({
    queryKey: ["fin-budgets", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_budgets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("month", format(monthStart, "yyyy-MM-dd"))
        .order("category");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });


  const { data: pedidosPagos = [] } = useQuery({
    queryKey: ["pad-revenue", user?.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor")
        .eq("user_id", user!.id)
        .eq("pedido_pago", true)
        .gte("data", format(monthStart, "yyyy-MM-dd"))
        .lte("data", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-create PAD income source based on last 3 months average
  const { data: last3mPedidos = [] } = useQuery({
    queryKey: ["pad-avg-3m", user?.id],
    queryFn: async () => {
      const threeMonthsAgo = format(startOfMonth(subMonths(new Date(), 3)), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor")
        .eq("user_id", user!.id)
        .eq("pedido_pago", true)
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
        .from("finance_income_sources")
        .select("id")
        .eq("user_id", user!.id)
        .eq("name", "Pay After Delivery")
        .maybeSingle();
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
        user_id: user.id,
        name: "Pay After Delivery",
        expected_monthly_amount: Math.round(avg * 100) / 100,
        is_active: true,
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
  const patrimonio = investments.reduce((s: number, inv: any) => s + Number(inv.current_value), 0);

  // Bar chart data (last 6 months)
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
    transactions
      .filter((t: any) => t.type === "expense")
      .forEach((t: any) => {
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
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Receitas do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ {receitas.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {despesas.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saldo do mês</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
              R$ {saldo.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Patrimônio total</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ {patrimonio.toFixed(2)}</div>
          </CardContent>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Receitas vs Despesas (6 meses)</CardTitle></CardHeader>
          <CardContent>
            {barData.every((d) => d.income === 0 && d.expense === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            ) : (
              <ChartContainer config={barConfig} className="h-[280px] w-full">
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
        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem despesas no mês</p>
            ) : (
              <ChartContainer config={pieConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            ) : (
              bills.map((bill: any) => {
                const daysUntil = differenceInCalendarDays(parseISO(bill.due_date), today);
                const urgent = daysUntil <= 3 && daysUntil >= 0;
                const overdue = isBefore(parseISO(bill.due_date), today);
                return (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      overdue ? "border-destructive/50 bg-destructive/5" : urgent ? "border-warning/50 bg-warning/5" : "border-border"
                    }`}
                  >
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
              })
            )}
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
            ) : (
              transactions.slice(0, 5).map((tx: any) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
