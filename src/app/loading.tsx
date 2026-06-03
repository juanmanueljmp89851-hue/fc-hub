import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Navbar placeholder */}
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Ticker */}
        <Skeleton className="mb-6 h-10 w-full" />

        {/* Quick links */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>

        {/* Content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
