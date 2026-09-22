export default function JugadoresLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
          <p className="mt-4 text-sm font-medium text-foreground/50">
            Cargando cartas...
          </p>
        </div>
      </main>
    </div>
  );
}
