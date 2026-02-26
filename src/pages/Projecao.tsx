import { TrendingUp } from "lucide-react";

export default function Projecao() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Projeção</h1>
      </div>
      <p className="text-muted-foreground">Sistema de projeção será implementado na Fase 6.</p>
    </div>
  );
}
