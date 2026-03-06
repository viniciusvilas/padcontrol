import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancasContasPagar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: gestão de contas a pagar com vencimentos e status.</p>
        </CardContent>
      </Card>
    </div>
  );
}
