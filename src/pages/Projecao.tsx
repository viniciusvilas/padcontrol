import { useState, useMemo } from "react";
import { TrendingUp, Target, Megaphone, DollarSign, Package, Save, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, parseISO, getDaysInMonth, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

const FRETE_FIVE = 35;

const projectionChartConfig: ChartConfig = {
  real: { label: "Real", color: "hsl(var(--primary))" },
  projetado: { label: "Projetado", color: "hsl(var(--muted-foreground))" },
};

export default function Projecao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const mesAtual = format(startOfMonth(now), "yyyy-MM-dd");
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaFat, setMetaFat] = useState("");
  const [metaPed, setMetaPed] = useState("");

  // Fetch pedidos
  const { data: pedidos = [] } = useQuery({
    queryKey: ["pedidos-projecao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch anuncios
  const { data: anuncios = [] } = useQuery({
    queryKey: ["anuncios-projecao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("anuncios").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch meta do mês
  const { data: meta } = useQuery({
    queryKey: ["meta-mes", user?.id, mesAtual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user!.id)
        .eq("mes", mesAtual)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Save meta
  const saveMeta = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        mes: mesAtual,
        meta_faturamento: Number(metaFat) || 0,
        meta_pedidos: Number(metaPed) || 0,
      };
      if (meta?.id) {
        const { error } = await supabase.from("metas").update(payload).eq("id", meta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("metas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-mes"] });
      setEditingMeta(false);
      toast.success("Meta salva!");
    },
    onError: () => toast.error("Erro ao salvar meta"),
  });

  // Initialize form when meta loads
  useMemo(() => {
    if (meta && !editingMeta) {
      setMetaFat(String(meta.meta_faturamento || ""));
      setMetaPed(String(meta.meta_pedidos || ""));
    }
  }, [meta]);

  // Pedidos do mês atual
  const inicioMes = startOfMonth(now);
  const fimMes = endOfMonth(now);
  const pedidosMes = useMemo(() =>
    pedidos.filter((p) => {
      const d = parseISO(p.data);
      return d >= inicioMes && d <= fimMes;
    }),
    [pedidos, mesAtual]
  );

  const anunciosMes = useMemo(() =>
    anuncios.filter((a) => {
      const d = parseISO(a.data);
      return d >= inicioMes && d <= fimMes;
    }),
    [anuncios, mesAtual]
  );

  // Métricas atuais do mês
  const totalPedidosMes = pedidosMes.length;
  const pagosMes = pedidosMes.filter((p) => p.pedido_pago);
  const faturamentoPagosMes = pagosMes.reduce((s, p) => s + Number(p.valor), 0);
  const lucroPagosMes = pagosMes.reduce((s, p) => s + Number(p.valor) - (p.plataforma === "Five" ? FRETE_FIVE : 0), 0);
  const valorAgendadoMes = pedidosMes.reduce((s, p) => s + Number(p.valor), 0);
  const investidoMes = anunciosMes.reduce((s, a) => s + Number(a.valor_investido), 0);

  // Projeções
  const diasNoMes = getDaysInMonth(now);
  const diaAtual = now.getDate();
  const diasRestantes = diasNoMes - diaAtual;

  // Média diária
  const mediaPedidosDia = diaAtual > 0 ? totalPedidosMes / diaAtual : 0;
  const mediaFatDia = diaAtual > 0 ? valorAgendadoMes / diaAtual : 0;
  const mediaInvestDia = diaAtual > 0 ? investidoMes / diaAtual : 0;

  // Projeções para o fim do mês
  const pedidosProjetados = Math.round(totalPedidosMes + mediaPedidosDia * diasRestantes);
  const fatProjetado = valorAgendadoMes + mediaFatDia * diasRestantes;
  const investProjetado = investidoMes + mediaInvestDia * diasRestantes;

  // Taxa de conversão histórica (pagos / total)
  const taxaConversao = pedidos.length > 0
    ? pedidos.filter((p) => p.pedido_pago).length / pedidos.length
    : 0;
  const pagosProjetados = Math.round(pedidosProjetados * taxaConversao);
  const lucroProjetado = pagosProjetados * (pagosMes.length > 0 ? lucroPagosMes / pagosMes.length : 0);

  // CPA projetado
  const cpaProjetado = pedidosProjetados > 0 ? investProjetado / pedidosProjetados : 0;

  // Meta progress
  const metaFaturamento = meta?.meta_faturamento || 0;
  const metaPedidosVal = meta?.meta_pedidos || 0;
  const progressFat = metaFaturamento > 0 ? Math.min((valorAgendadoMes / metaFaturamento) * 100, 100) : 0;
  const progressPed = metaPedidosVal > 0 ? Math.min((totalPedidosMes / metaPedidosVal) * 100, 100) : 0;

  // Para atingir meta: quanto investir
  const cpaMedioHistorico = pedidos.length > 0
    ? anuncios.reduce((s, a) => s + Number(a.valor_investido), 0) / pedidos.length
    : 0;
  const pedidosFaltamMeta = Math.max(0, metaPedidosVal - totalPedidosMes);
  const investNecessario = pedidosFaltamMeta * cpaMedioHistorico;

  // Chart data: faturamento diário acumulado vs meta
  const chartData = useMemo(() => {
    const dailyMap = new Map<number, number>();
    pedidosMes.forEach((p) => {
      const dia = parseISO(p.data).getDate();
      dailyMap.set(dia, (dailyMap.get(dia) || 0) + Number(p.valor));
    });

    let acumulado = 0;
    return Array.from({ length: diasNoMes }, (_, i) => {
      const dia = i + 1;
      const isReal = dia <= diaAtual;
      acumulado += dailyMap.get(dia) || 0;
      const projetadoAcum = isReal ? null : acumulado + mediaFatDia * (dia - diaAtual);
      return {
        dia: String(dia),
        real: isReal ? acumulado : null,
        projetado: isReal ? null : projetadoAcum,
      };
    });
  }, [pedidosMes, diasNoMes, diaAtual, mediaFatDia]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Projeção — {format(now, "MMMM yyyy", { locale: ptBR })}</h1>
      </div>

      {/* Meta Mensal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Meta Mensal
          </CardTitle>
          {!editingMeta ? (
            <Button variant="ghost" size="sm" onClick={() => setEditingMeta(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          ) : (
            <Button size="sm" onClick={() => saveMeta.mutate()} disabled={saveMeta.isPending}>
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editingMeta ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Meta de Faturamento (R$)</Label>
                <Input type="number" value={metaFat} onChange={(e) => setMetaFat(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Meta de Pedidos</Label>
                <Input type="number" value={metaPed} onChange={(e) => setMetaPed(e.target.value)} placeholder="0" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Faturamento</span>
                  <span className="font-medium">
                    R$ {valorAgendadoMes.toFixed(2)} / R$ {metaFaturamento.toFixed(2)}
                  </span>
                </div>
                <Progress value={progressFat} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {progressFat.toFixed(0)}% atingido • Projeção: R$ {fatProjetado.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pedidos</span>
                  <span className="font-medium">
                    {totalPedidosMes} / {metaPedidosVal}
                  </span>
                </div>
                <Progress value={progressPed} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {progressPed.toFixed(0)}% atingido • Projeção: {pedidosProjetados} pedidos
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projeções */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProjectionCard
          title="Pedidos Projetados"
          icon={Package}
          current={totalPedidosMes}
          projected={pedidosProjetados}
          format="int"
        />
        <ProjectionCard
          title="Faturamento Projetado"
          icon={DollarSign}
          current={valorAgendadoMes}
          projected={fatProjetado}
          format="currency"
        />
        <ProjectionCard
          title="Pagos Projetados"
          icon={TrendingUp}
          current={pagosMes.length}
          projected={pagosProjetados}
          format="int"
          subtitle={`Taxa conv.: ${(taxaConversao * 100).toFixed(0)}%`}
        />
        <ProjectionCard
          title="Lucro Projetado"
          icon={DollarSign}
          current={lucroPagosMes}
          projected={lucroProjetado}
          format="currency"
        />
      </div>

      {/* Anúncios Projeção */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ProjectionCard
          title="Investimento Projetado"
          icon={Megaphone}
          current={investidoMes}
          projected={investProjetado}
          format="currency"
        />
        <ProjectionCard
          title="CPA Projetado"
          icon={Target}
          current={totalPedidosMes > 0 ? investidoMes / totalPedidosMes : 0}
          projected={cpaProjetado}
          format="currency"
        />
        {metaPedidosVal > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Investimento p/ Meta</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">R$ {investNecessario.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {pedidosFaltamMeta} pedidos faltam • CPA médio: R$ {cpaMedioHistorico.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico acumulado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento Acumulado vs Projeção</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={projectionChartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="dia" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="real" fill="var(--color-real)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projetado" fill="var(--color-projetado)" radius={[4, 4, 0, 0]} opacity={0.4} />
              {metaFaturamento > 0 && (
                <ReferenceLine y={metaFaturamento} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "Meta", position: "right", fill: "hsl(var(--destructive))" }} />
              )}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectionCard({
  title, icon: Icon, current, projected, format: fmt, subtitle,
}: {
  title: string; icon: any; current: number; projected: number; format: "currency" | "int"; subtitle?: string;
}) {
  const formatVal = (v: number) => fmt === "currency" ? `R$ ${v.toFixed(2)}` : String(Math.round(v));
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatVal(projected)}</div>
        <p className="text-xs text-muted-foreground">Atual: {formatVal(current)}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
