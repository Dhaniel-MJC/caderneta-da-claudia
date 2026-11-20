// Converte um id vindo da URL (texto) em número.
// Aceita só dígitos: "abc", "", "1.5" ou " 1 " viram null (não encontrado).
export function textoParaId(texto: string): number | null {
  if (!/^\d+$/.test(texto)) {
    return null;
  }
  return Number(texto);
}
