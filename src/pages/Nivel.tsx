import { Trophy } from "lucide-react";

export default function Nivel() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-warning" />
        <h1 className="text-2xl font-bold">Nível</h1>
      </div>
      <p className="text-muted-foreground">Sistema de níveis será implementado na Fase 6.</p>
    </div>
  );
}
