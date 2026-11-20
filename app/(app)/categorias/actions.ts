"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  contarUsoCategoria,
  type EstadoFormCategoria,
  type ValoresCategoria,
} from "@/lib/categorias";
import { lerTexto, type EstadoExclusao } from "@/lib/formularios";
import type { Tipo } from "@/lib/lancamentos";
import { criarClienteServidor } from "@/lib/supabase/server";

// Server Actions das categorias: criar, editar e excluir.
// Tudo é conferido de novo aqui, mesmo que a tela já tenha conferido.
// Erros esperados voltam como mensagem para a tela, em vez de quebrar a página.

const TAMANHO_MAX_NOME = 40;

// Códigos de erro do PostgreSQL que tratamos com mensagem própria.
const VIOLOU_UNICO = "23505"; // nome repetido (categorias_nome_por_usuario)
const VIOLOU_CHAVE_ESTRANGEIRA = "23503"; // categoria ainda usada por lançamento/recorrência

const ERRO_SESSAO = "Sua sessão expirou. Entre de novo para continuar.";
const ERRO_CONEXAO = "Sem conexão com o banco de dados. Tente de novo em instantes.";
const ERRO_NOME_REPETIDO = "Você já tem uma categoria com esse nome.";

interface LinhaParaGravar {
  nome: string;
  tipo: Tipo;
  cor_hex: string;
}

function lerValores(formData: FormData): ValoresCategoria {
  return {
    nome: lerTexto(formData, "nome"),
    tipo: lerTexto(formData, "tipo") === "entrada" ? "entrada" : "saida",
    cor: lerTexto(formData, "cor"),
  };
}

// Confere os campos. Devolve a mensagem de erro ou a linha pronta para gravar.
function validar(
  valores: ValoresCategoria,
  tipoBruto: FormDataEntryValue | null,
): { erro: string } | { linha: LinhaParaGravar } {
  // Espaços repetidos no meio viram um só: "Mercado   do mês" -> "Mercado do mês".
  const nome = valores.nome.trim().replace(/\s+/g, " ");
  if (nome === "") {
    return { erro: "Preencha o nome da categoria." };
  }
  if (nome.length > TAMANHO_MAX_NOME) {
    return { erro: `O nome pode ter no máximo ${TAMANHO_MAX_NOME} caracteres.` };
  }
  if (tipoBruto !== "entrada" && tipoBruto !== "saida") {
    return { erro: "Escolha se a categoria é de entrada ou de saída." };
  }
  // Mesmo formato que o banco exige (R3): #RRGGBB.
  if (!/^#[0-9A-Fa-f]{6}$/.test(valores.cor)) {
    return { erro: "Escolha uma cor válida." };
  }
  return { linha: { nome, tipo: tipoBruto, cor_hex: valores.cor.toUpperCase() } };
}

// Atualiza as telas que mostram categorias (inclusive os nomes nos lançamentos).
function atualizarTelas(id?: number) {
  revalidatePath("/categorias");
  if (id !== undefined) {
    revalidatePath(`/categoria/${id}`);
  }
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/[id]", "page");
  revalidatePath("/dashboard");
}

function idValido(id: number): boolean {
  return Number.isSafeInteger(id) && id > 0;
}

// Criar uma categoria: usada pelo formulário de /categorias/nova.
export async function criarCategoria(
  estadoAnterior: EstadoFormCategoria,
  formData: FormData,
): Promise<EstadoFormCategoria> {
  const valores = lerValores(formData);
  const comErro = (erro: string): EstadoFormCategoria => ({
    erro,
    valores,
    tentativa: estadoAnterior.tentativa + 1,
  });

  const validacao = validar(valores, formData.get("tipo"));
  if ("erro" in validacao) {
    return comErro(validacao.erro);
  }

  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return comErro(ERRO_SESSAO);
    }

    // user_id vem do login conferido no servidor, nunca do formulário.
    const { error } = await supabase
      .from("categorias")
      .insert({ ...validacao.linha, user_id: user.id });

    if (error) {
      return comErro(
        error.code === VIOLOU_UNICO
          ? ERRO_NOME_REPETIDO
          : `Não foi possível salvar a categoria: ${error.message}`,
      );
    }
  } catch {
    return comErro(ERRO_CONEXAO);
  }

  // Fora do try: redirect funciona lançando um erro especial, que o catch engoliria.
  atualizarTelas();
  redirect("/categorias");
}

