import Link from "next/link";

// Mostrada quando a página não existe (ou quando chamamos notFound()).
export default function NotFound() {
  return (
    <main>
      <h1>Página não encontrada</h1>
      <p>
        <Link href="/">Voltar para o início</Link>
      </p>
    </main>
  );
}
