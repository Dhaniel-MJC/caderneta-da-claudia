import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/server";

// Quem está logado nesta requisição (ou null).
// cache() faz o layout, o título da aba e a página dividirem uma única consulta ao Supabase,
// em vez de cada um perguntar de novo. Só vale dentro da mesma requisição.
export const usuarioLogado = cache(async (): Promise<User | null> => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Nome para mostrar na aba da agenda.
// Usa o nome informado no cadastro (guardado em user_metadata.nome).
// Se não houver, usa o começo do e-mail ("claudia@..." -> "claudia").
// Sem ninguém logado, devolve null.
export function nomeDoUsuario(user: User | null): string | null {
  if (!user) return null;

  const nome = user.user_metadata?.nome;
  if (typeof nome === "string" && nome.trim() !== "") {
    return nome.trim();
  }
  return user.email?.split("@")[0] ?? null;
}

// Título da caderneta com o primeiro nome: "Claudia Marques" -> "Caderneta de Claudia".
// Usamos "de" (e não "da"/"do") para não supor o gênero da pessoa pelo nome.
// Sem ninguém logado, fica só "Caderneta".
export function tituloCaderneta(user: User | null): string {
  const primeiroNome = nomeDoUsuario(user)?.split(" ")[0];
  return primeiroNome ? `Caderneta de ${primeiroNome}` : "Caderneta";
}
