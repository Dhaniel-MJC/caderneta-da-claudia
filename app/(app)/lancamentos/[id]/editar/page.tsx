import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { FormLancamento } from "@/components/FormLancamento";
import { listarCategorias } from "@/lib/categorias";
import { listarContas } from "@/lib/contas";
import { textoParaId } from "@/lib/ids";
import { buscarLancamento, type EstadoFormLancamento } from "@/lib/lancamentos";
import { criarClienteServidor } from "@/lib/supabase/server";
import { valorParaTexto } from "@/lib/valor";
import { editarLancamento, excluirLancamento } from "../../actions";

export const dynamic = "force-dynamic";

// Editar um lançamento: /lancamentos/1/editar, /lancamentos/2/editar, ...
export default async function EditarLancamentoPage({
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
    redirect(`/login?next=/lancamentos/${numero}/editar`);
  }

  // Só encontra se o lançamento for desta pessoa (filtro por user_id + RLS).
  const [lancamento, contas, categorias] = await Promise.all([
    buscarLancamento(supabase, user.id, numero),
    listarContas(supabase, user.id),
    listarCategorias(supabase, user.id),
  ]);
  if (!lancamento) {
    notFound();
  }

  // Formulário já preenchido com o que está no banco.
  const estadoInicial: EstadoFormLancamento = {
    erro: null,
    tentativa: 0,
    valores: {
      descricao: lancamento.descricao,
      valor: valorParaTexto(lancamento.valor),
      tipo: lancamento.tipo,
      data: lancamento.data,
      contaId: String(lancamento.contaId),
      categoriaId: String(lancamento.categoriaId),
    },
  };

  // .bind() prende o id na action. O Next.js protege esse valor no envio,
  // e a action confere de novo se o lançamento é de quem está logado.
  const salvar = editarLancamento.bind(null, lancamento.id);
  const excluir = excluirLancamento.bind(null, lancamento.id);

  return (
    <Agenda secao="lancamentos">
      <Link href={`/lancamentos/${lancamento.id}`} className="aba-voltar">
        ← Voltar para o lançamento
      </Link>
      <h1>Editar lançamento</h1>

      <FormLancamento
        acao={salvar}
        estadoInicial={estadoInicial}
        contas={contas}
        categorias={categorias}
        textoBotao="Salvar alterações"
      />

      <hr />
      <BotaoExcluir
        acao={excluir}
        confirmacao={`Excluir ${
          lancamento.descricao ? `"${lancamento.descricao}"` : "este lançamento"
        }? Isso não pode ser desfeito.`}
        textoBotao="Excluir lançamento"
      />
    </Agenda>
  );
}
