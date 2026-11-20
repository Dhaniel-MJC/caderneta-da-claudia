import { formatarData } from "@/lib/datas";
import { formatarReais } from "@/lib/valor";

// Cor do valor: azul para dinheiro que entrou, vermelho para o que saiu, sem cor para o resto.
export type TomDoValor = "entrada" | "saida" | "neutro";

const CLASSE_DO_TOM: Record<TomDoValor, string | undefined> = {
  entrada: "card-valor-entrada",
  saida: "card-valor-saida",
  neutro: undefined,
};

interface CardNumeroProps {
  titulo: string;
  valor: number; // em reais
  inicio: string; // AAAA-MM-DD
  fim: string; // AAAA-MM-DD
  tom?: TomDoValor;
}

// Card de um número do dashboard: título, valor em reais e o período a que ele se refere.
// Server Component: não tem nada interativo, então não vai JavaScript para o navegador.
export function CardNumero({ titulo, valor, inicio, fim, tom = "neutro" }: CardNumeroProps) {
  return (
    <div className="card">
      <p className="card-descricao">{titulo}</p>
      <p className={`card-numero ${CLASSE_DO_TOM[tom] ?? ""}`}>{formatarReais(valor)}</p>
      <p className="card-data">
        {formatarData(inicio)} a {formatarData(fim)}
      </p>
    </div>
  );
}
