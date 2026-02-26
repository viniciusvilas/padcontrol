import { useState, useMemo } from "react";
import { LayoutDashboard, DollarSign, Truck, TrendingUp, Package, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfMonth, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from "recharts";

const FRETE_FIVE = 35;

const periodOptions = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Tudo" },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
];

const statusBarConfig: ChartConfig = {
  count: { label: "Pedidos", color: "hsl(var(--primary))" },
};

const revenueConfig: ChartConfig = {
  bruto: { label: "Faturamento Bruto", color: "hsl(var(--primary))" },
  frete: { label: "Frete", color: "hsl(var(--destructive))" },
};

const profitConfig: ChartConfig = {
  acumulado: { label: "Lucro Acumulado", color: "hsl(142 76% 36%)" },
};

const productConfig: ChartConfig = {
  "3+1": { label: "3+1", color: PIE_COLORS[0] },
  "5+1": { label: "5+1", color: PIE_COLORS[1] },
  "12": { label: "12", color: PIE_COLORS[2] },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos-dashboard", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (period === "all") return pedidos;
    const now = new Date();
    let cutoff: Date;
    if (period === "month") {
      cutoff = startOfMonth(now);
    } else {
      cutoff = subDays(now, Number(period));
    }
    return pedidos.filter((p) => isAfter(parseISO(p.data), cutoff) || p.data === format(cutoff, "yyyy-MM-dd"));
  }, [pedidos, period]);

  // Metrics
  const totalBruto = filtered.reduce((s, p) => s + Number(p.valor), 0);
  const totalFrete = filtered.filter((p) => p.plataforma === "Five").length * FRETE_FIVE;
  const totalLiquido = totalBruto - totalFrete;
  const totalPedidos = filtered.length;
  const totalPagos = filtered.filter((p) => p.pedido_pago).length;
  const taxaConversao = totalPedidos > 0 ? ((totalPagos / totalPedidos) * 100).toFixed(1) : "0";

  // Monthly data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { bruto: number; frete: number }>();
    filtered.forEach((p) => {
      const key = format(parseISO(p.data), "MMM/yy", { locale: ptBR });
      const sortKey = format(parseISO(p.data), "yyyy-MM");
      const cur = map.get(sortKey) || { bruto: 0, frete: 0, label: key };
      cur.bruto += Number(p.valor);
      if (p.plataforma === "Five") cur.frete += FRETE_FIVE;
      (cur as any).label = key;
      map.set(sortKey, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ mes: (v as any).label, bruto: v.bruto, frete: v.frete }));
  }, [filtered]);

  // Accumulated profit
  const profitData = useMemo(() => {
    let acc = 0;
    return monthlyData.map((m) => {
      acc += m.bruto - m.frete;
      return { mes: m.mes, acumulado: acc };
    });
  }, [monthlyData]);

  // Product distribution
  const productData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => {
      map.set(p.produto, (map.get(p.produto) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Status distribution
  const statusData = useMemo(() => {
    const labels: Record<string, string> = {
      criado: "Criado",
      em_transporte: "Em transporte",
      prestes_a_chegar: "Prestes a chegar",
      entregue: "Entregue",
      em_cobranca: "Em cobrança",
      prioridade: "Prioridade",
      pago: "Pago",
      perdido: "Perdido",
    };
    const map = new Map<string, number>();
    filtered.forEach((p) => {
      map.set(p.status, (map.get(p.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({
      status: labels[status] || status,
      count,
    }));
  }, [filtered]);

  if (isLoading) {
    return <div className="text-muted-foreground p-6">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalBruto.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Frete (Five)</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {totalFrete.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ {totalLiquido.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPedidos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConversao}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período</p>
            ) : (
              <ChartContainer config={revenueConfig} className="h-[300px] w-full">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bruto" stackId="a" fill="var(--color-bruto)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="frete" stackId="a" fill="var(--color-frete)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Profit Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lucro Líquido Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            {profitData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período</p>
            ) : (
              <ChartContainer config={profitConfig} className="h-[300px] w-full">
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="acumulado" stroke="var(--color-acumulado)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            {productData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período</p>
            ) : (
              <ChartContainer config={productConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={productData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {productData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período</p>
            ) : (
              <ChartContainer config={statusBarConfig} className="h-[300px] w-full">
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="status" type="category" className="text-xs" width={110} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
