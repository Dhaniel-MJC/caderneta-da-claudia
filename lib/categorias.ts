import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tipo } from "@/lib/lancamentos";

// Categorias vindas do Supabase (tabela categorias).

// Formato de uma categoria usado pelas telas.
export interface Categoria {
  id: number;
  nome: string;
  tipo: Tipo;
  cor: string; // #RRGGBB (o banco confere o formato)
}

const COLUNAS = "categoria_id, nome, tipo, cor_hex";

// Formato de uma linha como o Supabase devolve.
interface LinhaCategoria {
  categoria_id: number;
  nome: string;
  tipo: Tipo;
  cor_hex: string;
}

function paraCategoria(linha: LinhaCategoria): Categoria {
  return { id: linha.categoria_id, nome: linha.nome, tipo: linha.tipo, cor: linha.cor_hex };
}

// Categorias de uma pessoa, em ordem alfabética.
// O filtro por user_id fica aqui E no RLS do banco.
export async function listarCategorias(
  supabase: SupabaseClient,
  userId: string,
): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select(COLUNAS)
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar categorias: ${error.message}`);
  }
  return (data as LinhaCategoria[]).map(paraCategoria);
}

// Uma categoria pelo id, só se for da pessoa. Se não existir (ou for de outra pessoa), devolve null.
export async function buscarCategoria(
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<Categoria | null> {
  const { data, error } = await supabase
    .from("categorias")
    .select(COLUNAS)
    .eq("user_id", userId)
    .eq("categoria_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar a categoria: ${error.message}`);
  }
  return data ? paraCategoria(data as LinhaCategoria) : null;
}

// Quantos lançamentos e recorrências usam a categoria.
// Categoria em uso não pode ser excluída (R9) nem mudar de tipo.
export async function contarUsoCategoria(
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<{ lancamentos: number; recorrencias: number }> {
  const [lancamentos, recorrencias] = await Promise.all([
    supabase
      .from("lancamentos")
      .select("lancamento_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("categoria_id", id),
    supabase
      .from("recorrencias")
      .select("recorrencia_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("categoria_id", id),
  ]);

  if (lancamentos.error || recorrencias.error) {
    throw new Error("Erro ao conferir o uso da categoria.");
  }
  return { lancamentos: lancamentos.count ?? 0, recorrencias: recorrencias.count ?? 0 };
}

// ---------- Formulário de categoria (nova e editar) ----------

// O que a pessoa preencheu, como texto. Volta para a tela quando há erro.
export interface ValoresCategoria {
  nome: string;
  tipo: Tipo;
  cor: string;
}

// Resposta da Server Action para o formulário.
// "tentativa" muda a cada envio com erro e serve de key para o formulário se remontar preenchido.
export interface EstadoFormCategoria {
  erro: string | null;
  valores: ValoresCategoria;
  tentativa: number;
}
