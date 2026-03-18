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
import { formatCPF, generateRastreioKeed, calcPrevisao } from "@/lib/pedidoUtils";
import { STATUS_OPTIONS, PRODUTO_OPTIONS, ESTADOS_BR } from "@/lib/constants";
import type { Pedido } from "@/hooks/usePedidos";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pedido?: Pedido | null;
}

const defaultPrazo = "15";
const defaultData = new Date().toISOString().slice(0, 10);

const defaultForm = {
  cliente: "", cpf: "", valor: "", produto: "", telefone: "", local_entrega: "",
  prazo: defaultPrazo, data: defaultData, previsao_entrega: calcPrevisao(defaultData, defaultPrazo),
  status: "criado", plataforma: "Five", rastreio: "", estado: "", observacoes: "",
  pedido_chegou: false, ja_foi_chamado: false, cliente_cobrado: false,
  pedido_pago: false, pedido_perdido: false, data_entrega: "",
};

export default function PedidoFormDialog({ open, onOpenChange, onSuccess, pedido }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = !!pedido;

  useEffect(() => {
    if (pedido) {
      setForm({
        cliente: pedido.cliente, cpf: pedido.cpf || "", valor: String(pedido.valor),
        produto: pedido.produto, telefone: pedido.telefone || "", local_entrega: pedido.local_entrega || "",
        prazo: String(pedido.prazo), data: pedido.data, previsao_entrega: pedido.previsao_entrega || "",
        status: pedido.status, plataforma: pedido.plataforma, rastreio: pedido.rastreio || "",
        estado: pedido.estado || "", observacoes: pedido.observacoes || "",
        pedido_chegou: pedido.pedido_chegou, ja_foi_chamado: pedido.ja_foi_chamado,
        cliente_cobrado: pedido.cliente_cobrado, pedido_pago: pedido.pedido_pago,
        pedido_perdido: pedido.pedido_perdido, data_entrega: pedido.data_entrega || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [pedido, open]);

  const set = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "cpf") next.cpf = formatCPF(value);
      if (key === "data" || key === "prazo") {
        next.previsao_entrega = calcPrevisao(
          key === "data" ? value : prev.data,
          key === "prazo" ? value : prev.prazo
        );
      }
      if (key === "pedido_chegou" && value && !prev.data_entrega) {
        next.data_entrega = new Date().toISOString().split("T")[0];
      }
      if (key === "cpf" || key === "plataforma") {
        const cpf = key === "cpf" ? next.cpf : prev.cpf;
        const plat = key === "plataforma" ? value : prev.plataforma;
        if (plat === "Keed") next.rastreio = generateRastreioKeed(cpf, plat);
      }
      if (key === "plataforma" && next.produto) {
        const options = PRODUTO_OPTIONS[value] || PRODUTO_OPTIONS["Five"];
        const found = options.find((p) => p.value === next.produto);
        if (found) next.valor = String(found.preco);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Você precisa estar logado.");
    if (!form.cliente.trim()) return toast.error("Nome do cliente é obrigatório.");
    if (!form.produto.trim()) return toast.error("Produto é obrigatório.");

    const valor = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valor) || valor < 0) return toast.error("Valor inválido.");

    setLoading(true);
    try {
      const payload = {
        cliente: form.cliente.trim(), cpf: form.cpf.trim() || null, valor,
        produto: form.produto.trim(), telefone: form.telefone.trim() || null,
        local_entrega: form.local_entrega.trim() || null, prazo: parseInt(form.prazo) || 15,
        data: form.data || defaultData, previsao_entrega: form.previsao_entrega || null,
        status: form.status, plataforma: form.plataforma || "Five",
        rastreio: form.rastreio.trim() || null, estado: form.estado.trim() || null,
        observacoes: form.observacoes.trim() || null,
        pedido_chegou: form.pedido_chegou, ja_foi_chamado: form.ja_foi_chamado,
        cliente_cobrado: form.cliente_cobrado, pedido_pago: form.pedido_pago,
        pedido_perdido: form.pedido_perdido,
        data_entrega: form.pedido_chegou ? (form.data_entrega || new Date().toISOString().split("T")[0]) : null,
      };

      if (isEdit && pedido) {
        const { error } = await supabase.from("pedidos").update(payload).eq("id", pedido.id);
        if (error) throw error;
        toast.success("Pedido atualizado!");
      } else {
        const { error } = await supabase.from("pedidos").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Pedido criado!");
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
      <DialogContent key={open ? "open" : "closed"} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input id="cliente" value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Nome do cliente" />
            </div>

            <div className="space-y-1.5">
              <Label>Plataforma</Label>
              <Select value={form.plataforma} onValueChange={(v) => set("plataforma", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent modal={false} position="popper" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <SelectItem value="Five">Five (frete R$35,50)</SelectItem>
                  <SelectItem value="Keed">Keed (frete grátis)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Produto *</Label>
              <Select
                value={form.produto || undefined}
                onValueChange={(v) => {
                  const options = PRODUTO_OPTIONS[form.plataforma] || PRODUTO_OPTIONS["Five"];
                  const found = options.find((p) => p.value === v);
                  setForm((prev) => ({ ...prev, produto: v, valor: found ? String(found.preco) : prev.valor }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent modal={false} position="popper" onCloseAutoFocus={(e) => e.preventDefault()}>
                  {(PRODUTO_OPTIONS[form.plataforma] || PRODUTO_OPTIONS["Five"]).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label} — R$ {p.preco.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0.00" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prazo">Prazo (dias úteis)</Label>
              <Input id="prazo" type="number" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Previsão de Entrega (auto)</Label>
              <Input type="date" value={form.previsao_entrega} readOnly className="bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label>Local de Entrega</Label>
              <Select value={form.local_entrega || "none"} onValueChange={(v) => set("local_entrega", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent modal={false} position="popper" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <SelectItem value="none">Não informado</SelectItem>
                  <SelectItem value="CASA">Casa</SelectItem>
                  <SelectItem value="CORREIOS">Correios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent modal={false} position="popper" onCloseAutoFocus={(e) => e.preventDefault()}>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estado (UF)</Label>
              <Select value={form.estado || "none"} onValueChange={(v) => set("estado", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent modal={false} position="popper" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <SelectItem value="none">Não informado</SelectItem>
                  {ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rastreio">Código de Rastreio</Label>
              <Input
                id="rastreio" value={form.rastreio}
                onChange={(e) => set("rastreio", e.target.value)}
                readOnly={form.plataforma === "Keed"}
                className={form.plataforma === "Keed" ? "bg-muted" : ""}
              />
              {form.plataforma === "Keed" && <p className="text-xs text-muted-foreground">Gerado automaticamente pelo CPF</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="data_entrega">Data de Entrega</Label>
              <Input id="data_entrega" type="date" value={form.data_entrega} onChange={(e) => set("data_entrega", e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={2} />
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
              {[
                { key: "pedido_chegou", label: "Pedido chegou" },
                { key: "ja_foi_chamado", label: "Já foi chamado" },
                { key: "cliente_cobrado", label: "Cliente cobrado" },
                { key: "pedido_pago", label: "Pedido pago" },
                { key: "pedido_perdido", label: "Pedido perdido" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={(form as any)[key]} onCheckedChange={(v) => set(key, !!v)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
