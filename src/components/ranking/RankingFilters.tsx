"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: "all", label: "Histórico" },
  { value: "month", label: "Este mes" },
  { value: "week", label: "Esta semana" },
] as const;

interface RankingFiltersProps {
  activePeriod: string;
}

export function RankingFilters({ activePeriod }: RankingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    router.push(`/ranking?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePeriod(p.value)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            activePeriod === p.value
              ? "border-accent text-accent"
              : "border-surface-light text-foreground/70 hover:border-accent hover:text-accent"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
