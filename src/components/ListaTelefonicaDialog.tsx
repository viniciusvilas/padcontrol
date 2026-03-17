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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [lista, setLista] = useState("");
  const [loading, setLoading] = useState(false);
  const [plataforma, setPlataforma] = useState("todas");

  const handleGerar = async () => {
    if (!dateFrom || !dateTo || !user) return;
    setLoading(true);
    const from = format(dateFrom, "yyyy-MM-dd");
    const to = format(dateTo, "yyyy-MM-dd");
    let query = supabase
      .from("pedidos")
      .select("cliente, telefone, plataforma")
      .eq("user_id", user.id)
      .gte("data", from)
      .lte("data", to);
    if (plataforma !== "todas") {
      query = query.eq("plataforma", plataforma);
    }
    const { data, error } = await query;
    setLoading(false);
    if (error) { toast.error("Erro ao buscar pedidos"); return; }
    if (!data?.length) { setLista(""); toast.info("Nenhum pedido encontrado nesse período"); return; }
    const text = data
      .filter((p) => p.telefone)
      .map((p) => `${p.cliente} / ${fixPhone(p.telefone)}`)
      .join("\n");
    setLista(text || "Nenhum pedido com telefone nesse período");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lista);
    toast.success("Lista copiada!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? 'open' : 'closed'} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Lista Telefônica
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">De</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Até</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Plataforma</label>
            <Select value={plataforma} onValueChange={setPlataforma}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="Five">Five</SelectItem>
                <SelectItem value="Keed">Keed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGerar} disabled={!dateFrom || !dateTo || loading} className="w-full">
            {loading ? "Gerando..." : "Gerar Lista"}
          </Button>
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
