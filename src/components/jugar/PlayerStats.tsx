"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

interface Stats {
  totalPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  winRate: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  goalDiff: number;
  avgGoalsFor: number;
  currentStreak: number;
  currentStreakType: "W" | "L" | "D" | null;
  bestWinStreak: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  recentMatches: Array<{
    date: Date;
    result: "W" | "L" | "D";
    goalsFor: number;
    goalsAgainst: number;
    type: "tournament" | "casual";
    context?: string;
  }>;
}

export function PlayerStats({ stats }: { stats: Stats }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="font-bold">📊 Mi historial</h3>
        <span className="text-xs text-foreground/40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Partidos" value={stats.totalPlayed} />
            <Stat label="Win Rate" value={`${stats.winRate}%`} accent />
            <Stat label="Victorias" value={stats.totalWins} accent />
            <Stat label="Derrotas" value={stats.totalLosses} />
            <Stat label="Goles F/C" value={`${stats.totalGoalsFor}/${stats.totalGoalsAgainst}`} />
            <Stat label="Racha" value={`${stats.currentStreak}${stats.currentStreakType ?? ""}`} />
            <Stat label="Mejor racha W" value={stats.bestWinStreak} accent />
            <Stat label="Torneos" value={`${stats.tournamentsWon}/${stats.tournamentsPlayed}`} />
          </div>

          {stats.recentMatches.length > 0 && (
            <>
              <h4 className="mb-2 mt-4 text-xs font-bold text-foreground/50">Últimos partidos</h4>
              <div className="space-y-1.5">
                {stats.recentMatches.slice(0, 10).map((match, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                      match.result === "W"
                        ? "bg-accent/10"
                        : match.result === "L"
                          ? "bg-red-500/10"
                          : "bg-surface-light/50"
                    }`}
                  >
                    <span className={`font-black ${
                      match.result === "W" ? "text-accent" : match.result === "L" ? "text-red-400" : "text-foreground/40"
                    }`}>
                      {match.result}
                    </span>
                    <span className="font-bold">{match.goalsFor}-{match.goalsAgainst}</span>
                    {match.context && <span className="truncate text-foreground/30">{match.context}</span>}
                    <span className="ml-auto text-foreground/20">
                      {match.type === "tournament" ? "🏆" : "⚔️"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-background/50 p-2 text-center">
      <p className={`text-sm font-black ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="text-[9px] text-foreground/40">{label}</p>
    </div>
  );
}
