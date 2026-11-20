"use client";

import { createContext, useContext, type ReactNode } from "react";

// Guarda o nome de quem está logado para qualquer componente da página usar.
// O layout raiz busca o nome no servidor e entrega aqui.
const ContextoNome = createContext<string | null>(null);

export function ProvedorUsuario({ nome, children }: { nome: string | null; children: ReactNode }) {
  return <ContextoNome.Provider value={nome}>{children}</ContextoNome.Provider>;
}

// Texto da aba da pessoa: o nome de quem entrou, ou "Início" se ninguém entrou.
export function NomeUsuario() {
  const nome = useContext(ContextoNome);
  return <>{nome ?? "Início"}</>;
}
