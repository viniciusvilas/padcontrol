import { useState, useMemo } from "react";
import { LineChart as LineChartIcon, DollarSign, Package, TrendingUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { format, parseISO, startOfMonth, endOfMonth, differenceInCalendarDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const FRETE_FIVE = 35.5;

const chartConfig: ChartConfig = {
  receita: { label: "Receita (Pagos)", color: "hsl(var(--success))" },
  projecao: { label: "Projeção (Pendentes)", color: "hsl(var(--primary))" },
};

const fmt = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancasProjecoes() {
  const { user } = useAuth();
  const hoje = startOfDay(new Date());
  const { accounts, activeAccounts } = useFinanceAccounts();
  const [accountFilter, setAccountFilter] = useState("all");

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["fin-projecoes-pedidos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch transactions to filter by account
  const { data: transactions = [] } = useQuery({
    queryKey: ["fin-transactions-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions").select("*").eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filtered transactions by account
  const filteredTx = useMemo(() => {
    if (accountFilter === "all") return transactions;
    return transactions.filter((t: any) => t.account_id === accountFilter);
  }, [transactions, accountFilter]);

  // Pedidos pagos = receita confirmada
  const pagos = useMemo(() => pedidos.filter((p) => p.pedido_pago), [pedidos]);
  const receitaTotal = useMemo(() => {
    if (accountFilter === "all") return pagos.reduce((s, p) => s + Number(p.valor), 0);
    // If filtering by account, use transactions instead
    return filteredTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  }, [pagos, accountFilter, filteredTx]);

  const receitaMesAtual = useMemo(() => {
    const ini = startOfMonth(hoje);
    const fim = endOfMonth(hoje);
    if (accountFilter === "all") {
      return pagos
        .filter((p) => { const d = parseISO(p.data); return d >= ini && d <= fim; })
        .reduce((s, p) => s + Number(p.valor), 0);
    }
    return filteredTx
      .filter((t: any) => t.type === "income" && parseISO(t.date) >= ini && parseISO(t.date) <= fim)
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
  }, [pagos, hoje, accountFilter, filteredTx]);

  // Pedidos pendentes
  const pendentes = useMemo(
    () => pedidos.filter((p) => !p.pedido_chegou && !p.pedido_pago && !p.pedido_perdido),
    [pedidos]
  );
  const valorPendente = useMemo(() => pendentes.reduce((s, p) => s + Number(p.valor), 0), [pendentes]);

  // Cenários
  const cenarios = useMemo(() => {
    if (pendentes.length === 0) return [];
    const totalFrete = pendentes.reduce((s, p) => s + (p.plataforma === "Five" ? FRETE_FIVE : 0), 0);
    return [0, 10, 20, 30, 40, 50].map((inadPct) => {
      const pagam = Math.round(pendentes.length * (1 - inadPct / 100));
      const prop = pendentes.length > 0 ? pagam / pendentes.length : 0;
      const fat = valorPendente * prop;
      const lucro = (valorPendente - totalFrete) * prop;
      return { inadPct, total: pendentes.length, pagam, fat, lucro };
    });
  }, [pendentes, valorPendente]);

  const chartData = useMemo(() => {
    const proj20 = valorPendente * 0.8;
    return [
      { nome: "Receita Confirmada", receita: receitaTotal, projecao: 0 },
      { nome: "Projeção Pendentes", receita: 0, projecao: proj20 },
      { nome: "Total Estimado", receita: receitaTotal, projecao: proj20 },
    ];
  }, [receitaTotal, valorPendente]);

  const pendentesOrdenados = useMemo(
    () => [...pendentes].sort((a, b) => {
      if (!a.previsao_entrega && !b.previsao_entrega) return 0;
      if (!a.previsao_entrega) return 1;
      if (!b.previsao_entrega) return -1;
      return parseISO(a.previsao_entrega).getTime() - parseISO(b.previsao_entrega).getTime();
    }),
    [pendentes]
  );

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando projeções...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LineChartIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Projeções Financeiras</h1>
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Todas as contas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas (consolidado)</SelectItem>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={DollarSign} title="Receita Total (Pagos)" value={fmt(receitaTotal)} sub={accountFilter === "all" ? `${pagos.length} pedidos pagos` : "Filtrado por conta"} color="text-success" />
        <SummaryCard icon={DollarSign} title="Receita do Mês" value={fmt(receitaMesAtual)} sub={format(hoje, "MMMM/yyyy", { locale: ptBR })} color="text-success" />
        <SummaryCard icon={Package} title="Pendentes (não chegaram)" value={String(pendentes.length)} sub={`Valor total: ${fmt(valorPendente)}`} color="text-primary" />
        <SummaryCard icon={TrendingUp} title="Projeção (20% inad.)" value={fmt(valorPendente * 0.8)} sub="Estimativa conservadora" color="text-primary" />
      </div>

      {/* Chart */}
      {(receitaTotal > 0 || valorPendente > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Receita vs Projeção</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="nome" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="receita" stackId="a" fill="var(--color-receita)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projecao" stackId="a" fill="var(--color-projecao)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Cenários */}
      {cenarios.length > 0 && accountFilter === "all" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cenários — {pendentes.length} pedidos pendentes</CardTitle></CardHeader>
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
      )}

      {/* Pedidos pendentes */}
      {pendentesOrdenados.length > 0 && accountFilter === "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pedidos Aguardando Chegada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendentesOrdenados.slice(0, 20).map((p) => {
                  const diasRestantes = p.previsao_entrega
                    ? differenceInCalendarDays(parseISO(p.previsao_entrega), hoje) : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.cliente}</TableCell>
                      <TableCell>{p.produto}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.valor))}</TableCell>
                      <TableCell>{p.previsao_entrega ? format(parseISO(p.previsao_entrega), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell>
                        {diasRestantes !== null ? (
                          <Badge variant={diasRestantes <= 0 ? "destructive" : diasRestantes <= 3 ? "default" : "outline"}>
                            {diasRestantes <= 0 ? "Atrasado" : `${diasRestantes}d`}
                          </Badge>
                        ) : <Badge variant="outline">Sem previsão</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {pendentesOrdenados.length > 20 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Exibindo 20 de {pendentesOrdenados.length} pedidos pendentes.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {pedidos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum pedido encontrado. Adicione pedidos para ver projeções.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, sub, color }: { icon: any; title: string; value: string; sub: string; color?: string; }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
