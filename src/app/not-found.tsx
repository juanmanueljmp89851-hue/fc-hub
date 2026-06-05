import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-black text-accent">404</p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-foreground/50">
          La página que buscás no existe o fue movida.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Ir al inicio
          </Link>
          <Link
            href="/jugadores"
            className="rounded-lg border border-surface-light px-6 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
          >
            Ver cartas
          </Link>
        </div>
      </div>
    </div>
  );
}
