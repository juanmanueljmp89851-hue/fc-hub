"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { softDeleteTournament } from "@/lib/actions/tournament";

interface Props {
  tournamentId: string;
  tournamentName: string;
}

export function DeleteTournamentButton({ tournamentId, tournamentName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Eliminar el torneo "${tournamentName}"? Podrás recuperarlo desde el panel de admin.`)) return;

    setLoading(true);
    try {
      await softDeleteTournament(tournamentId);
      router.push("/torneos");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
