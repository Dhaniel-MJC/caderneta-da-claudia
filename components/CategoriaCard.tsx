import Link from "next/link";
import type { Categoria } from "@/lib/categorias";

// Props tipadas: recebe uma categoria.
interface CategoriaCardProps {
  categoria: Categoria;
}

export function CategoriaCard({ categoria }: CategoriaCardProps) {
  return (
    <Link href={`/categoria/${categoria.id}`} className="card">
      <p className="card-descricao">
        {/* Bolinha com a cor da categoria. É só enfeite, por isso aria-hidden. */}
        <span className="categoria-cor" style={{ backgroundColor: categoria.cor }} aria-hidden="true" />
        {categoria.nome}
      </p>
      <p className="card-data">{categoria.tipo === "entrada" ? "Entrada" : "Saída"}</p>
    </Link>
  );
}
