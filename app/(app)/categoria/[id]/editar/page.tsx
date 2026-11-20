import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { FormCategoria } from "@/components/FormCategoria";
import { buscarCategoria, contarUsoCategoria, type EstadoFormCategoria } from "@/lib/categorias";
import { textoParaId } from "@/lib/ids";
import { criarClienteServidor } from "@/lib/supabase/server";
import { editarCategoria, excluirCategoria } from "../../../categorias/actions";

export const dynamic = "force-dynamic";

// Editar uma categoria: /categoria/1/editar, /categoria/2/editar, ...
export default async function EditarCategoriaPage({
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
    redirect(`/login?next=/categoria/${numero}/editar`);
  }

  // Só encontra se a categoria for desta pessoa (filtro por user_id + RLS).
  const [categoria, uso] = await Promise.all([
    buscarCategoria(supabase, user.id, numero),
    contarUsoCategoria(supabase, user.id, numero),
  ]);
  if (!categoria) {
    notFound();
  }

  const estadoInicial: EstadoFormCategoria = {
    erro: null,
    tentativa: 0,
    // O <input type="color"> só aceita a cor em minúsculas.
    valores: { nome: categoria.nome, tipo: categoria.tipo, cor: categoria.cor.toLowerCase() },
  };

  const emUso = uso.lancamentos > 0 || uso.recorrencias > 0;
  const salvar = editarCategoria.bind(null, categoria.id);
  const excluir = excluirCategoria.bind(null, categoria.id);

  return (
    <Agenda secao="categorias">
      <Link href={`/categoria/${categoria.id}`} className="aba-voltar">
        ← Voltar para a categoria
      </Link>
      <h1>Editar categoria</h1>

      <FormCategoria
        acao={salvar}
        estadoInicial={estadoInicial}
        textoBotao="Salvar alterações"
        tipoTravado={uso.lancamentos > 0}
      />

      <hr />
      {emUso ? (
        // R9: apagar a categoria não pode apagar o histórico. O banco também barra.
        <p>
          Esta categoria não pode ser excluída porque é usada por{" "}
          {[
            uso.lancamentos > 0 ? `${uso.lancamentos} lançamento(s)` : null,
            uso.recorrencias > 0 ? `${uso.recorrencias} recorrência(s)` : null,
          ]
            .filter(Boolean)
            .join(" e ")}
          . Para excluir, mude esses lançamentos para outra categoria antes.
        </p>
      ) : (
        <BotaoExcluir
          acao={excluir}
          confirmacao={`Excluir a categoria "${categoria.nome}"? Isso não pode ser desfeito.`}
          textoBotao="Excluir categoria"
        />
      )}
    </Agenda>
  );
}
