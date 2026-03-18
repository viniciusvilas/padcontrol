import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type Anuncio = Tables<"anuncios">;

export function useAnuncios() {
  const { user } = useAuth();

  const { data: anuncios = [], isLoading, refetch } = useQuery({
    queryKey: ["anuncios", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as Anuncio[];
    },
    enabled: !!user,
  });

  const totalInvestido = anuncios.reduce((s, a) => s + Number(a.valor_investido), 0);

  return { anuncios, isLoading, refetch, totalInvestido };
}
