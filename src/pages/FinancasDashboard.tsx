import { LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancasDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: resumo financeiro completo com receitas, despesas e investimentos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
