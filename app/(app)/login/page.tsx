import Link from "next/link";
import { Agenda } from "@/components/Agenda";
import { BotaoSair } from "@/components/BotaoSair";
import { FormLogin } from "@/components/FormLogin";
import { destinoSeguro } from "@/lib/destino";
import { criarClienteServidor } from "@/lib/supabase/server";

// Tela de login: /login
// Server Component: vê no servidor se alguém já está logado.
// - Logado: mostra o e-mail e o botão de sair.
// - Não logado: mostra o formulário de entrar e criar conta.
// ?next=/alguma-pagina diz para onde ir depois de entrar (o middleware preenche).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const destino = destinoSeguro(typeof next === "string" ? next : undefined);

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Agenda secao="login">
      <h1>Login</h1>
      {user ? (
        <>
          <p>
            Você entrou como <strong>{user.email}</strong>.
          </p>
          <p>
            <Link href="/lancamentos">Ver meus lançamentos</Link>
          </p>
          <BotaoSair />
        </>
      ) : (
        <FormLogin destino={destino} />
      )}
    </Agenda>
  );
}
