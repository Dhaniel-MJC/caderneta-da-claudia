"use client";

import { Agenda } from "@/components/Agenda";

// Mostrada quando a busca do dashboard falha. O Next.js passa uma função "reset" para tentar de novo.
export default function ErroDashboard({ reset }: { reset: () => void }) {
  return (
    <Agenda secao="dashboard">
      <h1>Não foi possível carregar o dashboard</h1>
      <p>Tente novamente em instantes.</p>
      <button type="button" onClick={() => reset()}>
        Tentar de novo
      </button>
    </Agenda>
  );
}
