import { useState, useMemo } from "react";
import { LayoutDashboard, DollarSign, Truck, TrendingUp, Package, Percent, Target, AlertTriangle, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfMonth, parseISO, isAfter, differenceInCalendarDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const FRETE_FIVE = 35;

const periodOptions = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Tudo" },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 36%)"];

const ordersChartConfig: ChartConfig = { count: { label: "Pedidos", color: "hsl(var(--primary))" } };
const paymentsChartConfig: ChartConfig = { count: { label: "Pagamentos", color: "hsl(142 76% 36%)" } };
const statusPieConfig: ChartConfig = { agendados: { label: "Agendados", color: PIE_COLORS[0] }, entregues: { label: "Entregues", color: PIE_COLORS[1] }, pagos: { label: "Pagos", color: PIE_COLORS[2] } };
const stateBarConfig: ChartConfig = { count: { label: "Pedidos", color: "hsl(var(--primary))" } };

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [ordersGroupBy, setOrdersGroupBy] = useState("day");
  const [paymentsGroupBy, setPaymentsGroupBy] = useState("day");
  const [cpaDiaBudget, setCpaDiaBudget] = useState("");

  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ["pedidos-dashboard", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: anuncios = [] } = useQuery({
    queryKey: ["anuncios-dashboard", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("anuncios").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (period === "all") return pedidos;
    const now = new Date();
    const cutoff = period === "month" ? startOfMonth(now) : subDays(now, Number(period));
    return pedidos.filter((p) => isAfter(parseISO(p.data), cutoff) || p.data === format(cutoff, "yyyy-MM-dd"));
  }, [pedidos, period]);

  const filteredAnuncios = useMemo(() => {
    if (period === "all") return anuncios;
    const now = new Date();
    const cutoff = period === "month" ? startOfMonth(now) : subDays(now, Number(period));
    return anuncios.filter((a) => isAfter(parseISO(a.data), cutoff) || a.data === format(cutoff, "yyyy-MM-dd"));
  }, [anuncios, period]);

  // Metrics
  const pagos = filtered.filter((p) => p.pedido_pago);
  const lucroPagos = pagos.reduce((s, p) => s + Number(p.valor) - (p.plataforma === "Five" ? FRETE_FIVE : 0), 0);
  const valorAgendadoTotal = filtered.reduce((s, p) => s + Number(p.valor), 0);
  const valorAgendadoSemPagos = filtered.filter((p) => !p.pedido_pago).reduce((s, p) => s + Number(p.valor), 0);
  const qtdPedidos = filtered.length;
  const qtdPagos = pagos.length;
  const qtdAguardando = filtered.filter((p) => !p.pedido_pago && !p.pedido_perdido).length;
  const totalInvestido = filteredAnuncios.reduce((s, a) => s + Number(a.valor_investido), 0);
  const cpaMedio = qtdPedidos > 0 ? totalInvestido / qtdPedidos : 0;

  // CPA do dia
  const today = format(new Date(), "yyyy-MM-dd");
  const pedidosHoje = pedidos.filter((p) => p.data === today).length;
  const budgetDia = Number(cpaDiaBudget) || 0;
  const cpaDia = pedidosHoje > 0 ? budgetDia / pedidosHoje : 0;

  // Inadimplência
  const now = new Date();
  const elegiveisCobranca = filtered.filter((p) => !p.pedido_pago && !p.pedido_perdido && differenceInCalendarDays(now, parseISO(p.data)) > 7);
  const taxaInadimplencia = qtdPedidos > 0 ? ((elegiveisCobranca.length / qtdPedidos) * 100).toFixed(1) : "0";

  // ROI
  const roiPago = totalInvestido > 0 ? ((lucroPagos / totalInvestido) * 100).toFixed(1) : "0";
  const roiAgendado = totalInvestido > 0 ? ((valorAgendadoTotal / totalInvestido) * 100).toFixed(1) : "0";

  // Group helper
  const groupByTime = (items: typeof pedidos, groupBy: string, dateField: string = "data") => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const d = parseISO((item as any)[dateField]);
      let key: string;
      if (groupBy === "day") key = format(d, "dd/MM");
      else if (groupBy === "week") key = `S${format(startOfWeek(d, { locale: ptBR }), "dd/MM")}`;
      else key = format(d, "MMM/yy", { locale: ptBR });
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  };

  const ordersData = useMemo(() => groupByTime(filtered, ordersGroupBy), [filtered, ordersGroupBy]);
  const paymentsData = useMemo(() => groupByTime(pagos, paymentsGroupBy), [pagos, paymentsGroupBy]);

  // Status pie
  const statusPieData = useMemo(() => {
    const entregues = filtered.filter((p) => p.pedido_chegou && !p.pedido_pago).length;
    const agendados = filtered.filter((p) => !p.pedido_chegou && !p.pedido_pago).length;
    return [
      { name: "Agendados", value: agendados },
      { name: "Entregues", value: entregues },
      { name: "Pagos", value: qtdPagos },
    ].filter((d) => d.value > 0);
  }, [filtered, qtdPagos]);

  // State bar
  const stateData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => {
      const uf = p.estado || "N/D";
      map.set(uf, (map.get(uf) || 0) + 1);
    });
    return Array.from(map.entries()).map(([estado, count]) => ({ estado, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  if (loadingPedidos) return <div className="text-muted-foreground p-6">Carregando dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periodOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard title="Lucro (Pagos)" icon={DollarSign} value={`R$ ${lucroPagos.toFixed(2)}`} className="text-primary" />
        <MetricCard title="Valor Agendado (Total)" icon={Package} value={`R$ ${valorAgendadoTotal.toFixed(2)}`} />
        <MetricCard title="Agendado (s/ Pagos)" icon={Package} value={`R$ ${valorAgendadoSemPagos.toFixed(2)}`} />
        <MetricCard title="Investimento Anúncios" icon={Megaphone} value={`R$ ${totalInvestido.toFixed(2)}`} className="text-destructive" />
      </div>

      {/* Metric Cards Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard title="Pedidos Feitos" icon={Package} value={String(qtdPedidos)} />
        <MetricCard title="Pedidos Pagos" icon={TrendingUp} value={String(qtdPagos)} className="text-primary" />
        <MetricCard title="Aguardando Pgto" icon={Truck} value={String(qtdAguardando)} />
        <MetricCard title="CPA Médio" icon={Target} value={`R$ ${cpaMedio.toFixed(2)}`} />
      </div>

      {/* CPA do Dia + Inadimplência + ROIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">CPA do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Orçamento:</Label>
              <Input type="number" className="h-8 text-sm" placeholder="0.00" value={cpaDiaBudget} onChange={(e) => setCpaDiaBudget(e.target.value)} />
            </div>
            <p className="text-lg font-bold">R$ {cpaDia.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{pedidosHoje} pedidos hoje</p>
          </CardContent>
        </Card>
        <MetricCard title="Inadimplência" icon={AlertTriangle} value={`${taxaInadimplencia}%`} subtitle={`${elegiveisCobranca.length} pedidos +7d`} />
        <MetricCard title="ROI vs Pago" icon={Percent} value={`${roiPago}%`} />
        <MetricCard title="ROI vs Agendado" icon={Percent} value={`${roiAgendado}%`} />
      </div>

      {/* Charts Row 1: Orders + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pedidos Feitos</CardTitle>
            <Tabs value={ordersGroupBy} onValueChange={setOrdersGroupBy}>
              <TabsList className="h-8"><TabsTrigger value="day" className="text-xs px-2">Dia</TabsTrigger><TabsTrigger value="week" className="text-xs px-2">Semana</TabsTrigger><TabsTrigger value="month" className="text-xs px-2">Mês</TabsTrigger></TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {ordersData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p> : (
              <ChartContainer config={ordersChartConfig} className="h-[250px] w-full">
                <BarChart data={ordersData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="label" className="text-xs" /><YAxis className="text-xs" /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} /></BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pagamentos</CardTitle>
            <Tabs value={paymentsGroupBy} onValueChange={setPaymentsGroupBy}>
              <TabsList className="h-8"><TabsTrigger value="day" className="text-xs px-2">Dia</TabsTrigger><TabsTrigger value="week" className="text-xs px-2">Semana</TabsTrigger><TabsTrigger value="month" className="text-xs px-2">Mês</TabsTrigger></TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {paymentsData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p> : (
              <ChartContainer config={paymentsChartConfig} className="h-[250px] w-full">
                <BarChart data={paymentsData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="label" className="text-xs" /><YAxis className="text-xs" /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} /></BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Pie + State Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Status dos Pedidos</CardTitle></CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p> : (
              <ChartContainer config={statusPieConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pedidos por Estado</CardTitle></CardHeader>
          <CardContent>
            {stateData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p> : (
              <ChartContainer config={stateBarConfig} className="h-[300px] w-full">
                <BarChart data={stateData} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis type="number" className="text-xs" /><YAxis dataKey="estado" type="category" className="text-xs" width={50} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} /></BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, icon: Icon, value, className, subtitle }: { title: string; icon: any; value: string; className?: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${className || ""}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
