import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FinanceAccount {
  id: string;
  user_id: string;
  name: string;
  type: "pj" | "pf";
  owner: string;
  balance: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export function useFinanceAccounts() {
  const { user } = useAuth();

  const { data: accounts = [], ...rest } = useQuery({
    queryKey: ["finance-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as unknown as FinanceAccount[];
    },
    enabled: !!user,
  });

  const activeAccounts = accounts.filter((a) => a.is_active);

  return { accounts, activeAccounts, ...rest };
}
