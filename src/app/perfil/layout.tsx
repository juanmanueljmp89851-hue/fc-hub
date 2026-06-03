import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Perfil",
  description: "Tu perfil en Modo Fosa. Configurá tu usuario, gamertags y preferencias.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
