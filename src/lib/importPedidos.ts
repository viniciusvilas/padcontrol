import ExcelJS from "exceljs";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export interface PedidoImportRow {
  cliente: string;
  valor: number;
  produto: string;
  telefone: string | null;
  local_entrega: string | null;
  prazo: number;
  data: string;
  previsao_entrega: string | null;
  pedido_chegou: boolean;
  ja_foi_chamado: boolean;
  cliente_cobrado: boolean;
  status: string;
  pedido_pago: boolean;
  pedido_perdido: boolean;
  cpf: string | null;
  rastreio: string | null;
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(value: any): string | null {
  if (!value) return null;

  if (value instanceof Date) return formatDateISO(value);

  if (typeof value === "number") {
    const epoch = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(epoch.getTime())) return formatDateISO(epoch);
    return null;
  }

  const str = String(value).trim();

  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, "0");
    const month = brMatch[2].padStart(2, "0");
    let year = brMatch[3];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  return null;
}

function parseBool(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toUpperCase() === "TRUE";
  return false;
}

function parseNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[R$\s]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function mapStatus(statusCobranca: string | null, ganhoPerda: string | null): { status: string; pedido_pago: boolean; pedido_perdido: boolean } {
  const gp = (ganhoPerda || "").trim().toUpperCase();
  const sc = (statusCobranca || "").trim().toUpperCase();

  if (gp === "GANHO" || sc === "PAGO") {
    return { status: "pago", pedido_pago: true, pedido_perdido: false };
  }
  if (gp === "PERDA") {
    return { status: "perdido", pedido_pago: false, pedido_perdido: true };
  }
  if (sc === "COBRADO" || sc === "EM COBRANÇA") {
    return { status: "em_cobranca", pedido_pago: false, pedido_perdido: false };
  }
  if (sc === "AGUARDANDO") {
    return { status: "aguardando", pedido_pago: false, pedido_perdido: false };
  }
  return { status: "criado", pedido_pago: false, pedido_perdido: false };
}

function getCellValue(cell: ExcelJS.CellValue): any {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object" && "result" in cell) return (cell as any).result;
  if (typeof cell === "object" && "text" in cell) return (cell as any).text;
  return cell;
}

function sheetToObjects(worksheet: ExcelJS.Worksheet): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(getCellValue(cell.value) ?? "").trim();
  });

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) obj[header] = getCellValue(cell.value);
    });
    rows.push(obj);
  });

  return rows;
}

export async function parseSpreadsheet(file: File): Promise<PedidoImportRow[]> {
  // CSV files
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const csvRows = lines.map((line) => line.split(",").map((c) => c.trim()));
    if (csvRows.length < 2) return [];
    const headers = csvRows[0];
    const objects = csvRows.slice(1).map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj;
    });
    return processRows(objects);
  }

  // XLSX files
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Planilha vazia");
  const objects = sheetToObjects(worksheet);
  return processRows(objects);
}

function processRows(rows: Record<string, any>[]): PedidoImportRow[] {
  const parsed: PedidoImportRow[] = [];

  for (const row of rows) {
    const cliente = String(row["NOME"] || "").trim();
    const valor = parseNumber(row["VALOR"]);

    if (!cliente || valor <= 0) continue;

    const statusInfo = mapStatus(
      row["STATUS_DA_COBRANCA"] || row["STATUS DA COBRANCA"] || null,
      row["GANHO_OU_PERDA"] || row["GANHO OU PERDA"] || null
    );

    const rawCpf = row["CPF"] ? String(row["CPF"]).trim() : "";
    const cpf = rawCpf ? formatCPF(rawCpf) : null;

    parsed.push({
      cliente,
      valor,
      produto: String(row["TICKET"] || "T1").trim(),
      telefone: row["NUMERO"] ? String(row["NUMERO"]).trim() : null,
      local_entrega: row["ENTREGA"] ? String(row["ENTREGA"]).trim() : null,
      prazo: parseInt(String(row["DIAS_UTEIS"] || row["DIAS UTEIS"] || "15")) || 15,
      data: parseDate(row["DATA"]) || new Date().toISOString().slice(0, 10),
      previsao_entrega: parseDate(row["PREVISAO_CHEGADA"] || row["PREVISAO CHEGADA"]),
      pedido_chegou: parseBool(row["JA_CHEGOU?"] || row["JA CHEGOU?"]),
      ja_foi_chamado: parseBool(row["JA_FOI_CHAMADO"] || row["JA FOI CHAMADO"]),
      cliente_cobrado: parseBool(row["JA_FOI_COBRADO"] || row["JA FOI COBRADO"]),
      cpf,
      rastreio: cpf && cpf.replace(/\D/g, "").length === 11
        ? `https://app.arcologistica.com.br/tracking?type=document&query=${cpf}`
        : null,
      ...statusInfo,
    });
  }

  return parsed;
}
