"use client";

import { useState } from "react";
import { adminEditResult } from "@/lib/actions/tournament";

interface Props {
  matchId: string;
  player1Name: string;
  player2Name: string;
  currentP1: number | null;
  currentP2: number | null;
}

export function AdminMatchEdit({ matchId, player1Name, player2Name, currentP1, currentP2 }: Props) {
  const [open, setOpen] = useState(false);
  const [p1, setP1] = useState(currentP1 ?? 0);
  const [p2, setP2] = useState(currentP2 ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const result = await adminEditResult(matchId, p1, p2);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="rounded p-1 text-foreground/30 transition-colors hover:bg-accent/10 hover:text-accent"
        title="Editar resultado"
      >
        ✏️
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-surface-light bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold">Editar resultado</h3>
            {error && (
              <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="mb-2 text-sm font-medium text-foreground/70">{player1Name}</p>
                <input
                  type="number"
                  min={0}
                  value={p1}
                  onChange={(e) => setP1(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-surface-light bg-surface px-3 py-2 text-center text-2xl font-bold focus:border-accent focus:outline-none"
                />
              </div>
              <span className="text-xl font-bold text-foreground/30">-</span>
              <div className="flex-1 text-center">
                <p className="mb-2 text-sm font-medium text-foreground/70">{player2Name}</p>
                <input
                  type="number"
                  min={0}
                  value={p2}
                  onChange={(e) => setP2(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-surface-light bg-surface px-3 py-2 text-center text-2xl font-bold focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-surface-light py-2 text-sm font-medium text-foreground/60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-background disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
