import { Skeleton } from "@/components/ui/Skeleton";

export default function RankingLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-80" />

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Table rows */}
        <div className="space-y-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-surface-light/50 p-3">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
