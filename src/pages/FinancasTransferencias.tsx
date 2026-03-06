import { useState, useMemo } from "react";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAccounts } from "@/hooks/useFinanceAccounts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface TransferForm {
  from_account_id: string;
  to_account_id: string;
  amount: string;
  date: string;
  description: string;
  category: string;
}

const emptyForm: TransferForm = {
  from_account_id: "",
  to_account_id: "",
  amount: "",
  date: format(new Date(), "yyyy-MM-dd"),
  description: "",
  category: "",
};

const transferCategories = ["Pró-labore", "Aporte", "Operacional", "Investimento", "Outro"];

export default function FinancasTransferencias() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { activeAccounts, accounts } = useFinanceAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TransferForm>(emptyForm);

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["finance-transfers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transfers")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const accountMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    accounts.forEach((a) => m.set(a.id, { name: a.name, color: a.color }));
    return m;
  }, [accounts]);

  const saveMutation = useMutation({
    mutationFn: async (f: TransferForm) => {
      if (f.from_account_id === f.to_account_id) throw new Error("Contas devem ser diferentes");
      const { error } = await supabase.from("finance_transfers").insert({
        user_id: user!.id,
        from_account_id: f.from_account_id,
        to_account_id: f.to_account_id,
        amount: Number(f.amount),
        date: f.date,
        description: f.description,
        category: f.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-transfers"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Transferência registrada!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar transferência."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_transfers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-transfers"] });
      toast.success("Transferência excluída!");
    },
  });

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando transferências...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Transferências</h1>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Nova Transferência
        </Button>
      </div>

      <Card>
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
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhuma transferência registrada.</TableCell>
                  </TableRow>
                ) : transfers.map((t: any) => {
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transferência</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>De (conta origem)</Label>
              <Select value={form.from_account_id} onValueChange={(v) => setForm({ ...form, from_account_id: v })}>
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
            <div>
              <Label>Para (conta destino)</Label>
              <Select value={form.to_account_id} onValueChange={(v) => setForm({ ...form, to_account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeAccounts.filter((a) => a.id !== form.from_account_id).map((a) => (
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
                <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {transferCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Pró-labore março" />
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
