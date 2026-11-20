import { somarMeses } from "@/lib/datas";
import type {
  Lancamento,
  ResumoDoMes,
  SaidasDoMes,
  TotalPorCategoria,
} from "@/lib/lancamentos";

// Contas do dashboard. Só funções puras: recebem lançamentos já buscados e devolvem os números.
// Os tipos (ResumoDoMes etc.) ficam em lib/lancamentos.ts, junto com os outros tipos de lançamento.

// Quantas categorias aparecem no ranking de gastos.
const QUANTIDADE_NO_RANKING = 5;

// As somas são feitas em centavos (números inteiros), que o JavaScript soma sem erro.
// Somar 0.1 + 0.2 em reais daria 0.30000000000000004 (R10: dinheiro exato).
function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

function emReais(centavos: number): number {
  return centavos / 100;
}

// Entradas, saídas, resultado e as categorias que mais gastaram, a partir dos lançamentos do mês.
export function montarResumoDoMes(lancamentos: Lancamento[]): ResumoDoMes {
  let entradas = 0;
  let saidas = 0;
  // categoriaId -> { nome, centavos }
  const porCategoria = new Map<number, { nome: string; centavos: number }>();

  for (const lancamento of lancamentos) {
    const centavos = emCentavos(lancamento.valor);

    if (lancamento.tipo === "entrada") {
      entradas += centavos;
      continue;
    }

    saidas += centavos;
    const atual = porCategoria.get(lancamento.categoriaId);
    if (atual) {
      atual.centavos += centavos;
    } else {
      porCategoria.set(lancamento.categoriaId, {
        nome: lancamento.categoriaNome ?? "Sem categoria",
        centavos,
      });
    }
  }

  const categoriasQueMaisGastaram: TotalPorCategoria[] = [...porCategoria.entries()]
    // Maior gasto primeiro; empate fica em ordem alfabética, para a ordem não mudar a cada visita.
    .sort(([, a], [, b]) => b.centavos - a.centavos || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, QUANTIDADE_NO_RANKING)
    .map(([categoriaId, { nome, centavos }]) => ({ categoriaId, nome, total: emReais(centavos) }));

  return {
    entradas: emReais(entradas),
    saidas: emReais(saidas),
    resultado: emReais(entradas - saidas),
    categoriasQueMaisGastaram,
  };
}

// Total de saídas de cada mês, do mais antigo (primeiroMes) até ultimoMes, inclusive.
// Mês sem nenhuma saída aparece com total 0, para o gráfico não pular meses.
// Lançamentos de entrada ou fora do intervalo são ignorados.
export function somarSaidasPorMes(
  lancamentos: Lancamento[],
  primeiroMes: string,
  ultimoMes: string,
): SaidasDoMes[] {
  const centavosPorMes = new Map<string, number>();
  for (let mes = primeiroMes; mes <= ultimoMes; mes = somarMeses(mes, 1)) {
    centavosPorMes.set(mes, 0);
  }

  for (const lancamento of lancamentos) {
    if (lancamento.tipo !== "saida") continue;
    const mes = lancamento.data.slice(0, 7); // "2025-06-15" -> "2025-06"
    const atual = centavosPorMes.get(mes);
    if (atual !== undefined) {
      centavosPorMes.set(mes, atual + emCentavos(lancamento.valor));
    }
  }

  return [...centavosPorMes.entries()].map(([mes, centavos]) => ({ mes, total: emReais(centavos) }));
}
