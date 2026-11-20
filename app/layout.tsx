import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProvedorUsuario } from "@/components/UsuarioContexto";
import { nomeDoUsuario, tituloCaderneta, usuarioLogado } from "@/lib/usuario";
import "./globals.css";

// Título da aba do navegador com o nome de quem está logado ("Caderneta de Claudia").
export async function generateMetadata(): Promise<Metadata> {
  const user = await usuarioLogado();
  return {
    title: tituloCaderneta(user),
    description: "Controle financeiro pessoal",
  };
}

// Layout raiz: envolve TODAS as telas do app.
// Descobre quem está logado para mostrar o nome na aba da agenda.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await usuarioLogado();

  return (
    <html lang="pt-BR">
      <body>
        <ProvedorUsuario nome={nomeDoUsuario(user)}>{children}</ProvedorUsuario>
      </body>
    </html>
  );
}
