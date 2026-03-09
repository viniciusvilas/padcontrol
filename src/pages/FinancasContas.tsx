import { useState, useMemo } from "react";
import {
  Building2, Plus, Pencil, Power, ArrowRightLeft, Wallet2,
  Settings2, Play, Trash2, ArrowDownToLine
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAccounts, FinanceAccount, isPlatformAccount, isBankAccount } from "@/hooks/useFinanceAccounts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// ── Types ──
interface Envelope {
  id: string; user_id: string; name: string; account_id: string;
  allocated_amount: number; target_amount: number; color: string;
  icon: string | null; is_active: boolean; created_at: string;
}
interface DistRule { id: string; user_id: string; envelope_id: string; percentage: number; updated_at: string; }

interface AccountForm {
  id?: string; name: string; type: "pj" | "pf" | "plataforma"; owner: string; color: string; balance: string;
}
interface TransferForm {
  from_account_id: string; to_account_id: string; amount: string;
  date: string; description: string; category: string;
}
interface EnvelopeForm {
  id?: string; name: string; account_id: string;
  allocated_amount: string; target_amount: string; color: string;
}

const emptyAccountForm: AccountForm = { name: "", type: "pf", owner: "", color: "#6366f1", balance: "0" };
const emptyTransferForm: TransferForm = {
  from_account_id: "", to_account_id: "", amount: "",
  date: format(new Date(), "yyyy-MM-dd"), description: "", category: "",
};
const emptyEnvelopeForm: EnvelopeForm = { name: "", account_id: "", allocated_amount: "0", target_amount: "0", color: "#6366f1" };
const transferCategories = ["Pró-labore", "Aporte", "Operacional", "Investimento", "Outro"];

