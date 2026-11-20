import { createBrowserClient } from "@supabase/ssr";
import { lerConfigSupabase } from "./env";

// Cliente do Supabase para o navegador (Client Components, os arquivos com "use client").
// Guarda a sessão em cookies, para que o servidor e o middleware também enxerguem o login.
// O createBrowserClient reaproveita o mesmo cliente se for chamado várias vezes.
export function criarClienteNavegador() {
  const { url, chave } = lerConfigSupabase();
  return createBrowserClient(url, chave);
}
