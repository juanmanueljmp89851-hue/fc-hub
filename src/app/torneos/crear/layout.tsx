import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Torneo",
  description: "Creá un torneo de EA FC para la comunidad en Modo Fosa.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
