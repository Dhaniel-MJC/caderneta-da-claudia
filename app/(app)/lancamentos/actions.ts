"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstadoFormLancamento, Tipo, ValoresLancamento } from "@/lib/lancamentos";
import { lerTexto, type EstadoExclusao } from "@/lib/formularios";
import { dataValida } from "@/lib/datas";
import { textoParaId } from "@/lib/ids";
import { textoParaValor, valorEhPositivo } from "@/lib/valor";
import { criarClienteServidor } from "@/lib/supabase/server";

// Server Actions dos lançamentos: criar, editar e excluir.
// Rodam só no servidor. Mesmo que alguém monte um envio na mão (sem passar pela tela),
// tudo é conferido de novo aqui: login, campos, e se conta e categoria são da pessoa.
// Erros esperados voltam como mensagem para a tela, em vez de quebrar a página.

const TAMANHO_MAX_DESCRICAO = 120;

// Linha pronta para gravar na tabela lancamentos.
interface LinhaParaGravar {
  descricao: string;
  valor: string; // texto ("1234.50"): o numeric do banco recebe exato, sem arredondar
  tipo: Tipo;
  data_lancamento: string;
  conta_id: number;
  categoria_id: number;
}

// Lê os campos do formulário como texto. Campo que não veio vira "".
function lerValores(formData: FormData): ValoresLancamento {
  const texto = (nome: string) => lerTexto(formData, nome);
  return {
    descricao: texto("descricao"),
    valor: texto("valor"),
    tipo: texto("tipo") === "entrada" ? "entrada" : "saida",
    data: texto("data"),
    contaId: texto("contaId"),
    categoriaId: texto("categoriaId"),
  };
}

// Confere os campos. Devolve a mensagem de erro ou a linha pronta para gravar.
function validar(
  valores: ValoresLancamento,
  tipoBruto: FormDataEntryValue | null,
): { erro: string } | { linha: LinhaParaGravar } {
  const descricao = valores.descricao.trim();
  if (descricao === "") {
    return { erro: "Preencha a descrição." };
  }
  if (descricao.length > TAMANHO_MAX_DESCRICAO) {
    return { erro: `A descrição pode ter no máximo ${TAMANHO_MAX_DESCRICAO} caracteres.` };
  }

  const valor = textoParaValor(valores.valor);
  if (valor === null) {
    return { erro: "Valor inválido. Use só números, com até 2 casas depois da vírgula (ex: 150,90)." };
  }
  if (!valorEhPositivo(valor)) {
    return { erro: "O valor precisa ser maior que zero." };
  }

  // lerValores troca qualquer coisa estranha por "saida"; aqui recusamos de verdade.
  if (tipoBruto !== "entrada" && tipoBruto !== "saida") {
    return { erro: "Escolha se é entrada ou saída." };
  }

  if (!dataValida(valores.data)) {
    return { erro: "Informe uma data válida." };
  }

  const contaId = textoParaId(valores.contaId);
  if (contaId === null) {
    return { erro: "Escolha a conta." };
  }
  const categoriaId = textoParaId(valores.categoriaId);
  if (categoriaId === null) {
    return { erro: "Escolha a categoria." };
  }

  return {
    linha: {
      descricao,
      valor,
      tipo: tipoBruto,
      data_lancamento: valores.data,
      conta_id: contaId,
      categoria_id: categoriaId,
    },
  };
}

// Confere se a conta e a categoria são de quem está logado (R8),
// e se o tipo da categoria combina com o tipo do lançamento.
// O banco também barra conta/categoria de outra pessoa (chave estrangeira composta),
// mas assim a mensagem fica clara em vez de um erro técnico.
async function conferirContaECategoria(
  supabase: SupabaseClient,
  userId: string,
  linha: LinhaParaGravar,
): Promise<string | null> {
  const [conta, categoria] = await Promise.all([
    supabase
      .from("contas")
      .select("conta_id")
      .eq("user_id", userId)
      .eq("conta_id", linha.conta_id)
      .maybeSingle(),
    supabase
      .from("categorias")
      .select("tipo")
      .eq("user_id", userId)
      .eq("categoria_id", linha.categoria_id)
      .maybeSingle(),
  ]);

  if (conta.error || categoria.error) {
    return "Não foi possível conferir a conta e a categoria. Tente de novo.";
  }
  if (!conta.data) {
    return "Conta não encontrada. Escolha uma das suas contas.";
  }
  if (!categoria.data) {
    return "Categoria não encontrada. Escolha uma das suas categorias.";
  }
  if (categoria.data.tipo !== linha.tipo) {
    return linha.tipo === "entrada"
      ? "Essa categoria é de saída. Para uma entrada, escolha uma categoria de entrada."
      : "Essa categoria é de entrada. Para uma saída, escolha uma categoria de saída.";
  }
  return null;
}

