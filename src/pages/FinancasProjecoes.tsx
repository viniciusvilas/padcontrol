import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancasProjecoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LineChart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Projeções</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projeções Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: projeções de receitas, despesas e patrimônio ao longo do tempo.</p>
        </CardContent>
      </Card>
    </div>
  );
}
