import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    toast.info("Recarregando dados...");
    try {
      await queryClient.invalidateQueries();
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000)
      );
      await Promise.race([queryClient.refetchQueries(), timeout]);
      toast.success("Dados atualizados!");
      setIsRefreshing(false);
    } catch {
      toast.info("Recarregando página...");
      window.location.reload();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-2">
            <SidebarTrigger className="mr-2" />
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefreshAll} disabled={isRefreshing} aria-label="Recarregar dados">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
