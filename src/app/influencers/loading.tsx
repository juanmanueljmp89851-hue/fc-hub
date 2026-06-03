import { Skeleton } from "@/components/ui/Skeleton";

export default function InfluencersLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="mb-8 h-4 w-72" />

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-surface-light bg-surface p-4">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="mb-1 h-5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
