"use client";

import { Navbar } from "./Navbar";

export function RouteError({
  sectionName,
  reset,
  errorDetail,
}: {
  sectionName: string;
  reset: () => void;
  errorDetail?: string;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-24">
        <p className="text-5xl font-black text-red-500">Error</p>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          Error al cargar {sectionName}
        </h1>
        <p className="mt-2 text-sm text-foreground/50">
          Hubo un problema. Intentá de nuevo en unos segundos.
        </p>
        {errorDetail && (
          <p className="mt-2 max-w-md rounded bg-surface-light px-3 py-2 text-xs font-mono text-red-400 break-all">
            {errorDetail}
          </p>
        )}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-lg border border-surface-light px-5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
