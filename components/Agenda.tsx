import Link from "next/link";
import type { ReactNode } from "react";
import { NomeUsuario } from "@/components/UsuarioContexto";

// Identificador de cada aba/seção da agenda.
export type SecaoId = "inicio" | "lancamentos" | "dashboard" | "categorias" | "login";

// Cor de cada aba (classe aba-1 a aba-5). Fica ligada à aba, não à posição,
// para que a cor não mude quando a ordem das abas mudar.
const COR_DA_ABA: Record<SecaoId, number> = {
  inicio: 1,
  lancamentos: 2,
  dashboard: 3,
  categorias: 4,
  login: 5,
};

// Seções (abas depois do nome). A ordem aqui é a ordem na tela.
const SECOES: { id: SecaoId; nome: ReactNode; href: string }[] = [
  { id: "login", nome: "Login", href: "/login" },
  { id: "categorias", nome: "Categorias", href: "/categorias" },
  { id: "lancamentos", nome: "Lançamentos", href: "/lancamentos" },
  { id: "dashboard", nome: "Dashboard", href: "/dashboard" },
];

type AgendaProps = {
  // Aba que está aberta no momento.
  secao: SecaoId;
  // false = agenda fechada (capa). true = agenda aberta em duas páginas.
  aberta?: boolean;
  // Conteúdo da página da direita (opcional).
  direita?: ReactNode;
  children: ReactNode;
};

// Moldura da agenda: abas coloridas no topo + capa fechada ou páginas abertas.
export function Agenda({ secao, aberta = true, direita, children }: AgendaProps) {
  // A aba da pessoa (usuário) fica entre Login e Categorias.
  // NomeUsuario mostra o nome de quem entrou (vem do layout raiz).
  const abas = [
    SECOES[0],
    { id: "inicio" as SecaoId, nome: <NomeUsuario />, href: "/" },
    ...SECOES.slice(1),
  ];

  return (
    <div className="agenda">
      <nav className="abas" aria-label="Seções da agenda">
        {abas.map((aba) => {
          const ativa = aba.id === secao;
          return (
            <Link
              key={aba.id}
              href={aba.href}
              className={`aba aba-${COR_DA_ABA[aba.id]}${ativa ? " aba-ativa" : ""}`}
              aria-current={ativa ? "page" : undefined}
            >
              {aba.nome}
            </Link>
          );
        })}
      </nav>

      <div className={`livro ${aberta ? "livro-aberto" : "livro-fechado"}`}>
        {aberta ? (
          <>
            <section className="pagina pagina-esquerda">{children}</section>
            <section className="pagina pagina-direita">{direita}</section>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
