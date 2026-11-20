import type { ReactNode } from "react";

// Layout da área do app. A navegação agora fica nas abas da agenda (components/Agenda.tsx),
// então este layout só repassa o conteúdo.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
