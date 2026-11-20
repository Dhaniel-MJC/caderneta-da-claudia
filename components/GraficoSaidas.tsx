"use client";

import { useState } from "react";
import { nomeCurtoDoMes, nomeDoMes } from "@/lib/datas";
import type { SaidasDoMes } from "@/lib/lancamentos";
import { formatarReais } from "@/lib/valor";

interface GraficoSaidasProps {
  meses: SaidasDoMes[]; // do mais antigo para o mais recente
  mesEscolhido: string; // AAAA-MM; começa destacado
}

// Gráfico de barras das saídas mês a mês, feito só com divs (sem biblioteca).
// É o único pedaço do dashboard que roda no navegador: clicar numa barra mostra o valor daquele mês.
export function GraficoSaidas({ meses, mesEscolhido }: GraficoSaidasProps) {
  const [selecionado, setSelecionado] = useState(mesEscolhido);

  // A barra mais alta ocupa a altura toda; as outras ficam proporcionais a ela.
  const maior = Math.max(0, ...meses.map((item) => item.total));
  const itemSelecionado = meses.find((item) => item.mes === selecionado);

  return (
    <figure className="grafico">
      <div className="grafico-barras">
        {meses.map((item) => {
          const altura = maior > 0 ? (item.total / maior) * 100 : 0;
          const ativo = item.mes === selecionado;
          return (
            <button
              key={item.mes}
              type="button"
              className={`grafico-coluna${ativo ? " grafico-coluna-ativa" : ""}`}
              onClick={() => setSelecionado(item.mes)}
              aria-pressed={ativo}
              aria-label={`${nomeDoMes(item.mes)}: ${formatarReais(item.total)} em saídas`}
            >
              <span className="grafico-trilho">
                {/* Mês com gasto pequeno ainda ganha 2px, para não parecer zero. */}
                <span
                  className="grafico-barra"
                  style={{ height: item.total > 0 ? `max(${altura}%, 2px)` : "0" }}
                />
              </span>
              <span className="grafico-rotulo">{nomeCurtoDoMes(item.mes)}</span>
            </button>
          );
        })}
      </div>
      <figcaption className="grafico-legenda" aria-live="polite">
        {itemSelecionado
          ? `Saídas em ${nomeDoMes(itemSelecionado.mes)}: ${formatarReais(itemSelecionado.total)}`
          : "Clique numa barra para ver o valor do mês."}
      </figcaption>
    </figure>
  );
}
