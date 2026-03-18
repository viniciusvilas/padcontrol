export const FRETE_FIVE = 35.5;

export const STATUS_OPTIONS = [
  { value: "criado", label: "Criado" },
  { value: "aguardando", label: "Aguardando" },
  { value: "em_cobranca", label: "Em Cobrança" },
  { value: "pago", label: "Pago" },
  { value: "perdido", label: "Perdido" },
] as const;

export const PRODUTO_OPTIONS: Record<string, { value: string; label: string; preco: number }[]> = {
  Keed: [
    { value: "3+1", label: "3+1", preco: 163 },
    { value: "5+1", label: "5+1", preco: 213 },
    { value: "12", label: "12", preco: 350 },
  ],
  Five: [
    { value: "3+1", label: "3+1", preco: 201.50 },
    { value: "5+1", label: "5+1", preco: 251.35 },
    { value: "12", label: "12", preco: 350 },
  ],
};

export const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

export const statusStyle = (s: string) => {
  switch (s) {
    case "pago": return "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400";
    case "perdido": return "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400";
    case "em_cobranca": return "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-400";
    case "aguardando": return "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400";
    default: return "bg-muted text-muted-foreground";
  }
};
