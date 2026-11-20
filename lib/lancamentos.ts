import type { SupabaseClient } from "@supabase/supabase-js";

// Lançamentos vindos do Supabase (tabela lancamentos + nome da categoria).

// "entrada" = dinheiro que entrou; "saida" = dinheiro que saiu.
export type Tipo = "entrada" | "saida";

// Formato de um lançamento usado pelas telas.
export interface Lancamento {
  id: number;
  descricao: string; // "" quando o banco não tem descrição
  valor: number; // sempre positivo; o tipo diz se entrou ou saiu
  tipo: Tipo;
  data: string; // formato AAAA-MM-DD
  contaId: number;
  categoriaId: number;
  categoriaNome: string | null; // null se a categoria não puder ser lida
}

// Colunas buscadas. "categorias(nome)" usa a chave estrangeira categoria_id
// para trazer o nome da categoria junto, numa consulta só.
const COLUNAS =
  "lancamento_id, descricao, valor, tipo, data_lancamento, conta_id, categoria_id, categorias(nome)";

// Formato de uma linha como o Supabase devolve.
interface LinhaLancamento {
  lancamento_id: number;
  descricao: string | null;
  valor: number | string; // numeric pode chegar como texto
  tipo: Tipo;
  data_lancamento: string;
  conta_id: number;
  categoria_id: number;
  categorias: { nome: string } | { nome: string }[] | null;
}

function paraLancamento(linha: LinhaLancamento): Lancamento {
  const categoria = Array.isArray(linha.categorias) ? linha.categorias[0] : linha.categorias;
  return {
    id: linha.lancamento_id,
    descricao: linha.descricao ?? "",
    valor: Number(linha.valor),
    tipo: linha.tipo,
    data: linha.data_lancamento,
    contaId: linha.conta_id,
    categoriaId: linha.categoria_id,
    categoriaNome: categoria?.nome ?? null,
  };
}

// Lançamentos de uma pessoa, do mais recente para o mais antigo.
// O filtro por user_id fica aqui E no RLS do banco: se um falhar, o outro segura.
// categoriaId é opcional: se vier, traz só os lançamentos daquela categoria.
// Se der erro, a função lança a exceção e o error.tsx da página mostra a tela de erro.
export async function listarLancamentos(
  supabase: SupabaseClient,
  userId: string,
  categoriaId?: number,
): Promise<Lancamento[]> {
  let consulta = supabase.from("lancamentos").select(COLUNAS).eq("user_id", userId);

  if (categoriaId !== undefined) {
    consulta = consulta.eq("categoria_id", categoriaId);
  }

  const { data, error } = await consulta
    .order("data_lancamento", { ascending: false })
    // desempate: no mesmo dia, o cadastrado por último aparece primeiro
    .order("lancamento_id", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar lançamentos: ${error.message}`);
  }
  return (data as unknown as LinhaLancamento[]).map(paraLancamento);
}

// Um lançamento pelo id, só se for da pessoa.
// Se não existir (ou for de outra pessoa), devolve null.
export async function buscarLancamento(
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<Lancamento | null> {
  const { data, error } = await supabase
    .from("lancamentos")
    .select(COLUNAS)
    .eq("user_id", userId)
    .eq("lancamento_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar o lançamento: ${error.message}`);
  }
  return data ? paraLancamento(data as unknown as LinhaLancamento) : null;
}

// Quantas linhas pedir por vez. O Supabase devolve no máximo 1000 por consulta
// (configuração padrão do projeto); sem paginar, os totais sairiam errados sem aviso.
const LINHAS_POR_PAGINA = 1000;

// Lançamentos de uma pessoa entre duas datas (inclusive), do mais antigo para o mais recente.
// inicio e fim no formato AAAA-MM-DD. tipo é opcional: se vier, traz só entradas ou só saídas.
// Busca em páginas até acabar, para nunca perder lançamento num mês muito movimentado.
export async function listarLancamentosDoPeriodo(
  supabase: SupabaseClient,
  userId: string,
  inicio: string,
  fim: string,
  tipo?: Tipo,
): Promise<Lancamento[]> {
  const todos: Lancamento[] = [];

  for (let pagina = 0; ; pagina++) {
    let consulta = supabase
      .from("lancamentos")
      .select(COLUNAS)
      .eq("user_id", userId)
      .gte("data_lancamento", inicio)
      .lte("data_lancamento", fim);

    if (tipo !== undefined) {
      consulta = consulta.eq("tipo", tipo);
    }

    // A ordem precisa ser estável (data + id) para as páginas não repetirem nem pularem linhas.
    const { data, error } = await consulta
      .order("data_lancamento", { ascending: true })
      .order("lancamento_id", { ascending: true })
      .range(pagina * LINHAS_POR_PAGINA, (pagina + 1) * LINHAS_POR_PAGINA - 1);

    if (error) {
      throw new Error(`Erro ao buscar lançamentos do período: ${error.message}`);
    }

    const linhas = data as unknown as LinhaLancamento[];
    todos.push(...linhas.map(paraLancamento));

    if (linhas.length < LINHAS_POR_PAGINA) {
      return todos;
    }
  }
}

// ---------- Dashboard ----------

// Quanto uma categoria somou no período.
export interface TotalPorCategoria {
  categoriaId: number;
  nome: string;
  total: number;
}

// Total das saídas de um mês, para o gráfico. mes no formato AAAA-MM.
export interface SaidasDoMes {
  mes: string;
  total: number;
}

// Os números do mês escolhido.
export interface ResumoDoMes {
  entradas: number;
  saidas: number;
  resultado: number; // entradas − saídas; negativo quando gastou mais do que entrou
  categoriasQueMaisGastaram: TotalPorCategoria[]; // até 5, da maior para a menor
}

// ---------- Formulário de lançamento (novo e editar) ----------

// O que a pessoa preencheu, como texto, do jeito que veio do formulário.
// Volta para a tela quando há erro, para ela não precisar digitar tudo de novo.
export interface ValoresLancamento {
  descricao: string;
  valor: string;
  tipo: Tipo;
  data: string;
  contaId: string;
  categoriaId: string;
}

// Resposta da Server Action para o formulário.
// "tentativa" muda a cada envio com erro: o formulário usa como key para se remontar
// com os valores devolvidos (o React limpa o formulário depois de cada envio).
export interface EstadoFormLancamento {
  erro: string | null;
  valores: ValoresLancamento;
  tentativa: number;
}
