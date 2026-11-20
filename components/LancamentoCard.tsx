import Link from "next/link";
import type { Lancamento } from "@/lib/lancamentos";
import { formatarData } from "@/lib/datas";

// Props tipadas: este componente só aceita um "lancamento" do tipo Lancamento.
interface LancamentoCardProps {
  lancamento: Lancamento;
}

// Formata número como dinheiro em reais, ex: 341.43 -> "R$ 341,43".
function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function LancamentoCard({ lancamento }: LancamentoCardProps) {
  const sinal = lancamento.tipo === "entrada" ? "+" : "-";

  return (
    <Link href={`/lancamentos/${lancamento.id}`} className="card">
      <p className="card-descricao">{lancamento.descricao || "(sem descrição)"}</p>
      <p className={lancamento.tipo === "entrada" ? "card-valor-entrada" : "card-valor-saida"}>
        {sinal} {formatarValor(lancamento.valor)}
      </p>
      <p className="card-data">
        {formatarData(lancamento.data)} · {lancamento.categoriaNome ?? "Sem categoria"}
      </p>
    </Link>
  );
}
