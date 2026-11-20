// URL e chave pública (anon) do projeto Supabase, lidas do .env.local.
// O prefixo NEXT_PUBLIC_ deixa o Next.js levar esses valores também para o navegador.
// A chave anon pode ser pública: quem protege os dados é o RLS no banco.
// Atenção: escreva process.env.NOME por extenso; o Next.js só troca pelo valor quando o nome é fixo.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function lerConfigSupabase(): { url: string; chave: string } {
  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local. " +
        "Depois de criar ou mudar o arquivo, reinicie o npm run dev.",
    );
  }
  return { url, chave };
}
