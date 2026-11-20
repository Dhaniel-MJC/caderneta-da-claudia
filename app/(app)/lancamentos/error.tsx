"use client";

import { Agenda } from "@/components/Agenda";

// Mostrada quando a busca de lançamentos falha. O Next.js passa uma função "reset" para tentar de novo.
// Precisa ser Client Component, porque o botão de tentar de novo é interativo.
export default function ErroLancamentos({ reset }: { reset: () => void }) {
  return (
    <Agenda secao="lancamentos">
      <h1>Não foi possível carregar os lançamentos</h1>
      <p>Tente novamente em instantes.</p>
      <button type="button" onClick={() => reset()}>
        Tentar de novo
      </button>
    </Agenda>
  );
}
