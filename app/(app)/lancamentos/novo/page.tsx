import Link from "next/link";
import { redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { FormLancamento } from "@/components/FormLancamento";
import { listarCategorias } from "@/lib/categorias";
import { listarContas } from "@/lib/contas";
import { hojeISO } from "@/lib/datas";
import type { EstadoFormLancamento } from "@/lib/lancamentos";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarLancamento } from "../actions";

export const dynamic = "force-dynamic";

// Novo lançamento: /lancamentos/novo
// Server Component: busca as contas e categorias de quem está logado
// e entrega para o formulário (Client Component).
export default async function NovoLancamentoPage() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/lancamentos/novo");
  }

  const [contas, categorias] = await Promise.all([
    listarContas(supabase, user.id),
    listarCategorias(supabase, user.id),
  ]);

  // Formulário em branco: saída, com a data de hoje e a conta já escolhida se só houver uma.
  const estadoInicial: EstadoFormLancamento = {
    erro: null,
    tentativa: 0,
    valores: {
      descricao: "",
      valor: "",
      tipo: "saida",
      data: hojeISO(),
      contaId: contas.length === 1 ? String(contas[0].id) : "",
      categoriaId: "",
    },
  };

  return (
    <Agenda secao="lancamentos">
      <Link href="/lancamentos" className="aba-voltar">
        ← Voltar para a lista
      </Link>
      <h1>Novo lançamento</h1>

      {contas.length === 0 || categorias.length === 0 ? (
        <p>
          Para lançar, você precisa ter pelo menos uma conta e uma categoria cadastradas.
        </p>
      ) : (
        <FormLancamento
          acao={criarLancamento}
          estadoInicial={estadoInicial}
          contas={contas}
          categorias={categorias}
          textoBotao="Salvar lançamento"
        />
      )}
    </Agenda>
  );
}
