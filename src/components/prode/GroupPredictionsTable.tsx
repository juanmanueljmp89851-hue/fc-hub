"use client";

import { useState } from "react";
import { TeamFlag } from "@/components/prode/TeamFlag";

interface UserPrediction {
  userId: string;
  username: string;
  avatarUrl: string | null;
  first: string;
  second: string;
  third: string;
  fourth: string;
  pointsEarned: number;
}

interface GroupPredictionsTableProps {
  predictions: Record<string, UserPrediction[]>;
  realStandings: Record<string, { first: string; second: string; third: string; fourth: string }>;
}

function PositionCell({ team, realTeam }: { team: string; realTeam?: string }) {
  const isCorrect = realTeam && team === realTeam;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
        realTeam
          ? isCorrect
            ? "bg-accent/20 text-accent font-bold"
            : "bg-red-500/10 text-foreground/50"
          : "text-foreground/70"
      }`}
    >
      <TeamFlag team={team} size={14} />
      <span className="truncate max-w-[80px]">{team}</span>
    </span>
  );
}

function PointsBadge({ points }: { points: number }) {
  if (points === 0) return <span className="text-[10px] text-foreground/30">+0</span>;
  const color =
    points >= 10
      ? "text-gold bg-gold/20"
      : points >= 6
        ? "text-accent bg-accent/20"
        : "text-foreground/60 bg-surface-light";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${color}`}>+{points}</span>
  );
}

export function GroupPredictionsTable({ predictions, realStandings }: GroupPredictionsTableProps) {
  const [open, setOpen] = useState(false);
  const groups = Object.keys(predictions).sort();

  if (groups.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-light/30 transition-colors"
      >
        <h3 className="text-sm font-bold">📊 Predicciones de Grupos</h3>
        <span className="text-xs text-foreground/40">{open ? "▾ Ocultar" : "▸ Ver comparativa"}</span>
      </button>

      {open && (
        <div className="border-t border-surface-light">
          {/* Scoring legend */}
          <div className="px-4 py-2 bg-surface-light/20 border-b border-surface-light/50">
            <p className="text-[10px] text-foreground/40">
              Puntos por acertar orden: <span className="font-bold text-gold">+10</span> (4/4) ·{" "}
              <span className="font-bold text-accent">+6</span> (3/4) ·{" "}
              <span className="font-bold">+3</span> (2/4) ·{" "}
              <span className="font-bold">+1</span> (1/4)
            </p>
          </div>

          <div className="space-y-0 divide-y divide-surface-light/30">
            {groups.map((groupName) => {
              const real = realStandings[groupName];
              const preds = predictions[groupName];

              return (
                <div key={groupName} className="px-4 py-3">
                  <h4 className="mb-2 text-xs font-bold uppercase text-foreground/50">
                    Grupo {groupName}
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-foreground/30">
                          <th className="pb-1 text-left font-normal w-24"></th>
                          <th className="pb-1 text-center font-normal">1°</th>
                          <th className="pb-1 text-center font-normal">2°</th>
                          <th className="pb-1 text-center font-normal">3°</th>
                          <th className="pb-1 text-center font-normal">4°</th>
                          <th className="pb-1 text-right font-normal w-10">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Real standings row */}
                        {real && (
                          <tr className="border-b border-surface-light/50 bg-gold/5">
                            <td className="py-1.5 font-bold text-gold text-[10px]">📋 Real</td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={real.first} />
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={real.second} />
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={real.third} />
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={real.fourth} />
                            </td>
                            <td className="py-1.5"></td>
                          </tr>
                        )}

                        {/* User predictions */}
                        {preds.map((pred) => (
                          <tr key={pred.userId} className="hover:bg-surface-light/20">
                            <td className="py-1.5 font-medium text-foreground/70 truncate max-w-[96px]">
                              {pred.username}
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={pred.first} realTeam={real?.first} />
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={pred.second} realTeam={real?.second} />
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={pred.third} realTeam={real?.third} />
                            </td>
                            <td className="py-1.5 text-center">
                              <PositionCell team={pred.fourth} realTeam={real?.fourth} />
                            </td>
                            <td className="py-1.5 text-right">
                              <PointsBadge points={pred.pointsEarned} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
