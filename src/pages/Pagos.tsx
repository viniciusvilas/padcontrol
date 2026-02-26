import { CheckCircle } from "lucide-react";

export default function Pagos() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="h-6 w-6 text-success" />
        <h1 className="text-2xl font-bold">Pedidos Pagos</h1>
      </div>
      <p className="text-muted-foreground">Pedidos já pagos serão listados aqui.</p>
    </div>
  );
}
