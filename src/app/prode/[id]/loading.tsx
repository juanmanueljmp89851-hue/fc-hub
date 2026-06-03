import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function ProdeDetailLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-4 h-4 w-24" />

        {/* Banner */}
        <Skeleton className="mb-4 h-48 w-full rounded-xl" />

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-7 w-48" />
        </div>

        {/* Share code */}
        <Skeleton className="mb-6 h-10 w-64 rounded-lg" />

        {/* Leaderboard top 5 */}
        <Skeleton className="mb-6 h-40 w-full rounded-xl" />

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CardSkeleton />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <CardSkeleton />
          </div>
          <div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
