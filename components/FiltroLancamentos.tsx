"use client";

import { useState } from "react";
import { LancamentoCard } from "@/components/LancamentoCard";
import type { Lancamento, Tipo } from "@/lib/lancamentos";

// Os três modos do botão, na ordem em que ele alterna.
type Modo = "tudo" | "entradas" | "saidas";

const ORDEM_MODOS: Modo[] = ["tudo", "entradas", "saidas"];

// Texto que aparece no botão em cada modo.
const NOMES_MODOS: Record<Modo, string> = {
  tudo: "Tudo",
  entradas: "Só entradas",
  saidas: "Só saídas",
};

// Qual tipo de lançamento cada modo deixa passar.
const TIPO_DO_MODO: Record<Exclude<Modo, "tudo">, Tipo> = {
  entradas: "entrada",
  saidas: "saida",
};

// Deixa o texto minúsculo e sem acento, para a busca ignorar acentos.
// Ex: "Mércado" -> "mercado". NFD separa a letra do acento; a faixa ̀-ͯ remove os acentos.
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR");
}

interface FiltroLancamentosProps {
  lancamentos: Lancamento[];
}

// Único pedaço interativo da página: filtra a lista enquanto a pessoa digita e alterna o tipo.
export function FiltroLancamentos({ lancamentos }: FiltroLancamentosProps) {
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<Modo>("tudo");

  const textoBusca = normalizarTexto(texto.trim());

  const filtrados = lancamentos.filter((lancamento) => {
    const bateTexto = normalizarTexto(lancamento.descricao).includes(textoBusca);
    const bateTipo = modo === "tudo" || lancamento.tipo === TIPO_DO_MODO[modo];
    return bateTexto && bateTipo;
  });

  // Vai para o próximo modo; depois do último, volta para "tudo".
  function alternarModo() {
    const proximo = ORDEM_MODOS[(ORDEM_MODOS.indexOf(modo) + 1) % ORDEM_MODOS.length];
    setModo(proximo);
  }

  // Total das saídas visíveis. Só soma lançamentos do tipo "saida".
  // Arredonda para centavos para evitar erros de ponto flutuante (ex: 0.1 + 0.2).
  const totalSaidas =
    Math.round(
      filtrados
        .filter((lancamento) => lancamento.tipo === "saida")
        .reduce((soma, lancamento) => soma + lancamento.valor, 0) * 100,
    ) / 100;

  // Total das entradas visíveis, no mesmo cálculo das saídas.
  const totalEntradas =
    Math.round(
      filtrados
        .filter((lancamento) => lancamento.tipo === "entrada")
        .reduce((soma, lancamento) => soma + lancamento.valor, 0) * 100,
    ) / 100;

  const textoTotalSaidas = totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const textoTotalEntradas = totalEntradas.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por descrição..."
          aria-label="Buscar lançamentos por descrição"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button type="button" onClick={alternarModo}>
          {NOMES_MODOS[modo]}
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p>Nenhum lançamento encontrado com esses filtros.</p>
      ) : (
        <>
          <p className="total-visivel">
            <strong>Total de entradas:</strong> {textoTotalEntradas}
          </p>
          <p className="total-visivel">
            <strong>Total de saídas:</strong> {textoTotalSaidas}
          </p>
          <ul className="lista">
            {filtrados.map((lancamento) => (
              <li key={lancamento.id}>
                <LancamentoCard lancamento={lancamento} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
