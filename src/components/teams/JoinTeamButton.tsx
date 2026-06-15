"use client";

import { useState } from "react";
import { requestJoinTeam } from "@/lib/actions/team";

interface Props {
  teamId: string;
}

export function JoinTeamButton({ teamId }: Props) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleRequest() {
    setLoading(true);
    setError("");
    const result = await requestJoinTeam(teamId);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return <span className="text-xs text-accent">Solicitud enviada ✓</span>;
  }

  return (
    <div>
      <button
        onClick={handleRequest}
        disabled={loading}
        className="rounded-lg border border-accent px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
      >
        {loading ? "..." : "Solicitar unión"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
