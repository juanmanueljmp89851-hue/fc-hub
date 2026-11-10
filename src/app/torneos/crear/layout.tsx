import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/actions/user";
import { LoginRequired } from "@/components/auth/LoginRequired";

export const metadata: Metadata = {
  title: "Crear Torneo",
  description: "Creá un torneo de EA FC para la comunidad en Modo Fosa.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <LoginRequired action="crear un torneo" returnTo="/torneos/crear" />;
  return children;
}