export default function FinancasContas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { accounts, activeAccounts, isLoading: loadingAccounts } = useFinanceAccounts();

  // Dialog states
  const [accountDialog, setAccountDialog] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState<TransferForm>(emptyTransferForm);
  const [envelopeDialog, setEnvelopeDialog] = useState(false);
  const [envelopeForm, setEnvelopeForm] = useState<EnvelopeForm>(emptyEnvelopeForm);
  const [distDialog, setDistDialog] = useState(false);
  const [applyDialog, setApplyDialog] = useState(false);
  const [applyAmount, setApplyAmount] = useState("");
  const [saqueDialog, setSaqueDialog] = useState(false);
  const [saqueForm, setSaqueForm] = useState<TransferForm>({ ...emptyTransferForm, category: "Saque de Plataforma" });

  // ── Queries ──
  const { data: transfers = [] } = useQuery({
    queryKey: ["finance-transfers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_transfers")
        .select("*").eq("user_id", user!.id)
        .order("date", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: envelopes = [] } = useQuery({
    queryKey: ["finance-envelopes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_envelopes")
        .select("*").eq("user_id", user!.id).order("name");
      if (error) throw error;
      return data as unknown as Envelope[];
    },
    enabled: !!user,
  });

  const { data: distRules = [] } = useQuery({
    queryKey: ["finance-dist-rules", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_distribution_rules")
        .select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as DistRule[];
    },
    enabled: !!user,
  });

  // ── Derived data ──
  const accountMap = useMemo(() => {
    const m = new Map<string, FinanceAccount>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  const bankAccounts = accounts.filter((a) => isBankAccount(a));
  const platformAccounts = accounts.filter((a) => isPlatformAccount(a));
  const activeBankAccounts = bankAccounts.filter((a) => a.is_active);
  const activePlatformAccounts = platformAccounts.filter((a) => a.is_active);
  const totalBankBalance = activeBankAccounts.reduce((s, a) => s + a.computedBalance, 0);
  const totalPlatformBalance = activePlatformAccounts.reduce((s, a) => s + a.computedBalance, 0);
  const totalBalance = totalBankBalance;

  const groupedEnvelopes = useMemo(() => {
    const map = new Map<string, Envelope[]>();
    envelopes.forEach((e) => {
      if (!map.has(e.account_id)) map.set(e.account_id, []);
      map.get(e.account_id)!.push(e);
    });
    return map;
  }, [envelopes]);

  const freeMoneyByAccount = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) => {
      const allocated = envelopes
        .filter((e) => e.account_id === a.id && e.is_active)
        .reduce((s, e) => s + Number(e.allocated_amount), 0);
      map.set(a.id, a.computedBalance - allocated);
    });
    return map;
  }, [accounts, envelopes]);

  // Distribution percentages state
  const [distPercentages, setDistPercentages] = useState<Record<string, string>>({});

  // Find PJ Esposa account for distribution
  const pjEsposa = accounts.find((a) => a.name.toLowerCase().includes("pj esposa"));
  const pjEsposaEnvelopes = envelopes.filter((e) => pjEsposa && e.account_id === pjEsposa.id && e.is_active);

  // Init distribution percentages when dialog opens
  const openDistDialog = () => {
    const defaults: Record<string, number> = {
      "Capital de Giro": 30, "Anúncios PAD": 20,
      "Pró-labore Vinicius": 15, "Pró-labore Esposa": 15,
      "Reserva de Emergência": 10, "Investimentos": 10,
    };
    const pcts: Record<string, string> = {};
    pjEsposaEnvelopes.forEach((e) => {
      const existing = distRules.find((r) => r.envelope_id === e.id);
      pcts[e.id] = existing ? String(existing.percentage) : String(defaults[e.name] || 0);
    });
    setDistPercentages(pcts);
    setDistDialog(true);
  };

  const distTotal = Object.values(distPercentages).reduce((s, v) => s + (Number(v) || 0), 0);

  // Applied distribution preview
  const applyPreview = useMemo(() => {
    const amt = Number(applyAmount) || 0;
    return pjEsposaEnvelopes.map((e) => {
      const rule = distRules.find((r) => r.envelope_id === e.id);
      const pct = rule ? Number(rule.percentage) : 0;
      return { envelope: e, percentage: pct, value: (amt * pct) / 100 };
    }).filter((r) => r.percentage > 0);
  }, [applyAmount, pjEsposaEnvelopes, distRules]);

  // ── Mutations ──
  const saveAccountMutation = useMutation({
    mutationFn: async (f: AccountForm) => {
      const payload = { user_id: user!.id, name: f.name, type: f.type, owner: f.owner, color: f.color, balance: Number(f.balance) };
      if (f.id) {
        const { error } = await supabase.from("finance_accounts").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-accounts"] }); setAccountDialog(false); setAccountForm(emptyAccountForm); toast.success("Conta salva!"); },
    onError: () => toast.error("Erro ao salvar conta."),
  });

  const toggleAccountMutation = useMutation({
    mutationFn: async (acc: FinanceAccount) => {
      const { error } = await supabase.from("finance_accounts").update({ is_active: !acc.is_active }).eq("id", acc.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-accounts"] }); toast.success("Status atualizado!"); },
  });

  const saveTransferMutation = useMutation({
    mutationFn: async (f: TransferForm) => {
      if (f.from_account_id === f.to_account_id) throw new Error("Contas devem ser diferentes");
      const amount = Number(f.amount);

      // Insert transfer
      const { error } = await supabase.from("finance_transfers").insert({
        user_id: user!.id, from_account_id: f.from_account_id, to_account_id: f.to_account_id,
        amount, date: f.date, description: f.description, category: f.category,
      });
      if (error) throw error;

      // Balance is computed dynamically — no manual update needed
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-transfers"] });
      qc.invalidateQueries({ queryKey: ["finance-accounts"] });
      setTransferDialog(false); setTransferForm(emptyTransferForm);
      toast.success("Transferência registrada!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar."),
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_transfers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-transfers"] }); toast.success("Transferência excluída!"); },
  });

  const saveSaqueMutation = useMutation({
    mutationFn: async (f: TransferForm) => {
      if (f.from_account_id === f.to_account_id) throw new Error("Contas devem ser diferentes");
      const fromAcc = accountMap.get(f.from_account_id);
      const toAcc = accountMap.get(f.to_account_id);
      if (!fromAcc || !isPlatformAccount(fromAcc)) throw new Error("Conta origem deve ser uma plataforma");
      if (!toAcc || isPlatformAccount(toAcc)) throw new Error("Conta destino deve ser uma conta bancária");
      const amount = Number(f.amount);
      const { error } = await supabase.from("finance_transfers").insert({
        user_id: user!.id, from_account_id: f.from_account_id, to_account_id: f.to_account_id,
        amount, date: f.date, description: f.description || "Saque de plataforma", category: "Saque de Plataforma",
      });
      if (error) throw error;
      // Balance is computed dynamically — no manual update needed
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-transfers"] });
      qc.invalidateQueries({ queryKey: ["finance-accounts"] });
      setSaqueDialog(false); setSaqueForm({ ...emptyTransferForm, category: "Saque de Plataforma" });
      toast.success("Saque registrado!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar saque."),
  });

  const saveEnvelopeMutation = useMutation({
    mutationFn: async (f: EnvelopeForm) => {
      const payload = {
        user_id: user!.id, name: f.name, account_id: f.account_id,
        allocated_amount: Number(f.allocated_amount), target_amount: Number(f.target_amount), color: f.color,
      };
      if (f.id) {
        const { error } = await supabase.from("finance_envelopes").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_envelopes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-envelopes"] }); setEnvelopeDialog(false); setEnvelopeForm(emptyEnvelopeForm); toast.success("Envelope salvo!"); },
    onError: () => toast.error("Erro ao salvar envelope."),
  });

  const toggleEnvelopeMutation = useMutation({
    mutationFn: async (env: Envelope) => {
      const { error } = await supabase.from("finance_envelopes").update({ is_active: !env.is_active }).eq("id", env.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-envelopes"] }); toast.success("Status atualizado!"); },
  });

  const saveDistMutation = useMutation({
    mutationFn: async (pcts: Record<string, string>) => {
      for (const [envelopeId, pct] of Object.entries(pcts)) {
        const existing = distRules.find((r) => r.envelope_id === envelopeId);
        if (existing) {
          const { error } = await supabase.from("finance_distribution_rules")
            .update({ percentage: Number(pct), updated_at: new Date().toISOString() }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("finance_distribution_rules")
            .insert({ user_id: user!.id, envelope_id: envelopeId, percentage: Number(pct) });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-dist-rules"] });
      setDistDialog(false);
      toast.success("Distribuição salva!");
    },
    onError: () => toast.error("Erro ao salvar distribuição."),
  });

  const applyDistMutation = useMutation({
    mutationFn: async () => {
      for (const item of applyPreview) {
        const newAllocated = Number(item.envelope.allocated_amount) + item.value;
        const { error } = await supabase.from("finance_envelopes")
          .update({ allocated_amount: newAllocated }).eq("id", item.envelope.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-envelopes"] });
      setApplyDialog(false); setApplyAmount("");
      toast.success("Distribuição aplicada aos envelopes!");
    },
    onError: () => toast.error("Erro ao aplicar distribuição."),
  });

  if (loadingAccounts) return <div className="text-muted-foreground p-6">Carregando contas...</div>;

  return (
    <div className="space-y-8">
      {/* ═══════════ SEÇÃO: MINHAS CONTAS ═══════════ */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Minhas Contas</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => {
              setSaqueForm({ ...emptyTransferForm, category: "Saque de Plataforma" });
              setSaqueDialog(true);
            }}>
              <ArrowDownToLine className="h-4 w-4 mr-2" />Registrar Saque de Plataforma
            </Button>
            <Button variant="outline" onClick={() => { setTransferForm(emptyTransferForm); setTransferDialog(true); }}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />Registrar Transferência
            </Button>
            <Button onClick={() => { setAccountForm(emptyAccountForm); setAccountDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Nova Conta
            </Button>
          </div>
        </div>

        {/* Saldo Total Bancário */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total Contas Bancárias</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalBalance >= 0 ? "text-success" : "text-destructive"}`}>
              R$ {totalBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map((acc) => (
            <Card key={acc.id} className={`relative overflow-hidden ${!acc.is_active ? "opacity-50" : ""}`}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">{acc.name}</h3>
                  <Badge variant="outline" className="text-xs">{acc.type.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{acc.owner}</p>
                <p className={`text-xl font-bold ${(acc.computedBalance ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {(acc.computedBalance ?? 0).toFixed(2)}
                </p>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setAccountForm({ id: acc.id, name: acc.name, type: acc.type, owner: acc.owner, color: acc.color, balance: String(acc.balance) });
                    setAccountDialog(true);
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`h-8 w-8 ${acc.is_active ? "text-success" : "text-muted-foreground"}`} onClick={() => toggleAccountMutation.mutate(acc)}>
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ SALDO EM PLATAFORMAS ═══ */}
        {platformAccounts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-primary" /> Saldo em Plataformas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total a Sacar */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground font-medium">💸 Total a Sacar</p>
                  <p className="text-2xl font-bold text-warning mt-1">
                    R$ {totalPlatformBalance.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Dinheiro ainda nas plataformas</p>
                </CardContent>
              </Card>
              {platformAccounts.map((acc) => (
                <Card key={acc.id} className={`relative overflow-hidden ${!acc.is_active ? "opacity-50" : ""}`}>
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{acc.name}</h3>
                      <Badge variant="outline" className="text-xs">PLATAFORMA</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{acc.owner}</p>
                    <p className={`text-xl font-bold ${(acc.computedBalance ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                      R$ {(acc.computedBalance ?? 0).toFixed(2)}
                    </p>
                    <div className="flex gap-1 pt-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setAccountForm({ id: acc.id, name: acc.name, type: acc.type, owner: acc.owner, color: acc.color, balance: String(acc.balance) });
                        setAccountDialog(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${acc.is_active ? "text-success" : "text-muted-foreground"}`} onClick={() => toggleAccountMutation.mutate(acc)}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Transfer History */}
        {transfers.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Últimas Transferências</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>De</TableHead>
                      <TableHead>Para</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((t: any) => {
                      const from = accountMap.get(t.from_account_id);
                      const to = accountMap.get(t.to_account_id);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="whitespace-nowrap">{format(parseISO(t.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: from?.color || "#999" }} />
                              {from?.name || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: to?.color || "#999" }} />
                              {to?.name || "—"}
                            </span>
                          </TableCell>
                          <TableCell>{t.category || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{t.description || "—"}</TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(t.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTransferMutation.mutate(t.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      {/* ═══════════ SEÇÃO: ENVELOPES ═══════════ */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Envelopes</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pjEsposa && (
              <>
                <Button variant="outline" onClick={openDistDialog}>
                  <Settings2 className="h-4 w-4 mr-2" />Configurar Distribuição
                </Button>
                <Button variant="outline" onClick={() => setApplyDialog(true)}>
                  <Play className="h-4 w-4 mr-2" />Aplicar Distribuição
                </Button>
              </>
            )}
            <Button onClick={() => { setEnvelopeForm(emptyEnvelopeForm); setEnvelopeDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Novo Envelope
            </Button>
          </div>
        </div>

        {/* Envelopes grouped by account + Free Money */}
        {Array.from(groupedEnvelopes.entries()).map(([accountId, envs]) => {
          const acc = accountMap.get(accountId);
          const freeMoney = freeMoneyByAccount.get(accountId) || 0;
          return (
            <div key={accountId} className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: acc?.color || "#999" }} />
                {acc?.name || "Conta desconhecida"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Free Money Card */}
                <Card className="relative overflow-hidden border-success/30 bg-success/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-success" />
                  <CardContent className="pt-5 space-y-2">
                    <h4 className="font-semibold text-sm">💰 Dinheiro Livre</h4>
                    <p className={`text-xl font-bold ${freeMoney >= 0 ? "text-success" : "text-destructive"}`}>
                      R$ {freeMoney.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo - envelopes alocados</p>
                  </CardContent>
                </Card>

                {/* Envelope Cards */}
                {envs.map((env) => {
                  const pct = env.target_amount > 0 ? Math.min(100, (Number(env.allocated_amount) / Number(env.target_amount)) * 100) : 0;
                  const rule = distRules.find((r) => r.envelope_id === env.id);
                  return (
                    <Card key={env.id} className={`relative overflow-hidden ${!env.is_active ? "opacity-50" : ""}`}>
                      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: env.color }} />
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{env.name}</h4>
                          <div className="flex items-center gap-1">
                            {rule && <Badge variant="secondary" className="text-[10px]">{rule.percentage}%</Badge>}
                            <Badge variant="outline" className="text-[10px]">{env.is_active ? "Ativo" : "Inativo"}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>R$ {Number(env.allocated_amount).toFixed(2)}</span>
                            {env.target_amount > 0 && <span>Meta: R$ {Number(env.target_amount).toFixed(2)}</span>}
                          </div>
                          {env.target_amount > 0 && <Progress value={pct} className="h-2" />}
                        </div>
                        <div className="flex gap-1 pt-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEnvelopeForm({ id: env.id, name: env.name, account_id: env.account_id, allocated_amount: String(env.allocated_amount), target_amount: String(env.target_amount), color: env.color });
                            setEnvelopeDialog(true);
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className={`h-7 w-7 ${env.is_active ? "text-success" : "text-muted-foreground"}`} onClick={() => toggleEnvelopeMutation.mutate(env)}>
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {envelopes.length === 0 && (
          <p className="text-center text-muted-foreground py-10">Nenhum envelope criado ainda.</p>
        )}
      </section>

      {/* ═══════════ DIALOGS ═══════════ */}

      {/* Account Dialog */}
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{accountForm.id ? "Editar Conta" : "Nova Conta"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveAccountMutation.mutate(accountForm); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={accountForm.type} onValueChange={(v: any) => setAccountForm({ ...accountForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="pf">PF</SelectItem>
                    <SelectItem value="plataforma">Plataforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titular</Label>
                <Input value={accountForm.owner} onChange={(e) => setAccountForm({ ...accountForm, owner: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Saldo da Conta</Label>
                <Input type="number" step="0.01" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={accountForm.color} onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={accountForm.color} onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAccountDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveAccountMutation.isPending}>{saveAccountMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Transferência</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveTransferMutation.mutate(transferForm); }} className="space-y-4">
            <div>
              <Label>De (conta origem)</Label>
              <Select value={transferForm.from_account_id} onValueChange={(v) => setTransferForm({ ...transferForm, from_account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name} (R$ {Number(a.balance).toFixed(2)})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Para (conta destino)</Label>
              <Select value={transferForm.to_account_id} onValueChange={(v) => setTransferForm({ ...transferForm, to_account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeAccounts.filter((a) => a.id !== transferForm.from_account_id).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" min="0.01" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={transferForm.category} onValueChange={(v) => setTransferForm({ ...transferForm, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {transferCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} placeholder="Ex: Pró-labore março" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveTransferMutation.isPending}>{saveTransferMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Envelope Dialog */}
      <Dialog open={envelopeDialog} onOpenChange={setEnvelopeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{envelopeForm.id ? "Editar Envelope" : "Novo Envelope"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveEnvelopeMutation.mutate(envelopeForm); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={envelopeForm.name} onChange={(e) => setEnvelopeForm({ ...envelopeForm, name: e.target.value })} required />
            </div>
            <div>
              <Label>Conta vinculada</Label>
              <Select value={envelopeForm.account_id} onValueChange={(v) => setEnvelopeForm({ ...envelopeForm, account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor alocado</Label>
                <Input type="number" step="0.01" min="0" value={envelopeForm.allocated_amount} onChange={(e) => setEnvelopeForm({ ...envelopeForm, allocated_amount: e.target.value })} />
              </div>
              <div>
                <Label>Meta</Label>
                <Input type="number" step="0.01" min="0" value={envelopeForm.target_amount} onChange={(e) => setEnvelopeForm({ ...envelopeForm, target_amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={envelopeForm.color} onChange={(e) => setEnvelopeForm({ ...envelopeForm, color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={envelopeForm.color} onChange={(e) => setEnvelopeForm({ ...envelopeForm, color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEnvelopeDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveEnvelopeMutation.isPending}>{saveEnvelopeMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Distribution Config Dialog */}
      <Dialog open={distDialog} onOpenChange={setDistDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Configurar Distribuição (PJ Esposa)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Defina o percentual de cada envelope. A soma deve totalizar 100%.</p>
            <div className="space-y-3">
              {pjEsposaEnvelopes.map((env) => (
                <div key={env.id} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: env.color }} />
                  <span className="text-sm flex-1 truncate">{env.name}</span>
                  <div className="flex items-center gap-1 w-24">
                    <Input
                      type="number" step="1" min="0" max="100"
                      value={distPercentages[env.id] || "0"}
                      onChange={(e) => setDistPercentages({ ...distPercentages, [env.id]: e.target.value })}
                      className="h-8 text-right"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={`text-sm font-medium text-right ${Math.abs(distTotal - 100) < 0.01 ? "text-success" : "text-destructive"}`}>
              Total: {distTotal.toFixed(0)}%
              {Math.abs(distTotal - 100) >= 0.01 && <span className="ml-2 text-xs">(deve ser 100%)</span>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDistDialog(false)}>Cancelar</Button>
              <Button
                disabled={Math.abs(distTotal - 100) >= 0.01 || saveDistMutation.isPending}
                onClick={() => saveDistMutation.mutate(distPercentages)}
              >
                {saveDistMutation.isPending ? "Salvando..." : "Salvar Distribuição"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply Distribution Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Aplicar Distribuição</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor de entrada (PAD recebido)</Label>
              <Input
                type="number" step="0.01" min="0"
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder="Ex: 1500.00"
              />
            </div>
            {applyPreview.length > 0 && Number(applyAmount) > 0 && (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                <p className="text-sm font-medium mb-2">Prévia da distribuição:</p>
                {applyPreview.map((item) => (
                  <div key={item.envelope.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.envelope.color }} />
                      {item.envelope.name} ({item.percentage}%)
                    </span>
                    <span className="font-medium">R$ {item.value.toFixed(2)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>R$ {applyPreview.reduce((s, i) => s + i.value, 0).toFixed(2)}</span>
                </div>
              </div>
            )}
            {applyPreview.length === 0 && (
              <p className="text-sm text-muted-foreground">Configure a distribuição primeiro.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setApplyDialog(false)}>Cancelar</Button>
              <Button
                disabled={applyPreview.length === 0 || !Number(applyAmount) || applyDistMutation.isPending}
                onClick={() => applyDistMutation.mutate()}
              >
                {applyDistMutation.isPending ? "Aplicando..." : "Confirmar e Aplicar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saque de Plataforma Dialog */}
      <Dialog open={saqueDialog} onOpenChange={setSaqueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Saque de Plataforma</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveSaqueMutation.mutate(saqueForm); }} className="space-y-4">
            <div>
              <Label>Conta origem (Plataforma)</Label>
              <Select value={saqueForm.from_account_id} onValueChange={(v) => setSaqueForm({ ...saqueForm, from_account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
                <SelectContent>
                  {activePlatformAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name} (R$ {Number(a.balance).toFixed(2)})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta destino (Bancária)</Label>
              <Select value={saqueForm.to_account_id} onValueChange={(v) => setSaqueForm({ ...saqueForm, to_account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta bancária" /></SelectTrigger>
                <SelectContent>
                  {activeBankAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" min="0.01" value={saqueForm.amount} onChange={(e) => setSaqueForm({ ...saqueForm, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={saqueForm.date} onChange={(e) => setSaqueForm({ ...saqueForm, date: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input value={saqueForm.description} onChange={(e) => setSaqueForm({ ...saqueForm, description: e.target.value })} placeholder="Ex: Saque quinzenal Keed" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSaqueDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveSaqueMutation.isPending}>{saveSaqueMutation.isPending ? "Salvando..." : "Registrar Saque"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
