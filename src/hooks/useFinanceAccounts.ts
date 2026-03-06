import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FinanceAccount {
  id: string;
  user_id: string;
  name: string;
  type: "pj" | "pf" | "plataforma";
  owner: string;
  balance: number; // saldo inicial (abertura)
  computedBalance: number; // saldo real calculado dinamicamente
  color: string;
  is_active: boolean;
  created_at: string;
}

export const isPlatformAccount = (acc: FinanceAccount) => acc.type === "plataforma";
export const isBankAccount = (acc: FinanceAccount) => acc.type !== "plataforma";

export function useFinanceAccounts() {
  const { user } = useAuth();

  const { data: accounts = [], ...rest } = useQuery({
    queryKey: ["finance-accounts", user?.id],
    queryFn: async () => {
      // Fetch accounts, all transactions, and all transfers in parallel
      const [accRes, txRes, trRes] = await Promise.all([
        supabase
          .from("finance_accounts")
          .select("*")
          .eq("user_id", user!.id)
          .order("name"),
        supabase
          .from("finance_transactions")
          .select("account_id, type, amount")
          .eq("user_id", user!.id),
        supabase
          .from("finance_transfers")
          .select("from_account_id, to_account_id, amount")
          .eq("user_id", user!.id),
      ]);

      if (accRes.error) throw accRes.error;
      if (txRes.error) throw txRes.error;
      if (trRes.error) throw trRes.error;

      // Build per-account income/expense sums
      const txIncomeMap = new Map<string, number>();
      const txExpenseMap = new Map<string, number>();
      for (const tx of txRes.data || []) {
        if (!tx.account_id) continue;
        const amt = Number(tx.amount);
        if (tx.type === "income") {
          txIncomeMap.set(tx.account_id, (txIncomeMap.get(tx.account_id) || 0) + amt);
        } else {
          txExpenseMap.set(tx.account_id, (txExpenseMap.get(tx.account_id) || 0) + amt);
        }
      }

      // Build per-account transfer in/out sums
      const trInMap = new Map<string, number>();
      const trOutMap = new Map<string, number>();
      for (const tr of trRes.data || []) {
        const amt = Number(tr.amount);
        trInMap.set(tr.to_account_id, (trInMap.get(tr.to_account_id) || 0) + amt);
        trOutMap.set(tr.from_account_id, (trOutMap.get(tr.from_account_id) || 0) + amt);
      }

      return (accRes.data || []).map((acc: any) => {
        const initialBalance = Number(acc.balance) || 0;
        const income = txIncomeMap.get(acc.id) || 0;
        const expense = txExpenseMap.get(acc.id) || 0;
        const transfersIn = trInMap.get(acc.id) || 0;
        const transfersOut = trOutMap.get(acc.id) || 0;
        const computedBalance = initialBalance + income - expense + transfersIn - transfersOut;

        return {
          ...acc,
          balance: initialBalance,
          computedBalance,
        } as FinanceAccount;
      });
    },
    enabled: !!user,
  });

  const activeAccounts = accounts.filter((a) => a.is_active);

  return { accounts, activeAccounts, ...rest };
}
