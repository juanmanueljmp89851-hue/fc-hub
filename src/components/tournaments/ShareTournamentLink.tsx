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
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-surface-light bg-surface/30 p-2 sm:gap-3 sm:p-3">
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-xs font-medium text-foreground/50">Compartí este link para invitar</p>
        <p className="mt-1 truncate font-mono text-xs text-accent sm:text-sm">{shareUrl}</p>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 sm:px-4 sm:py-2 sm:text-sm"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
