import {
  Package, Clock, Phone, PhoneCall, AlertTriangle, CheckCircle, XCircle,
  Megaphone, LayoutDashboard, TrendingUp, Trophy, LogOut, Download,
  Wallet, ArrowLeftRight, Receipt, LineChart
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuPedidos = [
  { title: "Todos os Pedidos", url: "/", icon: Package },
  { title: "Prestes a Chegar", url: "/prestes-a-chegar", icon: Clock },
  { title: "Falta Chamar", url: "/falta-chamar", icon: PhoneCall },
  { title: "Cobrança", url: "/cobranca", icon: Phone },
  { title: "Prioridade", url: "/prioridade", icon: AlertTriangle },
  { title: "Pagos", url: "/pagos", icon: CheckCircle },
  { title: "Perdidos", url: "/perdidos", icon: XCircle },
];

const menuGeral = [
  { title: "Anúncios", url: "/anuncios", icon: Megaphone },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projeção", url: "/projecao", icon: TrendingUp },
  { title: "Nível", url: "/nivel", icon: Trophy },
  { title: "Instalar App", url: "/install", icon: Download },
];

const menuFinancas = [
  { title: "Dashboard", url: "/financas", icon: Wallet },
  { title: "Transações", url: "/financas/transacoes", icon: ArrowLeftRight },
  { title: "Contas a Pagar", url: "/financas/contas-a-pagar", icon: Receipt },
  { title: "Investimentos", url: "/financas/investimentos", icon: TrendingUp },
  { title: "Projeções", url: "/financas/projecoes", icon: LineChart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`px-4 py-5 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-sidebar-primary-foreground font-['Space_Grotesk']">
                PAD Manager
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Pedidos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuPedidos.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuGeral.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Finanças Pessoais</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuFinancas.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
