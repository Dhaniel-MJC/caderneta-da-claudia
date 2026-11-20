import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { LancamentoCard } from "@/components/LancamentoCard";
import { buscarCategoria } from "@/lib/categorias";
import { listarLancamentos } from "@/lib/lancamentos";
import { textoParaId } from "@/lib/ids";
import { criarClienteServidor } from "@/lib/supabase/server";

// Detalhes de uma categoria: /categoria/1, /categoria/2, ...
export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = textoParaId(id);

  if (numero === null) {
    notFound();
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/categoria/${numero}`);
  }

  // Só encontra se a categoria for desta pessoa (filtro por user_id + RLS).
  const categoria = await buscarCategoria(supabase, user.id, numero);
  if (!categoria) {
    notFound();
  }

  // Lançamentos desta categoria, do mais recente para o mais antigo.
  const daCategoria = await listarLancamentos(supabase, user.id, categoria.id);

  return (
    <Agenda secao="categorias">
      <Link href="/categorias" className="aba-voltar">
        ← Voltar para as categorias
      </Link>
      <h1>
        <span className="categoria-cor" style={{ backgroundColor: categoria.cor }} aria-hidden="true" />
        {categoria.nome}
      </h1>
      <p>Categoria de {categoria.tipo === "entrada" ? "entrada" : "saída"}.</p>
      <p>
        <Link href={`/categoria/${categoria.id}/editar`}>Editar ou excluir</Link>
      </p>

      <h2>Lançamentos desta categoria</h2>
      {daCategoria.length === 0 ? (
        <p>Nenhum lançamento nesta categoria.</p>
      ) : (
        <ul className="lista">
          {daCategoria.map((lancamento) => (
            <li key={lancamento.id}>
              <LancamentoCard lancamento={lancamento} />
            </li>
          ))}
        </ul>
      )}
    </Agenda>
  );
}
