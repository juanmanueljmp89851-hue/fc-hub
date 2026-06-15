"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { value: "jugadores", label: "👤 Jugadores" },
  { value: "equipos", label: "🛡️ Equipos" },
] as const;

interface RankingTabsProps {
  activeTab: string;
}

export function RankingTabs({ activeTab }: RankingTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "jugadores") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/ranking?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex gap-1 rounded-xl bg-surface-light/50 p-1">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => handleTab(t.value)}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
            activeTab === t.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-foreground/50 hover:text-foreground/70"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
