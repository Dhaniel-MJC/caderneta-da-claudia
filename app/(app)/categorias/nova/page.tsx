import Link from "next/link";
import { Agenda } from "@/components/Agenda";
import { FormCategoria } from "@/components/FormCategoria";
import type { EstadoFormCategoria } from "@/lib/categorias";
import { criarCategoria } from "../actions";

// Nova categoria: /categorias/nova
// O middleware já barra quem não está logado, e a action confere o login de novo ao salvar.
export default function NovaCategoriaPage() {
  const estadoInicial: EstadoFormCategoria = {
    erro: null,
    tentativa: 0,
    valores: { nome: "", tipo: "saida", cor: "#5fb8b0" },
  };

  return (
    <Agenda secao="categorias">
      <Link href="/categorias" className="aba-voltar">
        ← Voltar para as categorias
      </Link>
      <h1>Nova categoria</h1>
      <FormCategoria acao={criarCategoria} estadoInicial={estadoInicial} textoBotao="Salvar categoria" />
    </Agenda>
  );
}
