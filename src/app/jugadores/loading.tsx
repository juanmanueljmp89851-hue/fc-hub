import { Skeleton } from "@/components/ui/Skeleton";

export default function JugadoresLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="mb-6 h-4 w-64" />

        {/* Search + filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-surface-light bg-surface p-2">
              <Skeleton className="mb-2 aspect-square w-full rounded-lg" />
              <Skeleton className="mb-1 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
