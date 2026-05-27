"use client";

import { useRouter, usePathname } from "next/navigation";

interface Props {
  specialties: string[];
  current?: string;
}

export function InfluencerFilters({ specialties, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleFilter(specialty?: string) {
    if (specialty) {
      router.push(`${pathname}?specialty=${encodeURIComponent(specialty)}`);
    } else {
      router.push(pathname);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => handleFilter()}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
          !current
            ? "border-accent text-accent"
            : "border-surface-light text-foreground/70 hover:border-accent hover:text-accent"
        }`}
      >
        Todos
      </button>
      {specialties.map((s) => (
        <button
          key={s}
          onClick={() => handleFilter(s)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            current === s
              ? "border-accent text-accent"
              : "border-surface-light text-foreground/70 hover:border-accent hover:text-accent"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
