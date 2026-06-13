"use client";

import { useState } from "react";

export function ShareTournamentLink({ tournamentId }: { tournamentId: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/torneos/${tournamentId}`
    : `/torneos/${tournamentId}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-light bg-surface/30 p-3">
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground/50">Compartí este link para invitar</p>
        <p className="mt-1 truncate font-mono text-sm text-accent">{shareUrl}</p>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-lg border border-accent/50 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
