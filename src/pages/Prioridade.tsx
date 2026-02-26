import { AlertTriangle } from "lucide-react";

export default function Prioridade() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <h1 className="text-2xl font-bold">Prioridade de Cobrança</h1>
      </div>
      <p className="text-muted-foreground">Pedidos inadimplentes com prioridade serão listados aqui.</p>
    </div>
  );
}
