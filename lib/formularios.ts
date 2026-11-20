// Tipos comuns aos formulários que usam Server Actions.

// Resposta de uma Server Action de excluir. Se deu certo, a action redireciona e não volta nada.
export interface EstadoExclusao {
  erro: string | null;
}

// Lê um campo do FormData como texto. Campo que não veio (ou arquivo) vira "".
export function lerTexto(formData: FormData, nome: string): string {
  const valor = formData.get(nome);
  return typeof valor === "string" ? valor : "";
}
