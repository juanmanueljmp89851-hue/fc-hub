"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptChallenge, rejectChallenge } from "@/lib/actions/casual";

interface Props {
  matchId: string;
}

export function DuelActions({ matchId }: Props) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAccept() {
    setLoading("accept");
    setError(null);
    const result = await acceptChallenge(matchId);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.push(`/casual/${matchId}`);
  }

  async function handleReject() {
    if (!confirm("¿Rechazar este desafío?")) return;
    setLoading("reject");
    setError(null);
    const result = await rejectChallenge(matchId);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.push("/jugar");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={loading !== null}
          className="flex-1 rounded-xl bg-accent py-3.5 text-lg font-black text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading === "accept" ? "Aceptando..." : "Aceptar duelo ⚔️"}
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="flex-1 rounded-xl border border-red-500/30 py-3.5 text-lg font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          {loading === "reject" ? "Rechazando..." : "Rechazar"}
        </button>
      </div>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
