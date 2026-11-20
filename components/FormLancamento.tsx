"use client";

import { useActionState, useState } from "react";
import type { Categoria } from "@/lib/categorias";
import type { Conta } from "@/lib/contas";
import type { EstadoFormLancamento, Tipo } from "@/lib/lancamentos";

// Ação que grava o lançamento (criarLancamento, ou editarLancamento com o id preso por .bind()).
type AcaoLancamento = (
  estado: EstadoFormLancamento,
  formData: FormData,
) => Promise<EstadoFormLancamento>;

interface FormLancamentoProps {
  acao: AcaoLancamento;
  estadoInicial: EstadoFormLancamento;
  contas: Conta[];
  categorias: Categoria[];
  textoBotao: string;
}

// Formulário de lançamento, usado em /lancamentos/novo e /lancamentos/[id]/editar.
// Quem grava é a Server Action; aqui só mostramos o erro e travamos o botão durante o envio.
export function FormLancamento({
  acao,
  estadoInicial,
  contas,
  categorias,
  textoBotao,
}: FormLancamentoProps) {
  // estado: o que a action devolveu por último. enviando: true enquanto ela roda.
  const [estado, acaoDoForm, enviando] = useActionState(acao, estadoInicial);

  return (
    // Depois de cada envio o React limpa o formulário. A key muda a cada erro,
    // então o formulário é recriado já preenchido com o que a pessoa tinha digitado.
    <form key={estado.tentativa} action={acaoDoForm} className="form-lancamento">
      <CamposLancamento estado={estado} contas={contas} categorias={categorias} />

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

interface CamposLancamentoProps {
  estado: EstadoFormLancamento;
  contas: Conta[];
  categorias: Categoria[];
}

function CamposLancamento({ estado, contas, categorias }: CamposLancamentoProps) {
  const { valores } = estado;

  // Tipo e categoria são controlados: a lista de categorias mostra só as do tipo escolhido.
  const [tipo, setTipo] = useState<Tipo>(valores.tipo);
  const [categoriaId, setCategoriaId] = useState(() =>
    // Se a categoria salva não for do tipo do lançamento, começa sem categoria escolhida.
    categorias.some((c) => String(c.id) === valores.categoriaId && c.tipo === valores.tipo)
      ? valores.categoriaId
      : "",
  );

  const categoriasDoTipo = categorias.filter((categoria) => categoria.tipo === tipo);

  function trocarTipo(novo: Tipo) {
    setTipo(novo);
    // A categoria escolhida era do outro tipo: limpa para a pessoa escolher de novo.
    if (!categorias.some((c) => String(c.id) === categoriaId && c.tipo === novo)) {
      setCategoriaId("");
    }
  }

  return (
    <>
      <p>
        <label htmlFor="descricao">Descrição</label>
        <br />
        <input
          id="descricao"
          name="descricao"
          type="text"
          required
          maxLength={120}
          placeholder="Ex: mercado do mês"
          defaultValue={valores.descricao}
        />
      </p>

      <p>
        <label htmlFor="valor">Valor (R$)</label>
        <br />
        {/* type="text" com inputMode="decimal": aceita vírgula ("150,90") e abre o teclado numérico no celular. */}
        <input
          id="valor"
          name="valor"
          type="text"
          inputMode="decimal"
          required
          autoComplete="off"
          placeholder="0,00"
          defaultValue={valores.valor}
        />
      </p>

      <fieldset>
        <legend>Tipo</legend>
        <label>
          <input
            type="radio"
            name="tipo"
            value="saida"
            checked={tipo === "saida"}
            onChange={() => trocarTipo("saida")}
          />{" "}
          Saída
        </label>{" "}
        <label>
          <input
            type="radio"
            name="tipo"
            value="entrada"
            checked={tipo === "entrada"}
            onChange={() => trocarTipo("entrada")}
          />{" "}
          Entrada
        </label>
      </fieldset>

      <p>
        <label htmlFor="data">Data</label>
        <br />
        <input id="data" name="data" type="date" required defaultValue={valores.data} />
      </p>

      <p>
        <label htmlFor="contaId">Conta</label>
        <br />
        <select id="contaId" name="contaId" required defaultValue={valores.contaId}>
          <option value="" disabled>
            Escolha a conta
          </option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
      </p>

      <p>
        <label htmlFor="categoriaId">Categoria</label>
        <br />
        <select
          id="categoriaId"
          name="categoriaId"
          required
          value={categoriaId}
          onChange={(evento) => setCategoriaId(evento.target.value)}
        >
          <option value="" disabled>
            {categoriasDoTipo.length === 0
              ? `Nenhuma categoria de ${tipo === "entrada" ? "entrada" : "saída"}`
              : "Escolha a categoria"}
          </option>
          {categoriasDoTipo.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </p>
    </>
  );
}
