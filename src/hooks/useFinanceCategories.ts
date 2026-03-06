import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense" | "both";
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export function useFinanceCategories(filterType?: "income" | "expense") {
  const { user } = useAuth();

  const { data: categories = [], ...rest } = useQuery({
    queryKey: ["finance-categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_categories")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as unknown as FinanceCategory[];
    },
    enabled: !!user,
  });

  const activeCategories = categories.filter((c) => c.is_active);

  const filtered = filterType
    ? activeCategories.filter((c) => c.type === filterType || c.type === "both")
    : activeCategories;

  return {
    categories,
    activeCategories,
    filtered,
    ...rest,
  };
}
