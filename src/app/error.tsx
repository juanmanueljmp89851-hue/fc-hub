"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-black text-red-500">Error</p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-foreground/50">
          Hubo un problema al cargar esta página. Intentá de nuevo.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-lg border border-surface-light px-6 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
