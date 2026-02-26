import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pedido?: Pedido | null; // null = create, pedido = edit
}

const STATUS_OPTIONS = [
  { value: "criado", label: "Criado" },
  { value: "aguardando", label: "Aguardando" },
  { value: "em_cobranca", label: "Em Cobrança" },
  { value: "pago", label: "Pago" },
  { value: "perdido", label: "Perdido" },
];

const defaultForm = {
  cliente: "",
  valor: "",
  produto: "",
  telefone: "",
  local_entrega: "",
  prazo: "15",
  data: new Date().toISOString().slice(0, 10),
  previsao_entrega: "",
  status: "criado",
  plataforma: "Five",
  rastreio: "",
  estado: "",
  observacoes: "",
  pedido_chegou: false,
  ja_foi_chamado: false,
  cliente_cobrado: false,
  pedido_pago: false,
  pedido_perdido: false,
};

export default function PedidoFormDialog({ open, onOpenChange, onSuccess, pedido }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = !!pedido;

  useEffect(() => {
    if (pedido) {
      setForm({
        cliente: pedido.cliente,
        valor: String(pedido.valor),
        produto: pedido.produto,
        telefone: pedido.telefone || "",
        local_entrega: pedido.local_entrega || "",
        prazo: String(pedido.prazo),
        data: pedido.data,
        previsao_entrega: pedido.previsao_entrega || "",
        status: pedido.status,
        plataforma: pedido.plataforma,
        rastreio: pedido.rastreio || "",
        estado: pedido.estado || "",
        observacoes: pedido.observacoes || "",
        pedido_chegou: pedido.pedido_chegou,
        ja_foi_chamado: pedido.ja_foi_chamado,
        cliente_cobrado: pedido.cliente_cobrado,
        pedido_pago: pedido.pedido_pago,
        pedido_perdido: pedido.pedido_perdido,
      });
    } else {
      setForm(defaultForm);
    }
  }, [pedido, open]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!user) return toast.error("Você precisa estar logado.");
    if (!form.cliente.trim()) return toast.error("Nome do cliente é obrigatório.");
    if (!form.produto.trim()) return toast.error("Produto é obrigatório.");

    const valor = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valor) || valor < 0) return toast.error("Valor inválido.");

    setLoading(true);
    try {
      const payload = {
        cliente: form.cliente.trim(),
        valor,
        produto: form.produto.trim(),
        telefone: form.telefone.trim() || null,
        local_entrega: form.local_entrega.trim() || null,
        prazo: parseInt(form.prazo) || 15,
        data: form.data || new Date().toISOString().slice(0, 10),
        previsao_entrega: form.previsao_entrega || null,
        status: form.status,
        plataforma: form.plataforma || "Five",
        rastreio: form.rastreio.trim() || null,
        estado: form.estado.trim() || null,
        observacoes: form.observacoes.trim() || null,
        pedido_chegou: form.pedido_chegou,
        ja_foi_chamado: form.ja_foi_chamado,
        cliente_cobrado: form.cliente_cobrado,
        pedido_pago: form.pedido_pago,
        pedido_perdido: form.pedido_perdido,
      };

      if (isEdit && pedido) {
        const { error } = await supabase.from("pedidos").update(payload).eq("id", pedido.id);
        if (error) throw error;
        toast.success("Pedido atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("pedidos").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Pedido criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="cliente">Cliente *</Label>
            <Input id="cliente" value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Nome do cliente" />
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input id="valor" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0.00" />
          </div>

          {/* Produto */}
          <div className="space-y-1.5">
            <Label htmlFor="produto">Produto *</Label>
            <Input id="produto" value={form.produto} onChange={(e) => set("produto", e.target.value)} placeholder="Ex: T1, T2, T3" />
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <Label htmlFor="prazo">Prazo (dias úteis)</Label>
            <Input id="prazo" type="number" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} />
          </div>

          {/* Previsão de entrega */}
          <div className="space-y-1.5">
            <Label htmlFor="previsao_entrega">Previsão de Entrega</Label>
            <Input id="previsao_entrega" type="date" value={form.previsao_entrega} onChange={(e) => set("previsao_entrega", e.target.value)} />
          </div>

          {/* Local de entrega */}
          <div className="space-y-1.5">
            <Label htmlFor="local_entrega">Local de Entrega</Label>
            <Select value={form.local_entrega || "none"} onValueChange={(v) => set("local_entrega", v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informado</SelectItem>
                <SelectItem value="CASA">Casa</SelectItem>
                <SelectItem value="CORREIOS">Correios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plataforma */}
          <div className="space-y-1.5">
            <Label htmlFor="plataforma">Plataforma</Label>
            <Input id="plataforma" value={form.plataforma} onChange={(e) => set("plataforma", e.target.value)} placeholder="Five" />
          </div>

          {/* Rastreio */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rastreio">Código de Rastreio</Label>
            <Input id="rastreio" value={form.rastreio} onChange={(e) => set("rastreio", e.target.value)} placeholder="Código de rastreio" />
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label htmlFor="estado">Estado (UF)</Label>
            <Input id="estado" value={form.estado} onChange={(e) => set("estado", e.target.value)} placeholder="SP" maxLength={2} />
          </div>

          {/* Observações */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Notas adicionais..." rows={2} />
          </div>

          {/* Checkboxes */}
          <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
            {[
              { key: "pedido_chegou", label: "Pedido chegou" },
              { key: "ja_foi_chamado", label: "Já foi chamado" },
              { key: "cliente_cobrado", label: "Cliente cobrado" },
              { key: "pedido_pago", label: "Pedido pago" },
              { key: "pedido_perdido", label: "Pedido perdido" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={(form as any)[key]}
                  onCheckedChange={(v) => set(key, !!v)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
