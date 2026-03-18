import {
  Package, Megaphone, LayoutDashboard, LogOut,
  Wallet, ArrowLeftRight, Receipt, LineChart, PieChart, Tags, Building2, ClipboardList, TrendingUp,
} from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuVendas = [
  { title: "Pedidos", url: "/", icon: Package },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Anúncios", url: "/anuncios", icon: Megaphone },
];

const menuFinancas = [
  { title: "Dashboard", url: "/financas", icon: Wallet },
  { title: "Transações", url: "/financas/transacoes", icon: ArrowLeftRight },
  { title: "Contas a Pagar", url: "/financas/contas-a-pagar", icon: Receipt },
  { title: "Orçamento", url: "/financas/orcamento", icon: PieChart },
  { title: "Investimentos", url: "/financas/investimentos", icon: TrendingUp },
  { title: "A Receber", url: "/financas/a-receber", icon: ClipboardList },
  { title: "Projeções", url: "/financas/projecoes", icon: LineChart },
  { title: "Categorias", url: "/financas/categorias", icon: Tags },
  { title: "Contas", url: "/financas/contas", icon: Building2 },
];

function MenuSection({ label, items, collapsed }: { label: string; items: typeof menuVendas; collapsed: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="overflow-y-auto">
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

        <MenuSection label="Vendas (PAD)" items={menuVendas} collapsed={collapsed} />
        <MenuSection label="Finanças Pessoais" items={menuFinancas} collapsed={collapsed} />
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
