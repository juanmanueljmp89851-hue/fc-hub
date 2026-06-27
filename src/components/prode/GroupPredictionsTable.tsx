"use client";

import { useState } from "react";
import { TeamFlag } from "@/components/prode/TeamFlag";

interface UserPrediction {
  userId: string;
  username: string;
  avatarUrl: string | null;
  first: string | null;
  second: string | null;
  third: string | null;
  fourth: string | null;
  pointsEarned: number;
  simulated?: boolean;
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

function calcGroupPoints(
  pred: { first: string | null; second: string | null; third: string | null; fourth: string | null },
  real: { first: string; second: string; third: string; fourth: string },
) {
  let correct = 0;
  if (pred.first === real.first) correct++;
  if (pred.second === real.second) correct++;
  if (pred.third === real.third) correct++;
  if (pred.fourth === real.fourth) correct++;
  if (correct === 4) return 10;
  if (correct === 3) return 6;
  if (correct === 2) return 3;
  if (correct === 1) return 1;
  return 0;
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
                          <tr key={pred.userId} className={`hover:bg-surface-light/20 ${pred.simulated ? "opacity-60" : ""}`}>
                            <td className="py-1.5 font-medium text-foreground/70 truncate max-w-[96px]">
                              {pred.username}
                              {pred.simulated && <span className="ml-1 text-[9px] text-foreground/30" title="Inferido desde predicciones de partidos">*</span>}
                            </td>
                            {pred.first === null ? (
                              <td colSpan={4} className="py-1.5 text-center text-xs text-foreground/30 italic">
                                No predijo
                              </td>
                            ) : (
                              <>
                                <td className="py-1.5 text-center">
                                  <PositionCell team={pred.first} realTeam={real?.first} />
                                </td>
                                <td className="py-1.5 text-center">
                                  <PositionCell team={pred.second!} realTeam={real?.second} />
                                </td>
                                <td className="py-1.5 text-center">
                                  <PositionCell team={pred.third!} realTeam={real?.third} />
                                </td>
                                <td className="py-1.5 text-center">
                                  <PositionCell team={pred.fourth!} realTeam={real?.fourth} />
                                </td>
                              </>
                            )}
                            <td className="py-1.5 text-right">
                              <PointsBadge points={real && pred.first ? calcGroupPoints(pred, real) : 0} />
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
          {/* Total points per user */}
          {(() => {
            const userTotals: Record<string, { username: string; total: number }> = {};
            for (const g of groups) {
              const real = realStandings[g];
              if (!real) continue;
              for (const pred of predictions[g]) {
                if (!userTotals[pred.userId]) userTotals[pred.userId] = { username: pred.username, total: 0 };
                if (pred.first) userTotals[pred.userId].total += calcGroupPoints(pred, real);
              }
            }
            const sorted = Object.values(userTotals).sort((a, b) => b.total - a.total);
            if (sorted.length === 0) return null;
            const scoredGroups = groups.filter((g) => realStandings[g]).length;
            return (
              <div className="border-t border-surface-light px-4 py-3">
                <h4 className="mb-2 text-xs font-bold uppercase text-foreground/50">
                  Total puntos por orden de grupo ({scoredGroups}/{groups.length} grupos definidos)
                </h4>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
                  {sorted.map((u, i) => (
                    <div
                      key={u.username}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                        i === 0 && u.total > 0 ? "bg-gold/10 border border-gold/30" : "bg-surface-light/30"
                      }`}
                    >
                      <span className="font-medium text-foreground/70 truncate">{u.username}</span>
                      <span className={`ml-2 font-bold ${u.total > 0 ? "text-gold" : "text-foreground/30"}`}>
                        {u.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="px-4 py-2 border-t border-surface-light/50">
            <p className="text-[9px] text-foreground/30">* Orden inferido desde predicciones de partidos (no completó predicción de grupo)</p>
          </div>
        </div>
      )}
    </div>
  );
}
