import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseSpreadsheet, PedidoImportRow } from "@/lib/importPedidos";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { statusStyle } from "@/lib/constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportPedidosDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PedidoImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = await parseSpreadsheet(file);
      setRows(parsed);
      setStep("preview");
    } catch {
      toast.error("Erro ao ler a planilha.");
    }
  };

  const handleImport = async () => {
    if (!user) return toast.error("Você precisa estar logado.");
    setLoading(true);
    try {
      const batch = rows.map((r) => ({ ...r, user_id: user.id, plataforma: "Five" }));
      const CHUNK = 50;
      for (let i = 0; i < batch.length; i += CHUNK) {
        const { error } = await supabase.from("pedidos").insert(batch.slice(i, i + CHUNK));
        if (error) throw error;
      }
      toast.success(`${rows.length} pedidos importados!`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setRows([]); setStep("upload"); setFileName(""); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Importar Planilha
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx ou .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{rows.length} pedidos encontrados em <strong>{fileName}</strong></span>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead><TableHead>Valor</TableHead><TableHead>Produto</TableHead>
                    <TableHead>Data</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.cliente}</TableCell>
                      <TableCell>R$ {r.valor.toFixed(2)}</TableCell>
                      <TableCell>{r.produto}</TableCell>
                      <TableCell>{r.data}</TableCell>
                      <TableCell><Badge variant="outline" className={statusStyle(r.status)}>{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 100 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Mostrando 100 de {rows.length}
              </p>
            )}
          </>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); }}>Voltar</Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? "Importando..." : `Importar ${rows.length} pedidos`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
