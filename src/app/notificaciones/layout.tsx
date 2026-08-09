import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notificaciones — Modo Fosa",
  description: "Tus notificaciones de torneos, desafíos y actividad en Modo Fosa.",
  robots: { index: false },
};

export default function NotificacionesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
