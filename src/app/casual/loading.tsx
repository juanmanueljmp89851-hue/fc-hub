import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function CasualLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-2 h-8 w-56" />
        <Skeleton className="mb-8 h-4 w-80" />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Search */}
          <div className="lg:col-span-1">
            <CardSkeleton />
            <Skeleton className="mt-4 h-14 w-full rounded-lg" />
          </div>

          {/* Matches */}
          <div className="space-y-6 lg:col-span-2">
            <CardSkeleton />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-surface-light p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
