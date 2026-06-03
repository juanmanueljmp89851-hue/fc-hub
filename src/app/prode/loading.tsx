import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function ProdeLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Active week banner */}
        <Skeleton className="mb-6 h-24 w-full rounded-xl" />

        {/* Prode cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
