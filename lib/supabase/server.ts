import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lerConfigSupabase } from "./env";

// Cliente do Supabase para o servidor (Server Components e Server Actions).
// A sessão de quem está logado vem dos cookies da requisição.
// Crie um cliente novo a cada requisição: nunca guarde em variável global,
// senão a sessão de uma pessoa poderia vazar para outra.
export async function criarClienteServidor() {
  const { url, chave } = lerConfigSupabase();
  // No Next.js 15, cookies() é uma promessa.
  const cookieStore = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components não podem gravar cookies. Tudo bem: nas rotas privadas
          // o middleware já renovou a sessão e gravou os cookies antes de a página rodar.
        }
      },
    },
  });
}
