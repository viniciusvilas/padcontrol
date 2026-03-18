export const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const generateRastreioKeed = (cpf: string, plataforma: string) => {
  if (plataforma !== "Keed") return "";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "";
  const formatted = formatCPF(cpf);
  return `https://app.arcologistica.com.br/tracking?type=document&query=${formatted}`;
};

export const calcPrevisao = (data: string, prazo: string) => {
  if (!data || !prazo) return "";
  const date = new Date(data + "T12:00:00");
  let dias = parseInt(prazo) || 0;
  while (dias > 0) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) dias--;
  }
  return date.toISOString().slice(0, 10);
};
