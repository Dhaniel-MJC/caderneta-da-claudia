import Link from "next/link";
import { redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { CardNumero } from "@/components/CardNumero";
import { GraficoSaidas } from "@/components/GraficoSaidas";
import { montarResumoDoMes, somarSaidasPorMes } from "@/lib/dashboard";
import {
  mesAtual,
  mesValido,
  nomeDoMes,
  primeiroDiaDoMes,
  somarMeses,
  ultimoDiaDoMes,
} from "@/lib/datas";
import { listarLancamentosDoPeriodo } from "@/lib/lancamentos";
import { criarClienteServidor } from "@/lib/supabase/server";

// Dinâmica: a busca roda a cada acesso, com os dados de quem está logado e o mês da URL.
export const dynamic = "force-dynamic";

// Quantos meses o gráfico mostra, terminando no mês escolhido.
const MESES_NO_GRAFICO = 6;

interface DashboardPageProps {
  // No Next.js 15, searchParams é uma promessa. ?mes=a&mes=b chega como lista.
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}

// Dashboard: /dashboard?mes=AAAA-MM (sem ?mes=, usa o mês atual).
// Server Component: lê o mês da URL, busca no Supabase só os lançamentos do período
// e monta os números aqui no servidor. Só o gráfico roda no navegador.
// Se a busca falhar, o error.tsx desta pasta mostra a tela de erro.
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const parametros = await searchParams;
  const mesDaUrl = Array.isArray(parametros.mes) ? parametros.mes[0] : parametros.mes;
  const mesDaUrlValido = mesDaUrl !== undefined && mesValido(mesDaUrl);
  // Mês inválido na URL (ex: ?mes=junho) não quebra a página: cai no mês atual com um aviso.
  const mes = mesDaUrl !== undefined && mesDaUrlValido ? mesDaUrl : mesAtual();

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já barra quem não está logado; isto é só uma segunda proteção.
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard?mes=${mes}`)}`);
  }

  const inicio = primeiroDiaDoMes(mes);
  const fim = ultimoDiaDoMes(mes);
  const primeiroMesDoGrafico = somarMeses(mes, -(MESES_NO_GRAFICO - 1));

  // Duas buscas em paralelo, cada uma limitada ao seu período:
  // 1. todos os lançamentos do mês escolhido (para os cards);
  // 2. só as saídas dos últimos meses (para o gráfico).
  const [lancamentosDoMes, saidasRecentes] = await Promise.all([
    listarLancamentosDoPeriodo(supabase, user.id, inicio, fim),
    listarLancamentosDoPeriodo(
      supabase,
      user.id,
      primeiroDiaDoMes(primeiroMesDoGrafico),
      fim,
      "saida",
    ),
  ]);

  const resumo = montarResumoDoMes(lancamentosDoMes);
  const saidasPorMes = somarSaidasPorMes(saidasRecentes, primeiroMesDoGrafico, mes);
  const temSaidaNoGrafico = saidasPorMes.some((item) => item.total > 0);

  return (
    <Agenda secao="dashboard">
      <h1>Dashboard</h1>

      {/* Formulário comum (GET): troca o ?mes= da URL sem precisar de JavaScript. */}
      <form className="periodo" action="/dashboard" method="get">
        <Link href={`/dashboard?mes=${somarMeses(mes, -1)}`} aria-label="Mês anterior">
          ←
        </Link>
        <label>
          Mês <input type="month" name="mes" defaultValue={mes} required />
        </label>
        <button type="submit">Ver</button>
        <Link href={`/dashboard?mes=${somarMeses(mes, 1)}`} aria-label="Próximo mês">
          →
        </Link>
      </form>

      {mesDaUrl !== undefined && !mesDaUrlValido && (
        <p className="form-erro">Mês inválido no endereço. Mostrando o mês atual.</p>
      )}

      <h2 className="dashboard-titulo">{nomeDoMes(mes)}</h2>

      {lancamentosDoMes.length === 0 ? (
        <p>
          Nenhum lançamento em {nomeDoMes(mes)}.{" "}
          <Link href="/lancamentos/novo">Cadastrar um lançamento</Link>
        </p>
      ) : (
        <>
          <div className="dashboard-cards">
            <CardNumero titulo="Entradas" valor={resumo.entradas} inicio={inicio} fim={fim} tom="entrada" />
            <CardNumero titulo="Saídas" valor={resumo.saidas} inicio={inicio} fim={fim} tom="saida" />
            <CardNumero
              titulo="Resultado do mês"
              valor={resumo.resultado}
              inicio={inicio}
              fim={fim}
              tom={resumo.resultado < 0 ? "saida" : "entrada"}
            />
          </div>

          <h2 className="dashboard-titulo">Categorias que mais gastaram</h2>
          {resumo.categoriasQueMaisGastaram.length === 0 ? (
            <p>Nenhuma saída neste mês.</p>
          ) : (
            <ol className="dashboard-cards">
              {resumo.categoriasQueMaisGastaram.map((categoria) => (
                <li key={categoria.categoriaId}>
                  <CardNumero
                    titulo={categoria.nome}
                    valor={categoria.total}
                    inicio={inicio}
                    fim={fim}
                    tom="saida"
                  />
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <h2 className="dashboard-titulo">Saídas mês a mês</h2>
      {temSaidaNoGrafico ? (
        <GraficoSaidas meses={saidasPorMes} mesEscolhido={mes} />
      ) : (
        <p>Nenhuma saída nos últimos {MESES_NO_GRAFICO} meses.</p>
      )}
    </Agenda>
  );
}
