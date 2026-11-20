// Converte uma data no formato AAAA-MM-DD para o formato brasileiro DD/MM/AAAA.
// Ex: "2025-01-05" -> "05/01/2025".
// Trabalha com o texto direto (sem Date), para não haver mudança de dia por causa do fuso horário.
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Data de hoje no horário de Brasília, no formato AAAA-MM-DD (o mesmo do <input type="date">).
// O servidor pode estar em outro fuso (UTC): sem o timeZone, depois das 21h já seria "amanhã".
export function hojeISO(): string {
  // O formato do Canadá (en-CA) já sai como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Confere se o texto é uma data de verdade no formato AAAA-MM-DD.
// "2025-02-30" tem o formato certo, mas não existe: devolve false.
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}

// ---------- Meses (formato AAAA-MM, o mesmo do <input type="month"> e de ?mes= na URL) ----------

const NOMES_DOS_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Confere se o texto é um mês no formato AAAA-MM. "2025-13" e "2025-6" não passam.
// O ano começa em 1900 para não aceitar coisas como "0000-01".
export function mesValido(texto: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(texto)) return false;
  return Number(texto.slice(0, 4)) >= 1900;
}

// Mês de hoje no horário de Brasília. Ex: "2025-06".
export function mesAtual(): string {
  return hojeISO().slice(0, 7);
}

// Anda meses para frente (quantidade positiva) ou para trás (negativa).
// Ex: somarMeses("2025-01", -1) -> "2024-12".
export function somarMeses(mes: string, quantidade: number): string {
  const [ano, numero] = mes.split("-").map(Number);
  const total = ano * 12 + (numero - 1) + quantidade;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

// Primeiro dia do mês, AAAA-MM-DD. Ex: "2025-06" -> "2025-06-01".
export function primeiroDiaDoMes(mes: string): string {
  return `${mes}-01`;
}

// Último dia do mês, AAAA-MM-DD. Considera ano bissexto. Ex: "2024-02" -> "2024-02-29".
export function ultimoDiaDoMes(mes: string): string {
  const [ano, numero] = mes.split("-").map(Number);
  // Dia 0 do mês seguinte = último dia deste mês.
  const dia = new Date(Date.UTC(ano, numero, 0)).getUTCDate();
  return `${mes}-${String(dia).padStart(2, "0")}`;
}

// Nome do mês por extenso. Ex: "2025-06" -> "junho de 2025".
export function nomeDoMes(mes: string): string {
  const [ano, numero] = mes.split("-").map(Number);
  return `${NOMES_DOS_MESES[numero - 1]} de ${ano}`;
}

// Nome curto, para caber embaixo da barra do gráfico. Ex: "2025-06" -> "jun/25".
export function nomeCurtoDoMes(mes: string): string {
  const [ano, numero] = mes.split("-").map(Number);
  return `${NOMES_DOS_MESES[numero - 1].slice(0, 3)}/${String(ano).slice(2)}`;
}
