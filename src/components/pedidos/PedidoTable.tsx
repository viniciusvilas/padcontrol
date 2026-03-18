import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { statusStyle } from "@/lib/constants";
import type { Pedido } from "@/hooks/usePedidos";

interface Props {
  pedidos: Pedido[];
  isLoading: boolean;
  onEdit: (pedido: Pedido) => void;
  onDelete: (id: string) => void;
  onToggleField: (pedido: Pedido, field: "pedido_chegou" | "ja_foi_chamado" | "cliente_cobrado" | "pedido_pago" | "pedido_perdido") => void;
  onPagar: (pedido: Pedido) => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(text); toast.success(`${label} copiado!`); }}>
      <Copy className="h-3 w-3" />
    </Button>
  );
}

export default function PedidoTable({ pedidos, isLoading, onEdit, onDelete, onToggleField, onPagar }: Props) {
  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Previsão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Rastreio</TableHead>
            <TableHead>Chegou</TableHead>
            <TableHead>Chamado</TableHead>
            <TableHead>Cobrado</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Perdido</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : pedidos.length === 0 ? (
            <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
          ) : (
            pedidos.map((p, i) => (
              <TableRow key={p.id} className={i % 2 === 0 ? "bg-accent/30" : ""}>
                <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{p.cliente}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    {p.cpf || "—"}
                    {p.cpf && <CopyButton text={p.cpf} label="CPF" />}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    {p.telefone || "—"}
                    {p.telefone && <CopyButton text={p.telefone} label="Telefone" />}
                  </span>
                </TableCell>
                <TableCell>{p.produto}</TableCell>
                <TableCell className="whitespace-nowrap">
                  R$ {Number(p.valor).toFixed(2)}
                  {p.pedido_pago && p.valor_pago > 0 && p.valor_pago !== p.valor && (
                    <span className="block text-xs text-muted-foreground">(pago: R$ {Number(p.valor_pago).toFixed(2)})</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.plataforma === "Five" ? "bg-amber-500/15 text-amber-700 border-amber-200" : "bg-blue-500/15 text-blue-700 border-blue-200"}>
                    {p.plataforma}
                  </Badge>
                </TableCell>
                <TableCell>{p.prazo}d</TableCell>
                <TableCell className="whitespace-nowrap">{p.previsao_entrega || "—"}</TableCell>
                <TableCell><Badge variant="outline" className={statusStyle(p.status)}>{p.status}</Badge></TableCell>
                <TableCell>{p.estado || "—"}</TableCell>
                <TableCell>{p.local_entrega || "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {p.rastreio ? (
                    <span className="flex items-center gap-1">
                      {p.rastreio.startsWith("http") ? (
                        <a href={p.rastreio} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Rastrear</a>
                      ) : p.rastreio}
                      <CopyButton text={p.rastreio} label="Link" />
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell><Checkbox checked={p.pedido_chegou} onCheckedChange={() => onToggleField(p, "pedido_chegou")} /></TableCell>
                <TableCell><Checkbox checked={p.ja_foi_chamado} onCheckedChange={() => onToggleField(p, "ja_foi_chamado")} /></TableCell>
                <TableCell><Checkbox checked={p.cliente_cobrado} onCheckedChange={() => onToggleField(p, "cliente_cobrado")} /></TableCell>
                <TableCell>
                  <Checkbox checked={p.pedido_pago} onCheckedChange={(checked) => {
                    if (checked) onPagar(p);
                    else onToggleField(p, "pedido_pago");
                  }} />
                </TableCell>
                <TableCell><Checkbox checked={p.pedido_perdido} onCheckedChange={() => onToggleField(p, "pedido_perdido")} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
