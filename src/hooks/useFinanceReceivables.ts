import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FinanceReceivable {
  id: string;
  user_id: string;
  description: string;
  client_name: string;
  total_amount: number;
  installments: number;
  account_id: string | null;
  category: string;
  status: "pending" | "partial" | "completed" | "overdue";
  notes: string | null;
  created_at: string;
}

export interface FinanceInstallment {
  id: string;
  user_id: string;
  receivable_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: "pending" | "paid" | "overdue";
  account_id: string | null;
  created_at: string;
}

export function useFinanceReceivables() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: receivables = [], ...receivablesQuery } = useQuery({
    queryKey: ["finance-receivables", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_receivables")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as FinanceReceivable[];
    },
    enabled: !!user,
  });

  const { data: allInstallments = [], ...installmentsQuery } = useQuery({
    queryKey: ["finance-receivable-installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_receivable_installments")
        .select("*")
        .eq("user_id", user!.id)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as unknown as FinanceInstallment[];
    },
    enabled: !!user,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["finance-receivables"] });
    qc.invalidateQueries({ queryKey: ["finance-receivable-installments"] });
    qc.invalidateQueries({ queryKey: ["fin-transactions"] });
    qc.invalidateQueries({ queryKey: ["finance-accounts"] });
  };

  const createReceivable = useMutation({
    mutationFn: async (payload: {
      description: string;
      client_name: string;
      total_amount: number;
      installments_count: number;
      account_id: string | null;
      category: string;
      notes: string | null;
      first_due_date: string;
      custom_installments?: { amount: number; due_date: string }[];
    }) => {
      // Create receivable
      const { data: rec, error: recError } = await supabase
        .from("finance_receivables")
        .insert({
          user_id: user!.id,
          description: payload.description,
          client_name: payload.client_name,
          total_amount: payload.total_amount,
          installments: payload.installments_count,
          account_id: payload.account_id || null,
          category: payload.category,
          notes: payload.notes,
        } as any)
        .select()
        .single();
      if (recError) throw recError;

      // Create installments
      const installments: any[] = [];
      if (payload.custom_installments && payload.custom_installments.length > 0) {
        payload.custom_installments.forEach((ci, i) => {
          installments.push({
            user_id: user!.id,
            receivable_id: (rec as any).id,
            installment_number: i + 1,
            amount: ci.amount,
            due_date: ci.due_date,
            account_id: payload.account_id || null,
          });
        });
      } else {
        const amountPerInstallment = Math.round((payload.total_amount / payload.installments_count) * 100) / 100;
        const firstDate = new Date(payload.first_due_date + "T12:00:00");
        for (let i = 0; i < payload.installments_count; i++) {
          const d = new Date(firstDate);
          d.setMonth(d.getMonth() + i);
          installments.push({
            user_id: user!.id,
            receivable_id: (rec as any).id,
            installment_number: i + 1,
            amount: i === payload.installments_count - 1
              ? Math.round((payload.total_amount - amountPerInstallment * (payload.installments_count - 1)) * 100) / 100
              : amountPerInstallment,
            due_date: d.toISOString().split("T")[0],
            account_id: payload.account_id || null,
          });
        }
      }

      const { error: instError } = await supabase
        .from("finance_receivable_installments")
        .insert(installments as any);
      if (instError) throw instError;

      return rec;
    },
    onSuccess: () => {
      toast.success("Valor a receber criado!");
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markInstallmentPaid = useMutation({
    mutationFn: async (installment: FinanceInstallment) => {
      const today = new Date().toISOString().split("T")[0];
      
      // Update installment
      const { error: updError } = await supabase
        .from("finance_receivable_installments")
        .update({ status: "paid" as any, paid_at: today } as any)
        .eq("id", installment.id);
      if (updError) throw updError;

      // Find receivable for category
      const receivable = receivables.find((r) => r.id === installment.receivable_id);

      // Create income transaction
      const { error: txError } = await supabase
        .from("finance_transactions")
        .insert({
          user_id: user!.id,
          description: `Recebimento: ${receivable?.description || "Parcela"} #${installment.installment_number}`,
          amount: installment.amount,
          type: "income",
          category: receivable?.category || "Recebíveis",
          account_id: installment.account_id || receivable?.account_id || null,
          date: today,
          source: "receivable",
        });
      if (txError) throw txError;

      // Recalculate receivable status
      const { data: siblings } = await supabase
        .from("finance_receivable_installments")
        .select("status")
        .eq("receivable_id", installment.receivable_id);
      
      const allPaid = (siblings || []).every((s: any) => s.status === "paid");
      const somePaid = (siblings || []).some((s: any) => s.status === "paid");
      const newStatus = allPaid ? "completed" : somePaid ? "partial" : "pending";
      
      await supabase
        .from("finance_receivables")
        .update({ status: newStatus as any } as any)
        .eq("id", installment.receivable_id);
    },
    onSuccess: () => {
      toast.success("Parcela marcada como recebida!");
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteReceivable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_receivables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Valor a receber removido!");
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    receivables,
    allInstallments,
    createReceivable,
    markInstallmentPaid,
    deleteReceivable,
    isLoading: receivablesQuery.isLoading || installmentsQuery.isLoading,
  };
}
