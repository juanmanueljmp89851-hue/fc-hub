"use client";

import { useState } from "react";
import { voidPlayer } from "@/lib/actions/tournament";

interface Props {
  tournamentId: string;
  userId: string;
  username: string;
}

export function AdminPlayerActions({ tournamentId, userId, username }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVoid(mode: "REMOVE_POINTS" | "NEVER_EXISTED") {
    const confirmMsg = mode === "REMOVE_POINTS"
      ? `¿Quitar todos los puntos de ${username} en este torneo?`
      : `¿Anular a ${username}? Se borrarán todos sus partidos y resultados como si nunca hubiera participado.`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError("");
    const result = await voidPlayer(tournamentId, userId, mode);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setOpen(false);
    setLoading(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-foreground/30 transition-colors hover:text-accent"
        title="Acciones admin"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-surface-light bg-surface py-1 shadow-xl">
            {error && (
              <div className="px-3 py-2 text-xs text-red-400">{error}</div>
            )}
            <button
              onClick={() => handleVoid("REMOVE_POINTS")}
              disabled={loading}
              className="block w-full px-4 py-2 text-left text-sm text-foreground/70 hover:bg-surface-light hover:text-accent disabled:opacity-50"
            >
              Quitar puntos del torneo
            </button>
            <button
              onClick={() => handleVoid("NEVER_EXISTED")}
              disabled={loading}
              className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-surface-light disabled:opacity-50"
            >
              Nunca existió (anular todo)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
