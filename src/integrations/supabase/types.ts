export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anuncios: {
        Row: {
          created_at: string
          data: string
          id: string
          updated_at: string
          user_id: string
          valor_investido: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          updated_at?: string
          user_id: string
          valor_investido?: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          updated_at?: string
          user_id?: string
          valor_investido?: number
        }
        Relationships: []
      }
      finance_accounts: {
        Row: {
          balance: number
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner: string
          type: Database["public"]["Enums"]["finance_account_type"]
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner?: string
          type: Database["public"]["Enums"]["finance_account_type"]
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner?: string
          type?: Database["public"]["Enums"]["finance_account_type"]
          user_id?: string
        }
        Relationships: []
      }
      finance_bills: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          due_date: string
          id: string
          is_recurring: boolean
          name: string
          notes: string | null
          recurrence_interval:
            | Database["public"]["Enums"]["finance_recurrence_interval"]
            | null
          status: Database["public"]["Enums"]["finance_bill_status"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          due_date: string
          id?: string
          is_recurring?: boolean
          name: string
          notes?: string | null
          recurrence_interval?:
            | Database["public"]["Enums"]["finance_recurrence_interval"]
            | null
          status?: Database["public"]["Enums"]["finance_bill_status"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          due_date?: string
          id?: string
          is_recurring?: boolean
          name?: string
          notes?: string | null
          recurrence_interval?:
            | Database["public"]["Enums"]["finance_recurrence_interval"]
            | null
          status?: Database["public"]["Enums"]["finance_bill_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          month: string
          monthly_limit: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          month: string
          monthly_limit: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          month?: string
          monthly_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["finance_category_type"]
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: Database["public"]["Enums"]["finance_category_type"]
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["finance_category_type"]
          user_id?: string
        }
        Relationships: []
      }
      finance_distribution_rules: {
        Row: {
          envelope_id: string
          id: string
          percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          envelope_id: string
          id?: string
          percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          envelope_id?: string
          id?: string
          percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_distribution_rules_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "finance_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_envelopes: {
        Row: {
          account_id: string
          allocated_amount: number
          color: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          account_id: string
          allocated_amount?: number
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          target_amount?: number
          user_id: string
        }
        Update: {
          account_id?: string
          allocated_amount?: number
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_envelopes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_income_sources: {
        Row: {
          created_at: string
          expected_monthly_amount: number
          id: string
          is_active: boolean
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expected_monthly_amount?: number
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expected_monthly_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_investments: {
        Row: {
          created_at: string
          current_value: number
          id: string
          invested_amount: number
          last_updated: string
          name: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          invested_amount?: number
          last_updated?: string
          name: string
          notes?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          invested_amount?: number
          last_updated?: string
          name?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_receivable_installments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          receivable_id: string
          status: Database["public"]["Enums"]["finance_installment_status"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          receivable_id: string
          status?: Database["public"]["Enums"]["finance_installment_status"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          receivable_id?: string
          status?: Database["public"]["Enums"]["finance_installment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_receivable_installments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_receivable_installments_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "finance_receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_receivables: {
        Row: {
          account_id: string | null
          category: string
          client_name: string
          created_at: string
          description: string
          id: string
          installments: number
          notes: string | null
          status: Database["public"]["Enums"]["finance_receivable_status"]
          total_amount: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          category?: string
          client_name: string
          created_at?: string
          description: string
          id?: string
          installments?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["finance_receivable_status"]
          total_amount?: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          category?: string
          client_name?: string
          created_at?: string
          description?: string
          id?: string
          installments?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["finance_receivable_status"]
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_receivables_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean
          notes: string | null
          source: string
          type: Database["public"]["Enums"]["finance_transaction_type"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          source?: string
          type: Database["public"]["Enums"]["finance_transaction_type"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          source?: string
          type?: Database["public"]["Enums"]["finance_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transfers: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          from_account_id: string
          id: string
          to_account_id: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          from_account_id: string
          id?: string
          to_account_id: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          from_account_id?: string
          id?: string
          to_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          created_at: string
          id: string
          mes: string
          meta_faturamento: number
          meta_pedidos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mes: string
          meta_faturamento?: number
          meta_pedidos?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mes?: string
          meta_faturamento?: number
          meta_pedidos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente: string
          cliente_cobrado: boolean
          cliente_problematico: boolean
          conta_destino_id: string | null
          cpf: string | null
          created_at: string
          data: string
          data_entrega: string | null
          em_rota: boolean
          estado: string | null
          id: string
          ja_foi_chamado: boolean
          local_entrega: string | null
          observacoes: string | null
          pedido_chegou: boolean
          pedido_pago: boolean
          pedido_perdido: boolean
          plataforma: string
          prazo: number
          previsao_entrega: string | null
          produto: string
          rastreio: string | null
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
          valor: number
          valor_pago: number
        }
        Insert: {
          cliente: string
          cliente_cobrado?: boolean
          cliente_problematico?: boolean
          conta_destino_id?: string | null
          cpf?: string | null
          created_at?: string
          data?: string
          data_entrega?: string | null
          em_rota?: boolean
          estado?: string | null
          id?: string
          ja_foi_chamado?: boolean
          local_entrega?: string | null
          observacoes?: string | null
          pedido_chegou?: boolean
          pedido_pago?: boolean
          pedido_perdido?: boolean
          plataforma?: string
          prazo?: number
          previsao_entrega?: string | null
          produto: string
          rastreio?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor?: number
          valor_pago?: number
        }
        Update: {
          cliente?: string
          cliente_cobrado?: boolean
          cliente_problematico?: boolean
          conta_destino_id?: string | null
          cpf?: string | null
          created_at?: string
          data?: string
          data_entrega?: string | null
          em_rota?: boolean
          estado?: string | null
          id?: string
          ja_foi_chamado?: boolean
          local_entrega?: string | null
          observacoes?: string | null
          pedido_chegou?: boolean
          pedido_pago?: boolean
          pedido_perdido?: boolean
          plataforma?: string
          prazo?: number
          previsao_entrega?: string | null
          produto?: string
          rastreio?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          faturamento_acumulado: number
          id: string
          nome: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          faturamento_acumulado?: number
          id?: string
          nome?: string | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          faturamento_acumulado?: number
          id?: string
          nome?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      finance_account_type: "pj" | "pf" | "plataforma"
      finance_bill_status: "pending" | "paid" | "overdue"
      finance_category_type: "income" | "expense" | "both"
      finance_installment_status: "pending" | "paid" | "overdue"
      finance_receivable_status: "pending" | "partial" | "completed" | "overdue"
      finance_recurrence_interval: "monthly" | "weekly" | "yearly"
      finance_transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      finance_account_type: ["pj", "pf", "plataforma"],
      finance_bill_status: ["pending", "paid", "overdue"],
      finance_category_type: ["income", "expense", "both"],
      finance_installment_status: ["pending", "paid", "overdue"],
      finance_receivable_status: ["pending", "partial", "completed", "overdue"],
      finance_recurrence_interval: ["monthly", "weekly", "yearly"],
      finance_transaction_type: ["income", "expense"],
    },
  },
} as const
