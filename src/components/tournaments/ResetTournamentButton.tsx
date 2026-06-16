"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetTournament } from "@/lib/actions/tournament";

interface Props {
  tournamentId: string;
}

export function ResetTournamentButton({ tournamentId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (
      !confirm(
        "¿Reiniciar el torneo?\n\nSe borrarán TODOS los partidos, resultados y standings. Los participantes se mantienen.\n\nEl torneo vuelve a estado de inscripción para que puedas agregar/quitar jugadores y volver a iniciarlo.",
      )
    )
      return;

    setLoading(true);
    try {
      const result = await resetTournament(tournamentId);
      if ("error" in result && result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al reiniciar");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="rounded-lg border border-orange-500/30 px-3 py-1.5 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/10 disabled:opacity-50"
    >
      {loading ? "Reiniciando..." : "Reiniciar"}
    </button>
  );
}
