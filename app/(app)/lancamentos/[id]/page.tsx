import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buscarLancamento } from "@/lib/lancamentos";
import { textoParaId } from "@/lib/ids";
import { formatarData } from "@/lib/datas";
import { criarClienteServidor } from "@/lib/supabase/server";

// Um lançamento: /lancamentos/1, /lancamentos/2, ...
// No Next.js 15, "params" é uma promessa: precisamos do "await" para ler o id.
export default async function LancamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // O id vem da URL, então pode ser qualquer coisa: textoParaId devolve null se for inválido.
  const numero = textoParaId(id);
  if (numero === null) {
    notFound();
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/lancamentos/${numero}`);
  }

  // Só encontra se o lançamento for desta pessoa: trocar o id na URL
  // não mostra dado de outra pessoa (filtro por user_id + RLS no banco).
  const lancamento = await buscarLancamento(supabase, user.id, numero);
  if (!lancamento) {
    notFound();
  }

  const sinal = lancamento.tipo === "entrada" ? "+" : "-";

  return (
    <main>
      <p>
        <Link href="/lancamentos">← Voltar para a lista</Link>
      </p>
      <h1>{lancamento.descricao || "(sem descrição)"}</h1>
      <p>
        Valor: {sinal}{" "}
        {lancamento.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
      <p>Tipo: {lancamento.tipo === "entrada" ? "Entrada" : "Saída"}</p>
      <p>Data: {formatarData(lancamento.data)}</p>
      <p>Categoria: {lancamento.categoriaNome ?? "Sem categoria"}</p>
      <p>
        <Link href={`/lancamentos/${lancamento.id}/editar`}>Editar ou excluir</Link>
      </p>
    </main>
  );
}
