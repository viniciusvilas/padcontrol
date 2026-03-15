import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Pedidos from "./pages/Pedidos";
import PrestesAChegar from "./pages/PrestesAChegar";
import FaltaChamar from "./pages/FaltaChamar";
import Cobranca from "./pages/Cobranca";
import Prioridade from "./pages/Prioridade";
import Pagos from "./pages/Pagos";
import Perdidos from "./pages/Perdidos";
import Anuncios from "./pages/Anuncios";
import Dashboard from "./pages/Dashboard";
import Projecao from "./pages/Projecao";
import Nivel from "./pages/Nivel";

import FinancasDashboard from "./pages/FinancasDashboard";
import FinancasTransacoes from "./pages/FinancasTransacoes";
import FinancasContasPagar from "./pages/FinancasContasPagar";
import FinancasInvestimentos from "./pages/FinancasInvestimentos";
import FinancasProjecoes from "./pages/FinancasProjecoes";
import FinancasOrcamento from "./pages/FinancasOrcamento";
import FinancasCategorias from "./pages/FinancasCategorias";
import FinancasContas from "./pages/FinancasContas";
import FinancasAReceber from "./pages/FinancasAReceber";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
    },
  },
});

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout />
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Pedidos />} />
              <Route path="/prestes-a-chegar" element={<PrestesAChegar />} />
              <Route path="/falta-chamar" element={<FaltaChamar />} />
              <Route path="/cobranca" element={<Cobranca />} />
              <Route path="/prioridade" element={<Prioridade />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/perdidos" element={<Perdidos />} />
              <Route path="/anuncios" element={<Anuncios />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projecao" element={<Projecao />} />
              <Route path="/nivel" element={<Nivel />} />
              
              <Route path="/financas" element={<FinancasDashboard />} />
              <Route path="/financas/transacoes" element={<FinancasTransacoes />} />
              <Route path="/financas/contas-a-pagar" element={<FinancasContasPagar />} />
              <Route path="/financas/orcamento" element={<FinancasOrcamento />} />
              <Route path="/financas/investimentos" element={<FinancasInvestimentos />} />
              <Route path="/financas/projecoes" element={<FinancasProjecoes />} />
              <Route path="/financas/categorias" element={<FinancasCategorias />} />
              <Route path="/financas/contas" element={<FinancasContas />} />
              <Route path="/financas/a-receber" element={<FinancasAReceber />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
