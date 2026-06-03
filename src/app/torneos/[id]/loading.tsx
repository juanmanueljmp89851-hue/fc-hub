import { Skeleton } from "@/components/ui/Skeleton";

export default function TorneoDetailLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-surface-light bg-surface/80" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Banner */}
        <Skeleton className="mb-4 h-48 w-full rounded-xl" />

        {/* Status badges */}
        <div className="mb-2 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Title */}
        <Skeleton className="mb-2 h-9 w-64" />
        <Skeleton className="mb-4 h-4 w-96" />

        {/* Info row */}
        <div className="mb-8 flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Bracket placeholder */}
        <Skeleton className="mb-8 h-64 w-full rounded-xl" />

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </main>
    </div>
  );
}
