import type { SupabaseClient } from "@supabase/supabase-js";

// Contas vindas do Supabase (tabela contas).

export type TipoConta = "corrente" | "cartao" | "especie" | "poupanca";

// Formato de uma conta usado pelas telas.
export interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
}

// Formato de uma linha como o Supabase devolve.
interface LinhaConta {
  conta_id: number;
  nome: string;
  tipo: TipoConta;
}

// Contas de uma pessoa, em ordem alfabética.
// O filtro por user_id fica aqui E no RLS do banco.
export async function listarContas(supabase: SupabaseClient, userId: string): Promise<Conta[]> {
  const { data, error } = await supabase
    .from("contas")
    .select("conta_id, nome, tipo")
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas: ${error.message}`);
  }
  return (data as LinhaConta[]).map((linha) => ({
    id: linha.conta_id,
    nome: linha.nome,
    tipo: linha.tipo,
  }));
}
