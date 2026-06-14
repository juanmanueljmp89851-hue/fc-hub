"use client";

import { useState } from "react";
import { remindPendingMatches } from "@/lib/actions/tournament";

export function RemindPendingButton({ tournamentId }: { tournamentId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRemind() {
    setLoading(true);
    const result = await remindPendingMatches(tournamentId);
    if (!result.error) setSent(true);
    setLoading(false);
  }

  if (sent) {
    return <span className="text-xs font-medium text-accent">Recordatorios enviados ✓</span>;
  }

  return (
    <button
      onClick={handleRemind}
      disabled={loading}
      className="rounded-lg border border-gold/50 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
    >
      {loading ? "..." : "⏰ Recordar partidos pendientes"}
    </button>
  );
}
