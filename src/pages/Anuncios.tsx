import { Megaphone } from "lucide-react";

export default function Anuncios() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Anúncios</h1>
      </div>
      <p className="text-muted-foreground">Controle de anúncios será implementado na Fase 4.</p>
    </div>
  );
}
