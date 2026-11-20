"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

// Traduz as mensagens de erro mais comuns do Supabase.
function traduzirErro(mensagem: string): string {
  if (mensagem.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (mensagem.includes("Email not confirmed"))
    return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (mensagem.includes("User already registered")) return "Esse e-mail já tem cadastro. Use Entrar.";
  if (mensagem.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (mensagem.toLowerCase().includes("rate limit"))
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  return `Não foi possível concluir: ${mensagem}`;
}

interface FormLoginProps {
  // Página para onde ir depois de entrar (já validada no servidor).
  destino: string;
}

// Formulário de entrar e criar conta, com e-mail e senha.
// Client Component: usa o cliente do Supabase do navegador, que grava a sessão em cookies.
export function FormLogin({ destino }: FormLoginProps) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Vai para o destino e pede ao servidor para refazer as páginas já com a sessão nova.
  function irParaDestino() {
    router.replace(destino);
    router.refresh();
  }

  // Volta do link de confirmação do e-mail: a URL chega com ?code=...
  // Ao ser criado, o cliente do navegador troca esse código por uma sessão sozinho;
  // getSession() espera essa troca terminar.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("code")) return;

    const supabase = criarClienteNavegador();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(destino);
        router.refresh();
      } else {
        setErro("Link de confirmação inválido ou expirado. Tente entrar com seu e-mail e senha.");
      }
    });
  }, [destino, router]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // Qual botão foi apertado? Enter no teclado conta como o primeiro (Entrar).
    const botao = (evento.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const acao = botao?.value === "cadastrar" ? "cadastrar" : "entrar";

    setEnviando(true);
    setErro(null);
    setAviso(null);

    try {
      const supabase = criarClienteNavegador();

      if (acao === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          setErro(traduzirErro(error.message));
          return;
        }
        irParaDestino();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          // Nome que aparece na aba da agenda (fica em user_metadata.nome).
          data: nome.trim() ? { nome: nome.trim() } : undefined,
          // Para onde o link de confirmação do e-mail leva de volta.
          emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(destino)}`,
        },
      });
      if (error) {
        setErro(traduzirErro(error.message));
        return;
      }
      // Com confirmação de e-mail ligada, o Supabase não diz que o e-mail já existe
      // (para não revelar quem tem conta): devolve um usuário sem "identities".
      if (data.user && data.user.identities?.length === 0) {
        setErro("Esse e-mail já tem cadastro. Use Entrar.");
        return;
      }
      if (data.session) {
        // Confirmação de e-mail desligada no Supabase: já entra direto.
        irParaDestino();
        return;
      }
      setAviso("Conta criada! Abra o link que enviamos para o seu e-mail para confirmar.");
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="form-login">
      <p>
        <label htmlFor="nome">Nome (só para criar conta)</label>
        <br />
        <input
          id="nome"
          type="text"
          autoComplete="given-name"
          maxLength={60}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
        />
      </p>
      <p>
        <label htmlFor="email">E-mail</label>
        <br />
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
      </p>
      <p>
        <label htmlFor="senha">Senha (mínimo 6 caracteres)</label>
        <br />
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </p>

      {erro && <p role="alert">{erro}</p>}
      {aviso && <p role="status">{aviso}</p>}

      <p>
        <button type="submit" name="acao" value="entrar" disabled={enviando}>
          {enviando ? "Aguarde..." : "Entrar"}
        </button>{" "}
        <button type="submit" name="acao" value="cadastrar" disabled={enviando}>
          Criar conta
        </button>
      </p>
    </form>
  );
}
