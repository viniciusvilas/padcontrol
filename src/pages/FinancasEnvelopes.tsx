import { useState, useMemo } from "react";
import { Wallet2, Plus, Pencil, Power } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Envelope {
  id: string;
  user_id: string;
  name: string;
  account_id: string;
  allocated_amount: number;
  target_amount: number;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

interface EnvelopeForm {
  id?: string;
  name: string;
  account_id: string;
  allocated_amount: string;
  target_amount: string;
  color: string;
}

const emptyForm: EnvelopeForm = { name: "", account_id: "", allocated_amount: "0", target_amount: "0", color: "#6366f1" };

export default function FinancasEnvelopes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { activeAccounts, accounts } = useFinanceAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EnvelopeForm>(emptyForm);

  const { data: envelopes = [], isLoading } = useQuery({
    queryKey: ["finance-envelopes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_envelopes")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as unknown as Envelope[];
    },
    enabled: !!user,
  });

  const accountMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    accounts.forEach((a) => m.set(a.id, { name: a.name, color: a.color }));
    return m;
  }, [accounts]);

  const saveMutation = useMutation({
    mutationFn: async (f: EnvelopeForm) => {
      const payload = {
        user_id: user!.id,
        name: f.name,
        account_id: f.account_id,
        allocated_amount: Number(f.allocated_amount),
        target_amount: Number(f.target_amount),
        color: f.color,
      };
      if (f.id) {
        const { error } = await supabase.from("finance_envelopes").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_envelopes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-envelopes"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Envelope salvo!");
    },
    onError: () => toast.error("Erro ao salvar envelope."),
  });

  const toggleMutation = useMutation({
    mutationFn: async (env: Envelope) => {
      const { error } = await supabase.from("finance_envelopes").update({ is_active: !env.is_active }).eq("id", env.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-envelopes"] });
      toast.success("Status atualizado!");
    },
  });

  const openEdit = (env: Envelope) => {
    setForm({
      id: env.id,
      name: env.name,
      account_id: env.account_id,
      allocated_amount: String(env.allocated_amount),
      target_amount: String(env.target_amount),
      color: env.color,
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando envelopes...</div>;

  const totalAllocated = envelopes.filter((e) => e.is_active).reduce((s, e) => s + Number(e.allocated_amount), 0);

  // Group envelopes by account
  const grouped = useMemo(() => {
    const map = new Map<string, Envelope[]>();
    envelopes.forEach((e) => {
      if (!map.has(e.account_id)) map.set(e.account_id, []);
      map.get(e.account_id)!.push(e);
    });
    return map;
  }, [envelopes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Envelopes</h1>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo Envelope
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Alocado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">R$ {totalAllocated.toFixed(2)}</div>
        </CardContent>
      </Card>

      {Array.from(grouped.entries()).map(([accountId, envs]) => {
        const acc = accountMap.get(accountId);
        return (
          <div key={accountId} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: acc?.color || "#999" }} />
              {acc?.name || "Conta desconhecida"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {envs.map((env) => {
                const pct = env.target_amount > 0 ? Math.min(100, (Number(env.allocated_amount) / Number(env.target_amount)) * 100) : 0;
                return (
                  <Card key={env.id} className={`relative overflow-hidden ${!env.is_active ? "opacity-50" : ""}`}>
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: env.color }} />
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{env.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {env.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>R$ {Number(env.allocated_amount).toFixed(2)}</span>
                          <span>Meta: R$ {Number(env.target_amount).toFixed(2)}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(env)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${env.is_active ? "text-success" : "text-muted-foreground"}`}
                          onClick={() => toggleMutation.mutate(env)}
                        >
                          <Power className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Envelope" : "Novo Envelope"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Conta vinculada</Label>
              <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
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
                <Input type="number" step="0.01" min="0" value={form.allocated_amount} onChange={(e) => setForm({ ...form, allocated_amount: e.target.value })} />
              </div>
              <div>
                <Label>Meta</Label>
                <Input type="number" step="0.01" min="0" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
