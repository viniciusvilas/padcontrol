import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  estadoFilter: string;
  onEstadoFilterChange: (v: string) => void;
  plataformaFilter: string;
  onPlataformaFilterChange: (v: string) => void;
  estados: string[];
}

const STATUS_FILTER_OPTIONS = [
  { value: "todos", label: "Todos os Status" },
  { value: "criado", label: "Criado" },
  { value: "aguardando", label: "Aguardando" },
  { value: "em_cobranca", label: "Em Cobrança" },
  { value: "pago", label: "Pago" },
  { value: "perdido", label: "Perdido" },
];

export default function PedidoFilters({
  search, onSearchChange, statusFilter, onStatusFilterChange,
  estadoFilter, onEstadoFilterChange, plataformaFilter, onPlataformaFilterChange, estados,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente, produto ou CPF..." className="pl-9" value={search} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
        <SelectContent>
          {STATUS_FILTER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={estadoFilter} onValueChange={onEstadoFilterChange}>
        <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Estados</SelectItem>
          {estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={plataformaFilter} onValueChange={onPlataformaFilterChange}>
        <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas</SelectItem>
          <SelectItem value="Five">Five</SelectItem>
          <SelectItem value="Keed">Keed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