// Atualiza as telas que mostram lançamentos, para não aparecerem dados velhos.
function atualizarTelas(id?: number) {
  revalidatePath("/lancamentos");
  if (id !== undefined) {
    revalidatePath(`/lancamentos/${id}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/categoria/[id]", "page");
}

const ERRO_SESSAO = "Sua sessão expirou. Entre de novo para continuar.";
const ERRO_CONEXAO = "Sem conexão com o banco de dados. Tente de novo em instantes.";

// Criar um lançamento: usada pelo formulário de /lancamentos/novo.
// Assinatura (estadoAnterior, formData) é a que o useActionState espera.
export async function criarLancamento(
  estadoAnterior: EstadoFormLancamento,
  formData: FormData,
): Promise<EstadoFormLancamento> {
  const valores = lerValores(formData);
  const comErro = (erro: string): EstadoFormLancamento => ({
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

    const erroDono = await conferirContaECategoria(supabase, user.id, validacao.linha);
    if (erroDono) {
      return comErro(erroDono);
    }

    // user_id vem do login conferido no servidor, nunca do formulário.
    const { error } = await supabase
      .from("lancamentos")
      .insert({ ...validacao.linha, user_id: user.id });

    if (error) {
      return comErro(`Não foi possível salvar o lançamento: ${error.message}`);
    }
  } catch {
    return comErro(ERRO_CONEXAO);
  }

  // Fora do try: redirect funciona lançando um erro especial, que o catch engoliria.
  atualizarTelas();
  redirect("/lancamentos");
}

// Editar um lançamento: usada pelo formulário de /lancamentos/[id]/editar.
// O id vem preso com .bind() na página, e é conferido de novo aqui.
export async function editarLancamento(
  id: number,
  estadoAnterior: EstadoFormLancamento,
  formData: FormData,
): Promise<EstadoFormLancamento> {
  const valores = lerValores(formData);
  const comErro = (erro: string): EstadoFormLancamento => ({
    erro,
    valores,
    tentativa: estadoAnterior.tentativa + 1,
  });

  if (!Number.isSafeInteger(id) || id <= 0) {
    return comErro("Lançamento inválido.");
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

    const erroDono = await conferirContaECategoria(supabase, user.id, validacao.linha);
    if (erroDono) {
      return comErro(erroDono);
    }

    // Filtra por id E por user_id (além do RLS): só altera se o lançamento for da pessoa.
    // O .select() devolve as linhas alteradas; lista vazia = não achou.
    const { data, error } = await supabase
      .from("lancamentos")
      .update(validacao.linha)
      .eq("lancamento_id", id)
      .eq("user_id", user.id)
      .select("lancamento_id");

    if (error) {
      return comErro(`Não foi possível salvar as alterações: ${error.message}`);
    }
    if (!data || data.length === 0) {
      return comErro("Lançamento não encontrado. Ele pode ter sido excluído.");
    }
  } catch {
    return comErro(ERRO_CONEXAO);
  }

  atualizarTelas(id);
  redirect("/lancamentos");
}

// Excluir um lançamento: usada pelo botão de excluir em /lancamentos/[id]/editar.
// A confirmação ("tem certeza?") acontece na tela, antes de chamar esta função.
export async function excluirLancamento(
  id: number,
  _estadoAnterior: EstadoExclusao,
  _formData: FormData,
): Promise<EstadoExclusao> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { erro: "Lançamento inválido." };
  }

  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { erro: ERRO_SESSAO };
    }

    const { data, error } = await supabase
      .from("lancamentos")
      .delete()
      .eq("lancamento_id", id)
      .eq("user_id", user.id)
      .select("lancamento_id");

    if (error) {
      return { erro: `Não foi possível excluir o lançamento: ${error.message}` };
    }
    if (!data || data.length === 0) {
      return { erro: "Lançamento não encontrado. Ele pode já ter sido excluído." };
    }
  } catch {
    return { erro: ERRO_CONEXAO };
  }

  atualizarTelas(id);
  redirect("/lancamentos");
}
