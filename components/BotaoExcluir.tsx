"use client";

import { useActionState, type FormEvent } from "react";
import type { EstadoExclusao } from "@/lib/formularios";

interface BotaoExcluirProps {
  // Server Action de excluir, com o id preso por .bind() na página.
  acao: (estado: EstadoExclusao, formData: FormData) => Promise<EstadoExclusao>;
  // Pergunta mostrada antes de excluir, ex: 'Excluir "Mercado"? Isso não pode ser desfeito.'
  confirmacao: string;
  textoBotao: string;
}

// Botão de excluir com confirmação, usado em lançamentos e categorias.
// É um formulário separado: HTML não permite um formulário dentro do outro.
export function BotaoExcluir({ acao, confirmacao, textoBotao }: BotaoExcluirProps) {
  const [estado, acaoDoForm, excluindo] = useActionState(acao, { erro: null });

  // Se a pessoa cancelar, preventDefault impede o envio: a action nem é chamada.
  function confirmar(evento: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmacao)) {
      evento.preventDefault();
    }
  }

  return (
    <form action={acaoDoForm} onSubmit={confirmar} className="form-excluir">
      {estado.erro && (
        <p role="alert" className="form-erro">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao-perigo" disabled={excluindo} aria-busy={excluindo}>
        {excluindo ? "Excluindo..." : textoBotao}
      </button>
    </form>
  );
}
