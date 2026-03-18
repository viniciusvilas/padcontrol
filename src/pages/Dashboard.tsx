import { useState, useMemo } from "react";
import { LayoutDashboard, DollarSign, Truck, TrendingUp, Package, Percent, Target, AlertTriangle, Megaphone, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePedidos } from "@/hooks/usePedidos";
import { useAnuncios } from "@/hooks/useAnuncios";
import { format, subDays, startOfMonth, parseISO, isAfter, differenceInCalendarDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import MetricCard from "@/components/shared/MetricCard";
import { FRETE_FIVE } from "@/lib/constants";

const periodOptions = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Tudo" },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 36%)"];
const STATE_PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(200 70% 50%)",
  "hsl(350 65% 55%)", "hsl(160 60% 45%)", "hsl(45 80% 55%)",
  "hsl(220 60% 55%)", "hsl(0 70% 55%)", "hsl(100 50% 45%)",
];

const ordersChartConfig: ChartConfig = { count: { label: "Pedidos", color: "hsl(var(--primary))" } };
const paymentsChartConfig: ChartConfig = { count: { label: "Pagamentos", color: "hsl(142 76% 36%)" } };
const statusPieConfig: ChartConfig = { agendados: { label: "Agendados", color: PIE_COLORS[0] }, entregues: { label: "Entregues", color: PIE_COLORS[1] }, pagos: { label: "Pagos", color: PIE_COLORS[2] } };
const statePieConfig: ChartConfig = { value: { label: "Pedidos" } };
const stateBarConfig: ChartConfig = { count: { label: "Pedidos", color: "hsl(var(--primary))" } };

