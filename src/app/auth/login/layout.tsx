import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — Modo Fosa",
  description: "Ingresá a tu cuenta de Modo Fosa para acceder a torneos, ranking, desafíos y más.",
  robots: { index: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
