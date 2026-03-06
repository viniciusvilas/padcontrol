import { useState } from "react";
import { Tags, Plus, Pencil, Power } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceCategories, type FinanceCategory } from "@/hooks/useFinanceCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CatForm {
  id?: string;
  name: string;
  type: "income" | "expense" | "both";
  color: string;
}

const emptyForm: CatForm = { name: "", type: "expense", color: "#6366f1" };

const typeLabels: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
  both: "Ambos",
};

const typeColors: Record<string, string> = {
  income: "bg-success/15 text-success border-success/30",
  expense: "bg-destructive/15 text-destructive border-destructive/30",
  both: "bg-primary/15 text-primary border-primary/30",
};

export default function FinancasCategorias() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { categories, isLoading } = useFinanceCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CatForm>(emptyForm);

  const saveMutation = useMutation({
    mutationFn: async (f: CatForm) => {
      if (f.id) {
        const { error } = await supabase
          .from("finance_categories")
          .update({ name: f.name, type: f.type, color: f.color } as any)
          .eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("finance_categories")
          .insert({ user_id: user!.id, name: f.name, type: f.type, color: f.color } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-categories"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Categoria salva!");
    },
    onError: () => toast.error("Erro ao salvar categoria."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("finance_categories")
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-categories"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const openEdit = (cat: FinanceCategory) => {
    setForm({ id: cat.id, name: cat.name, type: cat.type, color: cat.color });
    setDialogOpen(true);
  };

  const openNew = () => { setForm(emptyForm); setDialogOpen(true); };

  if (isLoading) return <div className="text-muted-foreground p-6">Carregando categorias...</div>;

  const active = categories.filter((c) => c.is_active);
  const inactive = categories.filter((c) => !c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Tags className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Categorias</h1>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
      </div>

      {/* Active */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias Ativas ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma categoria ativa.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {active.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onToggle={toggleMutation.mutate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive */}
      {inactive.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Inativas ({inactive.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inactive.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onToggle={toggleMutation.mutate} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Alimentação" required />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded border border-input cursor-pointer"
                />
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

function CategoryCard({
  cat,
  onEdit,
  onToggle,
}: {
  cat: FinanceCategory;
  onEdit: (c: FinanceCategory) => void;
  onToggle: (p: { id: string; is_active: boolean }) => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${cat.is_active ? "border-border" : "border-border/50 opacity-60"}`}>
      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{cat.name}</p>
        <Badge variant="outline" className={`text-[10px] mt-1 ${typeColors[cat.type]}`}>
          {typeLabels[cat.type]}
        </Badge>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(cat)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Switch
          checked={cat.is_active}
          onCheckedChange={(v) => onToggle({ id: cat.id, is_active: v })}
          className="scale-75"
        />
      </div>
    </div>
  );
}
