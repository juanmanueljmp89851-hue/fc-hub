"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getProdeLeaderboardDetailed } from "@/lib/actions/prode";

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  matchPoints: number;
  groupPoints: number;
  advancePoints: number;
  exactResults: number;
  weeklyPoints: Record<string, number>;
}

interface Week {
  id: string;
  title: string;
}

function getMedalClass(pos: number) {
  if (pos === 1) return "bg-gold text-background";
  if (pos === 2) return "bg-gray-300 text-background";
  if (pos === 3) return "bg-amber-700 text-white";
  return "bg-surface-light text-foreground/60";
}

function shortWeekTitle(title: string) {
  // "Fecha 1 — Fase de Grupos" → "F1"
  const match = title.match(/Fecha\s+(\d+)/i);
  if (match) return `F${match[1]}`;
  if (title.toLowerCase().includes("16avos")) return "16°";
  if (title.toLowerCase().includes("octavos")) return "8vos";
  if (title.toLowerCase().includes("cuartos")) return "4tos";
  if (title.toLowerCase().includes("semi")) return "Semi";
  if (title.toLowerCase().includes("final")) return "Final";
  return title.slice(0, 4);
}

export function ProdeLeaderboard({ prodeId, maxRows }: { prodeId: string; maxRows?: number }) {
  const [data, setData] = useState<{ leaderboard: LeaderboardEntry[]; weeks: Week[] } | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getProdeLeaderboardDetailed(prodeId);
      setData(result as { leaderboard: LeaderboardEntry[]; weeks: Week[] });
    }
    load();
  }, [prodeId]);

  if (!data) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface" />;
  }

  const { leaderboard, weeks } = data;

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
        <h3 className="mb-2 text-sm font-bold">🏆 Tabla de posiciones</h3>
        <p className="text-sm text-foreground/50">
          Aún no hay participantes
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-light px-4 py-3">
        <h3 className="text-sm font-bold">🏆 Tabla de posiciones</h3>
        {weeks.length > 0 && !maxRows && (
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-xs text-foreground/40 hover:text-accent"
          >
            {showDetail ? "Resumido" : "Detalle por fecha"}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-light/50 text-xs text-foreground/40">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Jugador</th>
              {showDetail && weeks.map((w) => (
                <th key={w.id} className="px-1.5 py-2 text-center" title={w.title}>
                  {shortWeekTitle(w.title)}
                </th>
              ))}
              {showDetail && (
                <>
                  <th className="px-1.5 py-2 text-center" title="Grupos">Grp</th>
                  <th className="px-1.5 py-2 text-center" title="Avance">Av</th>
                </>
              )}
              <th className="px-3 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {(maxRows ? leaderboard.slice(0, maxRows) : leaderboard).map((entry, i) => (
              <tr
                key={entry.userId}
                className={`border-b border-surface-light/30 ${i < 3 ? "bg-gold/5" : ""}`}
              >
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${getMedalClass(i + 1)}`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface">
                      {entry.avatarUrl ? (
                        <Image src={entry.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-medium">{entry.username}</span>
                      {entry.exactResults > 0 && (
                        <span className="text-[10px] text-gold">{entry.exactResults}🎯</span>
                      )}
                    </div>
                  </div>
                </td>
                {showDetail && weeks.map((w) => (
                  <td key={w.id} className="px-1.5 py-2 text-center text-xs text-foreground/60">
                    {entry.weeklyPoints[w.id] ?? "-"}
                  </td>
                ))}
                {showDetail && (
                  <>
                    <td className="px-1.5 py-2 text-center text-xs text-foreground/60">
                      {entry.groupPoints || "-"}
                    </td>
                    <td className="px-1.5 py-2 text-center text-xs text-foreground/60">
                      {entry.advancePoints || "-"}
                    </td>
                  </>
                )}
                <td className="px-3 py-2 text-right font-bold text-gold">
                  {entry.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Points legend */}
      <div className="border-t border-surface-light/50 px-4 py-2.5">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-foreground/40">
          <span>🎯 Exacto: <span className="font-bold text-gold">5</span></span>
          <span>✅ Ganador: <span className="font-bold text-accent">3</span></span>
          <span>📊 Grupo: <span className="font-bold text-gold">+10</span>(4/4) · <span className="font-bold text-accent">+6</span>(3/4) · +3(2/4) · +1(1/4)</span>
          <span>🔮 Campeón: <span className="font-bold text-accent">10</span></span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-foreground/40">
          <span className="font-medium text-foreground/50">Desde 16avos:</span>
          <span>⏱️ Acertar extra time: <span className="font-bold text-accent">+2</span></span>
          <span>🥅 Acertar penales: <span className="font-bold text-accent">+2</span></span>
          <span>🏆 Acertar quién avanza: <span className="font-bold text-gold">+3</span></span>
        </div>
      </div>
    </div>
  );
}
