import { Clock } from "lucide-react";

export default function PrestesAChegar() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-6 w-6 text-info" />
        <h1 className="text-2xl font-bold">Prestes a Chegar</h1>
      </div>
      <p className="text-muted-foreground">Pedidos próximos da entrega serão listados aqui.</p>
    </div>
  );
}
