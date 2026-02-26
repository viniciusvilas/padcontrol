import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <p className="text-muted-foreground">Dashboard financeiro será implementado na Fase 5.</p>
    </div>
  );
}
