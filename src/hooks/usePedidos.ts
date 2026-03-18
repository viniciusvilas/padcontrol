import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Pedido = Tables<"pedidos">;

export function usePedidos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ["pedidos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user,
  });

  const toggleField = async (
    pedido: Pedido,
    field: "pedido_chegou" | "ja_foi_chamado" | "cliente_cobrado" | "pedido_pago" | "pedido_perdido"
  ) => {
    const newVal = !(pedido as any)[field];
    const updateData: Record<string, any> = { [field]: newVal };
    if (field === "pedido_chegou") {
      updateData.data_entrega = newVal ? new Date().toISOString().split("T")[0] : null;
    }
    const { error } = await supabase.from("pedidos").update(updateData).eq("id", pedido.id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    qc.invalidateQueries({ queryKey: ["pedidos"] });
  };

  const deletePedido = async (id: string) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Pedido excluído");
      refetch();
    }
  };

  return { pedidos, isLoading, refetch, toggleField, deletePedido };
}
