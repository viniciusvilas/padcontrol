import { useState } from "react";
import { Building2, Plus, Pencil, Power } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAccounts, FinanceAccount } from "@/hooks/useFinanceAccounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface AccountForm {
  id?: string;
  name: string;
  type: "pj" | "pf";
  owner: string;
  color: string;
  balance: string;
}

const emptyForm: AccountForm = { name: "", type: "pf", owner: "", color: "#6366f1", balance: "0" };

export default function FinancasContas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { accounts, isLoading } = useFinanceAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AccountForm>(emptyForm);

  const saveMutation = useMutation({
    mutationFn: async (f: AccountForm) => {
      const payload = {
        user_id: user!.id,
        name: f.name,
        type: f.type,
        owner: f.owner,
        color: f.color,
        balance: Number(f.balance),
      };
      if (f.id) {
        const { error } = await supabase.from("finance_accounts").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finance_accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-accounts"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Conta salva!");
    },
    onError: () => toast.error("Erro ao salvar conta."),
  });

  const toggleMutation = useMutation({
    mutationFn: async (acc: FinanceAccount) => {
      const { error } = await supabase.from("finance_accounts").update({ is_active: !acc.is_active }).eq("id", acc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-accounts"] });
      toast.success("Status atualizado!");
    },
  });

  const openEdit = (acc: FinanceAccount) => {
    setForm({ id: acc.id, name: acc.name, type: acc.type, owner: acc.owner, color: acc.color, balance: String(acc.balance) });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando contas...</div>;

  const totalBalance = accounts.filter((a) => a.is_active).reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Contas Financeiras</h1>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Nova Conta
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalBalance >= 0 ? "text-success" : "text-destructive"}`}>
            R$ {totalBalance.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className={`relative overflow-hidden ${!acc.is_active ? "opacity-50" : ""}`}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">{acc.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {acc.type.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{acc.owner}</p>
              <p className={`text-xl font-bold ${Number(acc.balance) >= 0 ? "text-success" : "text-destructive"}`}>
                R$ {Number(acc.balance).toFixed(2)}
              </p>
              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acc)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${acc.is_active ? "text-success" : "text-muted-foreground"}`}
                  onClick={() => toggleMutation.mutate(acc)}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="pf">PF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titular</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Saldo</Label>
                <Input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                </div>
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
