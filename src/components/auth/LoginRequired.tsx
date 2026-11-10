import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export function LoginRequired({ action, returnTo }: { action: string; returnTo: string }) {
  const redirect = encodeURIComponent(returnTo);
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="mb-4 text-5xl">🔐</span>
        <h1 className="text-2xl font-black">Iniciá sesión para {action}</h1>
        <p className="mt-2 text-sm text-foreground/60">Necesitás una cuenta de Modo Fosa. Es gratis y tarda un minuto.</p>
        <div className="mt-6 flex gap-3">
          <Link
            href={`/auth/login?redirect=${redirect}`}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-background hover:opacity-90"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg border border-surface-light px-5 py-2.5 text-sm font-bold hover:border-accent/40"
          >
            Crear cuenta
          </Link>
        </div>
      </main>
    </div>
  );
}
