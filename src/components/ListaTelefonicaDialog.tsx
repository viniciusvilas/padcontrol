import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Copy, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function fixPhone(raw: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.slice(0, 2) + "9" + digits.slice(2);
  }
  return digits;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ListaTelefonicaDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [lista, setLista] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGerar = async () => {
    if (!date || !user) return;
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("pedidos")
      .select("cliente, telefone")
      .eq("user_id", user.id)
      .eq("data", dateStr);
    setLoading(false);
    if (error) { toast.error("Erro ao buscar pedidos"); return; }
    if (!data?.length) { setLista(""); toast.info("Nenhum pedido encontrado nessa data"); return; }
    const text = data
      .filter((p) => p.telefone)
      .map((p) => `${p.cliente} / ${fixPhone(p.telefone)}`)
      .join("\n");
    setLista(text || "Nenhum pedido com telefone nessa data");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lista);
    toast.success("Lista copiada!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Lista Telefônica
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Data do pedido</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleGerar} disabled={!date || loading}>
              {loading ? "Gerando..." : "Gerar Lista"}
            </Button>
          </div>
          {lista && (
            <>
              <Textarea readOnly value={lista} rows={10} className="font-mono text-sm" />
              <Button variant="outline" className="w-full" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" /> Copiar Lista
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
