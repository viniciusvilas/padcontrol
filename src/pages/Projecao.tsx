import { useState, useMemo } from "react";
import { TrendingUp, Calculator, DollarSign, Package, Percent, Megaphone, CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, parseISO, startOfDay, differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Mulberry32 seeded PRNG
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FRETE_FIVE = 35;

const roiChartConfig: ChartConfig = {
  faturamento: { label: "Faturamento", color: "hsl(var(--primary))" },
  lucro: { label: "Lucro", color: "hsl(var(--chart-2))" },
  investimento: { label: "Investimento", color: "hsl(var(--destructive))" },
};

const fluxoChartConfig: ChartConfig = {
  valorPagamentos: { label: "Pagamentos (R$)", color: "hsl(var(--primary))" },
};

const acumuladoChartConfig: ChartConfig = {
  gastoAcumulado: { label: "Gasto Acumulado", color: "hsl(var(--destructive))" },
  receitaAcumulada: { label: "Receita Acumulada", color: "hsl(var(--chart-2))" },
};

export default function Projecao() {
  const { user } = useAuth();

  // --- State ---
  const [dias, setDias] = useState(30);
  const [cpaCustom, setCpaCustom] = useState("");
  const [investDiario, setInvestDiario] = useState("");
  const [simPeriodoTipo, setSimPeriodoTipo] = useState<"dias" | "semanas" | "meses">("dias");
  const [simPeriodoQtd, setSimPeriodoQtd] = useState("30");
  const [inadimplenciaSim, setInadimplenciaSim] = useState(20);
  const [cenarioSeed, setCenarioSeed] = useState(0);

  // --- Queries ---
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos-projecao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: anuncios = [] } = useQuery({
    queryKey: ["anuncios-projecao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("anuncios").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // --- Métricas históricas (para simulador) ---
  const historico = useMemo(() => {
    if (pedidos.length === 0) return null;

    const datas = pedidos.map((p) => parseISO(p.data));
    const min = new Date(Math.min(...datas.map((d) => d.getTime())));
    const max = new Date(Math.max(...datas.map((d) => d.getTime())));
    const diasHistorico = Math.max(differenceInCalendarDays(max, min) + 1, 1);

    const mediaPedidosDia = pedidos.length / diasHistorico;

    const pagos = pedidos.filter((p) => p.pedido_pago);
    const ticketMedioPagos = pagos.length > 0
      ? pagos.reduce((s, p) => s + Number(p.valor), 0) / pagos.length
      : 0;

    const freteMedioPagos = pagos.length > 0
      ? pagos.reduce((s, p) => s + (p.plataforma === "Five" ? FRETE_FIVE : 0), 0) / pagos.length
      : 0;

    const totalInvestido = anuncios.reduce((s, a) => s + Number(a.valor_investido), 0);
    const cpaAtual = pedidos.length > 0 ? totalInvestido / pedidos.length : 0;

    return {
      mediaPedidosDia,
      ticketMedioPagos,
      freteMedioPagos,
      cpaAtual,
      totalInvestido,
      diasHistorico,
    };
  }, [pedidos, anuncios]);

  // --- Seção 1: Pedidos reais com previsão de entrega no período ---
  const hoje = startOfDay(new Date());

  const pedidosFiltrados = useMemo(() => {
    const limite = addDays(hoje, dias);
    return pedidos.filter((p) => {
      if (!p.previsao_entrega) return false;
      if (p.pedido_pago || p.pedido_perdido) return false;
      const prev = parseISO(p.previsao_entrega);
      return prev >= hoje && prev <= limite;
    });
  }, [pedidos, dias, hoje]);

  const cenarios = useMemo(() => {
    if (pedidosFiltrados.length === 0) return [];
    const totalValor = pedidosFiltrados.reduce((s, p) => s + Number(p.valor), 0);
    const totalFrete = pedidosFiltrados.reduce((s, p) => s + (p.plataforma === "Five" ? FRETE_FIVE : 0), 0);
    const faixas = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

    return faixas.map((inadPct) => {
      const pagam = Math.round(pedidosFiltrados.length * (1 - inadPct / 100));
      const proporcao = pedidosFiltrados.length > 0 ? pagam / pedidosFiltrados.length : 0;
      const fat = totalValor * proporcao;
      const lucro = (totalValor - totalFrete) * proporcao;
      return { inadPct, total: pedidosFiltrados.length, pagam, fat, lucro };
    });
  }, [pedidosFiltrados]);

  // --- Seção 2: Simulador CPA ---
  const simDias = useMemo(() => {
    const qtd = Number(simPeriodoQtd) || 0;
    if (simPeriodoTipo === "semanas") return qtd * 7;
    if (simPeriodoTipo === "meses") return qtd * 30;
    return qtd;
  }, [simPeriodoTipo, simPeriodoQtd]);

  const simulacao = useMemo(() => {
    if (!historico || simDias <= 0) return null;
    const cpa = Number(cpaCustom) || historico.cpaAtual;
    const invDia = Number(investDiario) || 0;
    if (cpa <= 0 || invDia <= 0) return null;

    const investTotal = invDia * simDias;
    const pedidosEsperados = Math.round(investTotal / cpa);
    const pedidosPagos = Math.round(pedidosEsperados * (1 - inadimplenciaSim / 100));
    const fatEsperado = pedidosPagos * historico.ticketMedioPagos;
    const lucroEsperado = pedidosPagos * (historico.ticketMedioPagos - historico.freteMedioPagos) - investTotal;
    const roi = investTotal > 0 ? (lucroEsperado / investTotal) * 100 : 0;

    return { investTotal, pedidosEsperados, pedidosPagos, fatEsperado, lucroEsperado, roi, cpa };
  }, [historico, cpaCustom, investDiario, simDias, inadimplenciaSim]);

  const simChartData = useMemo(() => {
    if (!simulacao) return [];
    return [
      { nome: "Investimento", valor: simulacao.investTotal },
      { nome: "Faturamento", valor: simulacao.fatEsperado },
      { nome: "Lucro", valor: Math.max(simulacao.lucroEsperado, 0) },
    ];
  }, [simulacao]);

  // --- Fluxo de caixa diário em R$ (12 dias para receber) + acumulado ---
  const fluxoCaixaData = useMemo(() => {
    if (!simulacao || !historico || simDias <= 0) return [];
    const invDia = Number(investDiario) || 0;
    const ticketMedio = historico.ticketMedioPagos;
    const totalDias = simDias + 12;
    const totalPedidosPagos = simulacao.pedidosPagos;

    // Distribute pedidosPagos randomly across simDias using seeded PRNG
    const seedValue = simDias * 1000 + totalPedidosPagos * 7 + invDia * 13 + inadimplenciaSim * 31 + cenarioSeed * 97;
    const rand = mulberry32(seedValue);

    // Generate random weights and distribute integer pedidos
    const weights = Array.from({ length: simDias }, () => rand() + 0.1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const rawDistrib = weights.map((w) => (w / weightSum) * totalPedidosPagos);

    // Floor and distribute remainder
    const pedidosPorDiaArr = rawDistrib.map((v) => Math.floor(v));
    let remainder = totalPedidosPagos - pedidosPorDiaArr.reduce((a, b) => a + b, 0);
    // Distribute remainder to days with highest fractional parts
    const fractions = rawDistrib.map((v, i) => ({ i, frac: v - Math.floor(v) }));
    fractions.sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < remainder && k < fractions.length; k++) {
      pedidosPorDiaArr[fractions[k].i]++;
    }

    // Build payment map: day index -> valor R$
    const pagamentosMap: Record<number, number> = {};
    for (let d = 0; d < simDias; d++) {
      const diaPagamento = d + 12;
      pagamentosMap[diaPagamento] = (pagamentosMap[diaPagamento] || 0) + pedidosPorDiaArr[d] * ticketMedio;
    }

    let gastoAcum = 0;
    let receitaAcum = 0;
    const result: { dia: string; valorPagamentos: number; gastoAcumulado: number; receitaAcumulada: number }[] = [];

    for (let d = 0; d < totalDias; d++) {
      if (d < simDias) {
        gastoAcum += invDia;
      }
      const valorDia = pagamentosMap[d] || 0;
      receitaAcum += valorDia;

      result.push({
        dia: format(addDays(hoje, d), "dd/MM"),
        valorPagamentos: Math.round(valorDia * 100) / 100,
        gastoAcumulado: Math.round(gastoAcum * 100) / 100,
        receitaAcumulada: Math.round(receitaAcum * 100) / 100,
      });
    }
    return result;
  }, [simulacao, historico, simDias, hoje, investDiario, inadimplenciaSim, cenarioSeed]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Projeção</h1>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum pedido encontrado. Adicione pedidos para ver projeções.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="inadimplencia" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inadimplencia">
              <Percent className="h-4 w-4 mr-2" /> Chegada & Inadimplência
            </TabsTrigger>
            <TabsTrigger value="cpa">
              <Megaphone className="h-4 w-4 mr-2" /> Simulador de Investimento
            </TabsTrigger>
          </TabsList>

          {/* === SEÇÃO 1 — Pedidos reais === */}
          <TabsContent value="inadimplencia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Período de projeção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[dias]}
                    onValueChange={([v]) => setDias(v)}
                    min={1}
                    max={90}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Input
                      type="number"
                      value={dias}
                      onChange={(e) => setDias(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Pedidos no período: <strong className="text-foreground">{pedidosFiltrados.length}</strong></span>
                  <span>Valor total: <strong className="text-foreground">{fmt(pedidosFiltrados.reduce((s, p) => s + Number(p.valor), 0))}</strong></span>
                  <span>Pagamento estimado: <strong className="text-foreground">entrega + 3 dias</strong></span>
                </div>
              </CardContent>
            </Card>

            {cenarios.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Cenários — {pedidosFiltrados.length} pedidos com entrega nos próximos {dias} dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inadimplência</TableHead>
                        <TableHead className="text-right">Pagam</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cenarios.map((c) => (
                        <TableRow key={c.inadPct}>
                          <TableCell>{c.inadPct}%</TableCell>
                          <TableCell className="text-right">{c.pagam}</TableCell>
                          <TableCell className="text-right">{fmt(c.fat)}</TableCell>
                          <TableCell className="text-right">{fmt(c.lucro)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Nenhum pedido com previsão de entrega nos próximos {dias} dias (excluindo pagos e perdidos).
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === SEÇÃO 2 — Simulador === */}
          <TabsContent value="cpa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuração do Simulador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">CPA (R$)</Label>
                    <Input
                      type="number"
                      placeholder={historico ? historico.cpaAtual.toFixed(2) : "0.00"}
                      value={cpaCustom}
                      onChange={(e) => setCpaCustom(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Atual: {historico ? fmt(historico.cpaAtual) : "—"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Investimento diário (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={investDiario}
                      onChange={(e) => setInvestDiario(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      value={simPeriodoQtd}
                      onChange={(e) => setSimPeriodoQtd(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Unidade</Label>
                    <div className="flex gap-1">
                      {(["dias", "semanas", "meses"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSimPeriodoTipo(t)}
                          className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                            simPeriodoTipo === t
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slider de inadimplência */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Inadimplência esperada</Label>
                    <span className="text-sm font-semibold">{inadimplenciaSim}%</span>
                  </div>
                  <Slider
                    value={[inadimplenciaSim]}
                    onValueChange={([v]) => setInadimplenciaSim(v)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {simulacao ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <SimCard icon={Package} title="Pedidos Esperados" value={String(simulacao.pedidosEsperados)} />
                  <SimCard icon={Package} title="Pedidos Pagos" value={String(simulacao.pedidosPagos)} />
                  <SimCard icon={DollarSign} title="Faturamento" value={fmt(simulacao.fatEsperado)} />
                  <SimCard icon={Calculator} title="Lucro Esperado" value={fmt(simulacao.lucroEsperado)} color={simulacao.lucroEsperado >= 0 ? "text-chart-2" : "text-destructive"} />
                  <SimCard icon={TrendingUp} title="ROI" value={`${simulacao.roi.toFixed(0)}%`} color={simulacao.roi >= 0 ? "text-chart-2" : "text-destructive"} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Comparativo — {simDias} dias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={roiChartConfig} className="h-[250px] w-full">
                      <BarChart data={simChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="nome" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {fluxoCaixaData.length > 0 && (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCenarioSeed((s) => s + 1)}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Novo Cenário
                      </Button>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Pagamentos em R$ por dia (ciclo de 12 dias)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={fluxoChartConfig} className="h-[300px] w-full">
                          <BarChart data={fluxoCaixaData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="dia" className="text-xs" angle={-45} textAnchor="end" height={50} />
                            <YAxis className="text-xs" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="valorPagamentos" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Acumulado — Gasto vs Receita
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={acumuladoChartConfig} className="h-[300px] w-full">
                          <BarChart data={fluxoCaixaData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="dia" className="text-xs" angle={-45} textAnchor="end" height={50} />
                            <YAxis className="text-xs" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="gastoAcumulado" radius={[4, 4, 0, 0]} fill="hsl(var(--destructive))" />
                            <Bar dataKey="receitaAcumulada" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-2))" />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Preencha o CPA e o investimento diário para ver a simulação.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SimCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: string; color?: string }) {
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
