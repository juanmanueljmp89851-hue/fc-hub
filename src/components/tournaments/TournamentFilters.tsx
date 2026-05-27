"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "REGISTRATION", label: "Inscripciones" },
  { value: "FINISHED", label: "Finalizados" },
];

const PLATFORM_FILTERS = [
  { value: "", label: "Todas las plataformas" },
  { value: "PS5", label: "PS5" },
  { value: "XBOX", label: "Xbox" },
  { value: "PC", label: "PC" },
];

export function TournamentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentPlatform = searchParams.get("platform") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/torneos?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => updateFilter("status", filter.value)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            currentStatus === filter.value
              ? "border-accent text-accent"
              : "border-surface-light text-foreground/70 hover:border-accent hover:text-accent"
          }`}
        >
          {filter.label}
        </button>
      ))}
      <select
        value={currentPlatform}
        onChange={(e) => updateFilter("platform", e.target.value)}
        className="ml-auto rounded-lg border border-surface-light bg-surface px-3 py-2 text-sm text-foreground/70"
      >
        {PLATFORM_FILTERS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
