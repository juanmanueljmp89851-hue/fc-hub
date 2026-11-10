import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/actions/user";
import { LoginRequired } from "@/components/auth/LoginRequired";

export const metadata: Metadata = {
  title: "Crear Prode",
  description: "Creá un prode de fútbol y competí con tus amigos en Modo Fosa.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <LoginRequired action="crear un prode" returnTo="/prode/crear" />;
  return children;
}
