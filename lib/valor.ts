// Conversão de valores em dinheiro digitados pela pessoa.
// Tudo é feito com texto, sem passar por número de ponto flutuante,
// para o valor chegar exato ao banco (numeric(10,2), R10).

// Maior valor que cabe em numeric(10,2): 8 dígitos antes da vírgula.
const MAX_DIGITOS_INTEIROS = 8;

// Converte o que a pessoa digitou em texto no formato do banco ("1234.50").
// Aceita "12", "12,5", "12,50", "12.50", "1.234,56", "1,234.56", "R$ 1.500".
// Devolve null se não for um valor válido (letras, mais de 2 casas decimais, vazio...).
// Não confere se é maior que zero: veja valorEhPositivo.
export function textoParaValor(texto: string): string | null {
  let limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (limpo === "") return null;

  const ultimaVirgula = limpo.lastIndexOf(",");
  const ultimoPonto = limpo.lastIndexOf(".");

  if (ultimaVirgula !== -1 && ultimoPonto !== -1) {
    // Tem os dois: o que aparece por último separa os centavos; o outro separa milhares.
    const separadorDecimal = ultimaVirgula > ultimoPonto ? "," : ".";
    const separadorMilhar = separadorDecimal === "," ? "." : ",";
    limpo = limpo.split(separadorMilhar).join("").replace(separadorDecimal, ".");
  } else if (ultimaVirgula !== -1) {
    // Só vírgula: jeito brasileiro, "12,50".
    limpo = limpo.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // Só pontos, em grupos de 3: "1.500" ou "1.500.000" são milhares, não centavos.
    limpo = limpo.split(".").join("");
  }

  // Formato final: dígitos, e opcionalmente ponto com 1 ou 2 casas.
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(limpo);
  if (!partes) return null;

  const inteiros = partes[1].replace(/^0+(?=\d)/, ""); // "007" -> "7"
  if (inteiros.length > MAX_DIGITOS_INTEIROS) return null;

  const centavos = (partes[2] ?? "").padEnd(2, "0");
  return `${inteiros}.${centavos}`;
}

// "0.00" não é positivo; "0.01" é.
export function valorEhPositivo(valor: string): boolean {
  return /[1-9]/.test(valor);
}

// Número vindo do banco -> texto para o campo do formulário: 1234.5 -> "1234,50".
export function valorParaTexto(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

// Número -> dinheiro em reais para mostrar na tela. Ex: 1234.5 -> "R$ 1.234,50".
export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
