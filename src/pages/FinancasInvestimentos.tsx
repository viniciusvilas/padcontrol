import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancasInvestimentos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Investimentos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carteira de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: acompanhamento de investimentos com valores atualizados e rendimentos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
