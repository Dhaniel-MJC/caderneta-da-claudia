import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { lerConfigSupabase } from "@/lib/supabase/env";

// Rotas que exigem login. As outras (/, /login) são abertas.
const ROTAS_PRIVADAS = ["/lancamentos", "/dashboard", "/categorias", "/categoria"];

function ehPrivada(caminho: string): boolean {
  // "/categoria" e "/categoria/3" são privadas; "/categoriasxyz" não confunde com "/categorias".
  return ROTAS_PRIVADAS.some((rota) => caminho === rota || caminho.startsWith(rota + "/"));
}

// Roda antes de todas as páginas (veja o matcher no fim do arquivo).
// 1. Renova a sessão do Supabase se ela estiver para vencer, gravando os cookies novos.
//    Isso precisa valer também para / e /login: páginas não conseguem gravar cookies,
//    e o código de renovação só pode ser usado uma vez. Sem isso, a pessoa "cairia" do login.
// 2. Nas rotas privadas, se ninguém estiver logado, manda para /login com ?next= a página pedida.
export async function middleware(request: NextRequest) {
  const { url, chave } = lerConfigSupabase();
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar) {
        // Grava na requisição (para a página enxergar a sessão nova)
        // e na resposta (para o navegador guardar).
        cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesParaGravar.forEach(({ name, value, options }) =>
          resposta.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() confere o login com o servidor do Supabase (não confia só no cookie).
  // Não coloque nenhum código entre createServerClient e getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && ehPrivada(request.nextUrl.pathname)) {
    const urlLogin = request.nextUrl.clone();
    urlLogin.pathname = "/login";
    urlLogin.search = "";
    urlLogin.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(urlLogin);
  }

  // Devolva sempre esta resposta: é ela que leva os cookies renovados.
  return resposta;
}

// Todas as páginas, menos os arquivos internos do Next.js e as imagens.
// Quem decide o que é privado é a lista ROTAS_PRIVADAS lá em cima.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
