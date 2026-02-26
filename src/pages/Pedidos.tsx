import { Package } from "lucide-react";

export default function Pedidos() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Todos os Pedidos</h1>
      </div>
      <p className="text-muted-foreground">Gestão de pedidos será implementada na Fase 2.</p>
    </div>
  );
}
