"use client";

import { useActionState, useState } from "react";
import type { EstadoFormCategoria } from "@/lib/categorias";

// Ação que grava a categoria (criarCategoria, ou editarCategoria com o id preso por .bind()).
type AcaoCategoria = (
  estado: EstadoFormCategoria,
  formData: FormData,
) => Promise<EstadoFormCategoria>;

interface FormCategoriaProps {
  acao: AcaoCategoria;
  estadoInicial: EstadoFormCategoria;
  textoBotao: string;
  // Categoria já usada em lançamentos: o tipo fica travado.
  tipoTravado?: boolean;
}

// Formulário de categoria, usado em /categorias/nova e /categoria/[id]/editar.
export function FormCategoria({ acao, estadoInicial, textoBotao, tipoTravado = false }: FormCategoriaProps) {
  const [estado, acaoDoForm, enviando] = useActionState(acao, estadoInicial);

  return (
    // A key muda a cada erro: o formulário é recriado já preenchido com o que foi digitado.
    <form key={estado.tentativa} action={acaoDoForm} className="form-lancamento">
      <CamposCategoria estado={estado} tipoTravado={tipoTravado} />

      {estado.erro && (
        <p role="alert" className="form-erro">
          {estado.erro}
        </p>
      )}

      <p>
        <button type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? "Salvando..." : textoBotao}
        </button>
      </p>
    </form>
  );
}

function CamposCategoria({
  estado,
  tipoTravado,
}: {
  estado: EstadoFormCategoria;
  tipoTravado: boolean;
}) {
  const { valores } = estado;
  // Só para a prévia: mostra o nome com a bolinha da cor enquanto a pessoa escolhe.
  const [nome, setNome] = useState(valores.nome);
  const [cor, setCor] = useState(valores.cor);

  return (
    <>
      <p>
        <label htmlFor="nome">Nome</label>
        <br />
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={40}
          placeholder="Ex: Mercado"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
        />
      </p>

      <fieldset>
        <legend>Tipo</legend>
        {/* Rádio desabilitado não vai no envio: o hidden manda o tipo atual. */}
        {tipoTravado && <input type="hidden" name="tipo" value={valores.tipo} />}
        <label>
          <input
            type="radio"
            name="tipo"
            value="saida"
            defaultChecked={valores.tipo === "saida"}
            disabled={tipoTravado}
          />{" "}
          Saída
        </label>{" "}
        <label>
          <input
            type="radio"
            name="tipo"
            value="entrada"
            defaultChecked={valores.tipo === "entrada"}
            disabled={tipoTravado}
          />{" "}
          Entrada
        </label>
        {tipoTravado && (
          <>
            <br />
            <small>O tipo não pode mudar porque já há lançamentos nesta categoria.</small>
          </>
        )}
      </fieldset>

      <p>
        <label htmlFor="cor">Cor</label>
        <br />
        <input
          id="cor"
          name="cor"
          type="color"
          value={cor}
          onChange={(evento) => setCor(evento.target.value)}
        />{" "}
        <span className="previa-categoria">
          <span className="categoria-cor" style={{ backgroundColor: cor }} aria-hidden="true" />
          {nome.trim() || "Prévia"}
        </span>
      </p>
    </>
  );
}
