// Para onde mandar a pessoa depois do login.
// O valor vem da URL (?next=...), então qualquer um pode mexer nele.
// Só aceitamos caminhos internos ("/algo"); "//site.com" ou "/\site.com" levariam para fora do app.
export function destinoSeguro(destino: string | undefined | null): string {
  if (
    destino &&
    destino.startsWith("/") &&
    !destino.startsWith("//") &&
    !destino.startsWith("/\\")
  ) {
    return destino;
  }
  return "/lancamentos";
}
