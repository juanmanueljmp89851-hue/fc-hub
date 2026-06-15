"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateTournament } from "@/lib/actions/tournament";

export function DuplicateTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    const result = await duplicateTournament(tournamentId);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else if (result.tournamentId) {
      router.push(`/torneos/${result.tournamentId}/editar`);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
    >
      {loading ? "..." : "Copiar torneo"}
    </button>
  );
}
