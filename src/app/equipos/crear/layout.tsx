import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/actions/user";
import { LoginRequired } from "@/components/auth/LoginRequired";

export const metadata: Metadata = {
  title: "Crear Equipo",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <LoginRequired action="crear un equipo" returnTo="/equipos/crear" />;
  return children;
}
