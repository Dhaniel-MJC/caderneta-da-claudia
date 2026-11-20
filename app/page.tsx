import { Agenda } from "@/components/Agenda";
import { tituloCaderneta, usuarioLogado } from "@/lib/usuario";

// Tela de apresentação: / (agenda fechada)
// O título leva o primeiro nome de quem está logado: "Caderneta de Claudia".
export default async function HomePage() {
  const user = await usuarioLogado();

  return (
    <Agenda secao="inicio" aberta={false}>
      <h1>{tituloCaderneta(user)}</h1>
      <p>Um jeito simples de acompanhar o dinheiro da família.</p>
    </Agenda>
  );
}
