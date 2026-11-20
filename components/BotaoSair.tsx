"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

// Botão de sair: apaga a sessão (cookies) e volta para o /login já deslogado.
export function BotaoSair() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function sair() {
    setSaindo(true);
    setErro(null);
    try {
      const { error } = await criarClienteNavegador().auth.signOut();
      if (error) {
        setErro("Não foi possível sair. Tente de novo.");
        return;
      }
      // refresh() faz o servidor redesenhar a página, agora sem ninguém logado.
      router.replace("/login");
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor. Tente de novo.");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <>
      <button type="button" onClick={sair} disabled={saindo}>
        {saindo ? "Saindo..." : "Sair"}
      </button>
      {erro && <p role="alert">{erro}</p>}
    </>
  );
}
