import { Phone } from "lucide-react";

export default function Cobranca() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Phone className="h-6 w-6 text-warning" />
        <h1 className="text-2xl font-bold">Cobrança</h1>
      </div>
      <p className="text-muted-foreground">Pedidos aguardando cobrança serão listados aqui.</p>
    </div>
  );
}
