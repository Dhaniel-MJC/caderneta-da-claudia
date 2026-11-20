import Link from "next/link";
import { redirect } from "next/navigation";
import { Agenda } from "@/components/Agenda";
import { CategoriaCard } from "@/components/CategoriaCard";
import { listarCategorias } from "@/lib/categorias";
import { criarClienteServidor } from "@/lib/supabase/server";

// Dinâmica: busca as categorias de quem está logado a cada acesso.
export const dynamic = "force-dynamic";

// Lista de categorias: /categorias
export default async function CategoriasPage() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já barra quem não está logado; isto é só uma segunda proteção.
  if (!user) {
    redirect("/login?next=/categorias");
  }

  const categorias = await listarCategorias(supabase, user.id);

  return (
    <Agenda secao="categorias">
      <h1>Categorias</h1>
      <p>
        <Link href="/categorias/nova" className="aba-voltar">
          + Nova categoria
        </Link>
      </p>
      {categorias.length === 0 ? (
        <p>Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <ul className="lista">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <CategoriaCard categoria={categoria} />
            </li>
          ))}
        </ul>
      )}
    </Agenda>
  );
}
