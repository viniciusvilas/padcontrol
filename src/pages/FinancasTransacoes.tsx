import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancasTransacoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Transações</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: listagem de receitas e despesas com filtros e categorias.</p>
        </CardContent>
      </Card>
    </div>
  );
}
