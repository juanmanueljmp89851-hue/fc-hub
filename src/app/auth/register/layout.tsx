import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta — Modo Fosa",
  description: "Registrate en Modo Fosa, la comunidad de EA FC Argentina. Torneos, ranking, cartas y más.",
  robots: { index: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