export default function Dashboard() {
  const { pedidos, isLoading } = usePedidos();
  const { anuncios, totalInvestido: totalInvestidoAll } = useAnuncios();
  const [period, setPeriod] = useState("30");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [ordersGroupBy, setOrdersGroupBy] = useState("day");
  const [paymentsGroupBy, setPaymentsGroupBy] = useState("day");
  const [cpaDiaBudget, setCpaDiaBudget] = useState("");

  const allEstados = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => { if (p.estado) set.add(p.estado); });
    return Array.from(set).sort();
  }, [pedidos]);

  const filtered = useMemo(() => {
    let result = pedidos;
    if (period !== "all") {
      const now = new Date();
      const cutoff = period === "month" ? startOfMonth(now) : subDays(now, Number(period));
      result = result.filter((p) => isAfter(parseISO(p.data), cutoff) || p.data === format(cutoff, "yyyy-MM-dd"));
    }
    if (estadoFilter !== "all") result = result.filter((p) => p.estado === estadoFilter);
    return result;
  }, [pedidos, period, estadoFilter]);

  const filteredAnuncios = useMemo(() => {
    if (period === "all") return anuncios;
    const now = new Date();
    const cutoff = period === "month" ? startOfMonth(now) : subDays(now, Number(period));
    return anuncios.filter((a) => isAfter(parseISO(a.data), cutoff) || a.data === format(cutoff, "yyyy-MM-dd"));
  }, [anuncios, period]);

  // Metrics
  const pagos = filtered.filter((p) => p.pedido_pago);
  const valorAgendadoTotal = filtered.reduce((s, p) => s + Number(p.valor), 0);
  const qtdPedidos = filtered.length;
  const qtdPagos = pagos.length;
  const qtdEntregues = filtered.filter((p) => p.pedido_chegou).length;
  const aguardandoPgtoList = filtered.filter((p) => p.pedido_chegou && !p.pedido_pago && !p.pedido_perdido);
  const valorPendente = aguardandoPgtoList.reduce((s, p) => s + Number(p.valor), 0);
  const totalInvestido = filteredAnuncios.reduce((s, a) => s + Number(a.valor_investido), 0);
  const faturamentoPagos = pagos.reduce((s, p) => s + (Number(p.valor_pago) > 0 ? Number(p.valor_pago) : Number(p.valor)), 0);

  const fiveNaoPagos = filtered.filter((p) => p.plataforma === "Five" && !p.pedido_pago).length;
  const fivePagos = filtered.filter((p) => p.plataforma === "Five" && p.pedido_pago).length;
  const gastoFreteReal = fiveNaoPagos * FRETE_FIVE;
  const lucroPagos = faturamentoPagos - totalInvestido - gastoFreteReal;
  const cpaMedio = qtdPedidos > 0 ? totalInvestido / qtdPedidos : 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const pedidosHojeList = pedidos.filter((p) => p.data === today);
  const valorHoje = pedidosHojeList.reduce((s, p) => s + Number(p.valor), 0);
  const budgetDia = Number(cpaDiaBudget) || 0;
  const cpaDia = pedidosHojeList.length > 0 ? budgetDia / pedidosHojeList.length : 0;

  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const pedidosOntemList = pedidos.filter((p) => p.data === yesterday);
  const valorOntem = pedidosOntemList.reduce((s, p) => s + Number(p.valor), 0);

  const cutoffSemana = subDays(new Date(), 6);
  const pedidosSemanaList = pedidos.filter((p) => isAfter(parseISO(p.data), cutoffSemana) || p.data === format(cutoffSemana, "yyyy-MM-dd"));
  const valorSemana = pedidosSemanaList.reduce((s, p) => s + Number(p.valor), 0);

  const cutoff7d = subDays(new Date(), 7);
  const pedidos7d = pedidos.filter((p) => isAfter(parseISO(p.data), cutoff7d) || p.data === format(cutoff7d, "yyyy-MM-dd"));
  const anuncios7d = anuncios.filter((a) => isAfter(parseISO(a.data), cutoff7d) || a.data === format(cutoff7d, "yyyy-MM-dd"));
  const investido7d = anuncios7d.reduce((s, a) => s + Number(a.valor_investido), 0);
  const cpa7d = pedidos7d.length > 0 ? investido7d / pedidos7d.length : 0;

  const pedidosPagos7d = pedidos.filter((p) => p.pedido_pago && isAfter(parseISO(p.updated_at), cutoff7d));
  const valorPago7d = pedidosPagos7d.reduce((s, p) => s + (Number(p.valor_pago) || Number(p.valor)), 0);

  const now = new Date();
  const inadimplentes = filtered.filter((p) =>
    p.pedido_chegou && !p.pedido_pago && (p.pedido_perdido || (p.data_entrega && differenceInCalendarDays(now, parseISO(p.data_entrega)) > 7))
  );
  const taxaInadimplencia = qtdEntregues > 0 ? ((inadimplentes.length / qtdEntregues) * 100).toFixed(1) : "0";
  const roiPago = totalInvestido > 0 ? ((lucroPagos / totalInvestido) * 100).toFixed(1) : "0";
  const roiAgendado = totalInvestido > 0 ? ((valorAgendadoTotal / totalInvestido) * 100).toFixed(1) : "0";

  // Chart helpers
  const groupByTime = (items: typeof pedidos, groupBy: string) => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const d = parseISO(item.data);
      let key: string;
      if (groupBy === "day") key = format(d, "dd/MM");
      else if (groupBy === "week") key = `S${format(startOfWeek(d, { locale: ptBR }), "dd/MM")}`;
      else key = format(d, "MMM/yy", { locale: ptBR });
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  };

  const buildLast14Days = (items: typeof pedidos) => {
    const t = new Date();
    const days: { label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(t, i);
      const key = format(d, "yyyy-MM-dd");
      days.push({ label: format(d, "dd/MM"), count: items.filter((p) => p.data === key).length });
    }
    return days;
  };

  const ordersData = useMemo(() => ordersGroupBy === "day" ? buildLast14Days(filtered) : groupByTime(filtered, ordersGroupBy), [filtered, ordersGroupBy]);
  const paymentsData = useMemo(() => groupByTime(pagos, paymentsGroupBy), [pagos, paymentsGroupBy]);

  const statusPieData = useMemo(() => {
    const entregues = filtered.filter((p) => p.pedido_chegou && !p.pedido_pago).length;
    const agendados = filtered.filter((p) => !p.pedido_chegou && !p.pedido_pago).length;
    return [
      { name: "Agendados", value: agendados },
      { name: "Entregues", value: entregues },
      { name: "Pagos", value: qtdPagos },
    ].filter((d) => d.value > 0);
  }, [filtered, qtdPagos]);

  const statePieData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => map.set(p.estado || "N/D", (map.get(p.estado || "N/D") || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const stateData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => map.set(p.estado || "N/D", (map.get(p.estado || "N/D") || 0) + 1));
    return Array.from(map.entries()).map(([estado, count]) => ({ estado, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-40"><MapPin className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {allEstados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periodOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Temporal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={DollarSign} title="Valor Hoje" value={`R$ ${valorHoje.toFixed(2)}`} subtitle={`${pedidosHojeList.length} pedidos`} className="text-primary" />
        <MetricCard icon={DollarSign} title="Valor Ontem" value={`R$ ${valorOntem.toFixed(2)}`} subtitle={`${pedidosOntemList.length} pedidos`} />
        <MetricCard icon={DollarSign} title="Valor da Semana" value={`R$ ${valorSemana.toFixed(2)}`} subtitle={`${pedidosSemanaList.length} pedidos`} className="text-primary" />
      </div>

      {/* Performance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} title="Faturamento Pagos" value={`R$ ${faturamentoPagos.toFixed(2)}`} className="text-primary" />
        <MetricCard icon={DollarSign} title="Lucro (Pagos)" value={`R$ ${lucroPagos.toFixed(2)}`} className="text-primary" />
        <MetricCard icon={Package} title="Valor Agendado" value={`R$ ${valorAgendadoTotal.toFixed(2)}`} />
        <MetricCard icon={Megaphone} title="Investimento Anúncios" value={`R$ ${totalInvestido.toFixed(2)}`} subtitle={`c/ imposto: R$ ${(totalInvestido * 1.125).toFixed(2)}`} className="text-destructive" />
        <MetricCard icon={Truck} title="Frete Pendente" value={`R$ ${gastoFreteReal.toFixed(2)}`} subtitle={`${fiveNaoPagos} não pagos`} className="text-destructive" />
        <MetricCard icon={DollarSign} title="Valor Pendente" value={`R$ ${valorPendente.toFixed(2)}`} subtitle={`${aguardandoPgtoList.length} aguardando`} className="text-destructive" />
        <MetricCard icon={Package} title="Pedidos" value={String(qtdPedidos)} subtitle={`${qtdPagos} pagos · ${qtdEntregues} entregues`} />
        <MetricCard icon={Target} title="CPA Médio" value={`R$ ${cpaMedio.toFixed(2)}`} subtitle={`c/ imposto: R$ ${(cpaMedio * 1.125).toFixed(2)}`} />
      </div>

      {/* 7 dias + CPA dia */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} title="Valor Pago 7 dias" value={`R$ ${valorPago7d.toFixed(2)}`} subtitle={`${pedidosPagos7d.length} pagos`} className="text-primary" />
        <MetricCard icon={Megaphone} title="Anúncios 7 dias" value={`R$ ${investido7d.toFixed(2)}`} className="text-destructive" />
        <MetricCard icon={Target} title="CPA 7 dias" value={`R$ ${cpa7d.toFixed(2)}`} subtitle={`${pedidos7d.length} pedidos`} />
        <Card>
          <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium">CPA do Dia</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Orçamento:</Label>
              <Input type="number" className="h-8 text-sm" placeholder="0.00" value={cpaDiaBudget} onChange={(e) => setCpaDiaBudget(e.target.value)} />
            </div>
            <p className="text-lg font-bold">R$ {cpaDia.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{pedidosHojeList.length} pedidos hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* ROIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard icon={AlertTriangle} title="Inadimplência" value={`${taxaInadimplencia}%`} subtitle={`${inadimplentes.length} inadimplentes`} />
        <MetricCard icon={Percent} title="ROI vs Pago" value={`${roiPago}%`} />
        <MetricCard icon={Percent} title="ROI vs Agendado" value={`${roiAgendado}%`} />
      </div>

      {/* Charts */}
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

      {/* Pie Charts */}
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
          <CardHeader><CardTitle className="text-base">% por Estado</CardTitle></CardHeader>
          <CardContent>
            {statePieData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p> : (
              <ChartContainer config={statePieConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={statePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {statePieData.map((_, i) => <Cell key={i} fill={STATE_PIE_COLORS[i % STATE_PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* State Bar */}
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
  );
}
