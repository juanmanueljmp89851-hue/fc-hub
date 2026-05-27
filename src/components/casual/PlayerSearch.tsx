"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchPlayers, challengeUser } from "@/lib/actions/casual";

interface PlayerResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  rankingPoints: number;
  reputationPoints: number;
}

export function PlayerSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [challenging, setChallenging] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleSearch() {
    if (query.length < 2) return;
    setSearching(true);
    setMessage("");
    const players = await searchPlayers(query);
    setResults(players);
    setSearching(false);
  }

  async function handleChallenge(playerId: string) {
    setChallenging(playerId);
    setMessage("");
    const result = await challengeUser(playerId);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("¡Desafío enviado!");
      router.refresh();
      if (result.matchId) {
        router.push(`/casual/${result.matchId}`);
      }
    }
    setChallenging(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching || query.length < 2}
          className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("error") || message.includes("Error") ? "text-red-400" : "text-accent"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg border border-surface-light bg-background p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-surface">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{player.username}</p>
                  <p className="text-xs text-foreground/50">
                    {player.rankingPoints} pts · Rep: {player.reputationPoints}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChallenge(player.id)}
                disabled={challenging === player.id}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {challenging === player.id ? "Enviando..." : "Desafiar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.length >= 2 && !searching && (
        <p className="text-sm text-foreground/50">No se encontraron jugadores</p>
      )}
    </div>
  );
}