// Editar uma categoria: usada pelo formulário de /categoria/[id]/editar.
export async function editarCategoria(
  id: number,
  estadoAnterior: EstadoFormCategoria,
  formData: FormData,
): Promise<EstadoFormCategoria> {
  const valores = lerValores(formData);
  const comErro = (erro: string): EstadoFormCategoria => ({
    erro,
    valores,
    tentativa: estadoAnterior.tentativa + 1,
  });

  if (!idValido(id)) {
    return comErro("Categoria inválida.");
  }

  const validacao = validar(valores, formData.get("tipo"));
  if ("erro" in validacao) {
    return comErro(validacao.erro);
  }

  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return comErro(ERRO_SESSAO);
    }

    const { data: atual, error: erroBusca } = await supabase
      .from("categorias")
      .select("tipo")
      .eq("user_id", user.id)
      .eq("categoria_id", id)
      .maybeSingle();
    if (erroBusca) {
      return comErro(`Não foi possível buscar a categoria: ${erroBusca.message}`);
    }
    if (!atual) {
      return comErro("Categoria não encontrada. Ela pode ter sido excluída.");
    }

    // Mudar o tipo de uma categoria já usada deixaria lançamentos de saída
    // numa categoria de entrada (ou o contrário).
    if (atual.tipo !== validacao.linha.tipo) {
      const uso = await contarUsoCategoria(supabase, user.id, id);
      if (uso.lancamentos > 0) {
        return comErro(
          `Não dá para mudar o tipo: essa categoria já tem ${uso.lancamentos} lançamento(s) de ${
            atual.tipo === "entrada" ? "entrada" : "saída"
          }.`,
        );
      }
    }

    const { data, error } = await supabase
      .from("categorias")
      .update(validacao.linha)
      .eq("categoria_id", id)
      .eq("user_id", user.id)
      .select("categoria_id");

    if (error) {
      return comErro(
        error.code === VIOLOU_UNICO
          ? ERRO_NOME_REPETIDO
          : `Não foi possível salvar as alterações: ${error.message}`,
      );
    }
    if (!data || data.length === 0) {
      return comErro("Categoria não encontrada. Ela pode ter sido excluída.");
    }
  } catch {
    return comErro(ERRO_CONEXAO);
  }

  atualizarTelas(id);
  redirect(`/categoria/${id}`);
}

// Excluir uma categoria: usada pelo botão de excluir em /categoria/[id]/editar.
// Só exclui categoria sem uso (R9: apagar categoria não pode apagar o histórico).
export async function excluirCategoria(
  id: number,
  _estadoAnterior: EstadoExclusao,
  _formData: FormData,
): Promise<EstadoExclusao> {
  if (!idValido(id)) {
    return { erro: "Categoria inválida." };
  }

  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { erro: ERRO_SESSAO };
    }

    const uso = await contarUsoCategoria(supabase, user.id, id);
    if (uso.lancamentos > 0 || uso.recorrencias > 0) {
      return { erro: mensagemEmUso(uso) };
    }

    const { data, error } = await supabase
      .from("categorias")
      .delete()
      .eq("categoria_id", id)
      .eq("user_id", user.id)
      .select("categoria_id");

    if (error) {
      // Alguém lançou nessa categoria entre a conferência e o delete: o banco barra.
      return {
        erro:
          error.code === VIOLOU_CHAVE_ESTRANGEIRA
            ? "Essa categoria passou a ser usada por algum lançamento e não pode ser excluída."
            : `Não foi possível excluir a categoria: ${error.message}`,
      };
    }
    if (!data || data.length === 0) {
      return { erro: "Categoria não encontrada. Ela pode já ter sido excluída." };
    }
  } catch {
    return { erro: ERRO_CONEXAO };
  }

  atualizarTelas(id);
  redirect("/categorias");
}

// Mensagem para categoria em uso.
function mensagemEmUso(uso: { lancamentos: number; recorrencias: number }): string {
  const partes: string[] = [];
  if (uso.lancamentos > 0) partes.push(`${uso.lancamentos} lançamento(s)`);
  if (uso.recorrencias > 0) partes.push(`${uso.recorrencias} recorrência(s)`);
  return `Essa categoria é usada por ${partes.join(" e ")} e não pode ser excluída. Mude-os para outra categoria antes.`;
}
