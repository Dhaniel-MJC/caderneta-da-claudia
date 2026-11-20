import Link from "next/link";
import { redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { FiltroLancamentos } from "@/components/FiltroLancamentos";
import { listarLancamentos } from "@/lib/lancamentos";
import { criarClienteServidor } from "@/lib/supabase/server";

// Dinâmica: a busca roda a cada acesso, com os dados de quem está logado.
export const dynamic = "force-dynamic";

// Lista de lançamentos: /lancamentos
// Server Component: descobre quem está logado e busca os dados no servidor.
// Só o FiltroLancamentos é interativo.
// Se listarLancamentos falhar, o error.tsx desta pasta mostra a tela de erro.
export default async function LancamentosPage() {
  const supabase = await criarClienteServidor();

  // Quem está logado? getUser() confere o login com o Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já barra quem não está logado; isto é só uma segunda proteção.
  if (!user) {
    redirect("/login?next=/lancamentos");
  }

  const lancamentos = await listarLancamentos(supabase, user.id);

  return (
    <Agenda secao="lancamentos">
      <h1>Lançamentos</h1>
      <p>
        <Link href="/lancamentos/novo" className="aba-voltar">
          + Novo lançamento
        </Link>
      </p>
      {lancamentos.length === 0 ? (
        <p>Nenhum lançamento cadastrado ainda.</p>
      ) : (
        <FiltroLancamentos lancamentos={lancamentos} />
      )}
    </Agenda>
  );
}
