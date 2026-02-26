import { XCircle } from "lucide-react";

export default function Perdidos() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <XCircle className="h-6 w-6 text-destructive" />
        <h1 className="text-2xl font-bold">Pedidos Perdidos</h1>
      </div>
      <p className="text-muted-foreground">Pedidos perdidos serão listados aqui.</p>
    </div>
  );
}
