"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { savePredictions } from "@/lib/actions/prode";
import { getCurrentUser } from "@/lib/actions/user";
import { TeamFlag } from "@/components/prode/TeamFlag";

interface OtherPrediction {
  username: string;
  avatarUrl: string | null;
  predHomeScore: number;
  predAwayScore: number;
  predExtraTime?: boolean | null;
  predPenalties?: boolean | null;
  predWinner?: string | null;
}

interface MatchWithPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue: string | null;
  stage: string | null;
  group: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  extraTime?: boolean | null;
  penalties?: boolean | null;
  winnerTeam?: string | null;
  predictions?: {
    predHomeScore: number;
    predAwayScore: number;
    predExtraTime?: boolean | null;
    predPenalties?: boolean | null;
    predWinner?: string | null;
  }[];
  allPredictions?: OtherPrediction[];
}

type SortMode = "group" | "date";

interface PredictionFormProps {
  prodeId: string;
  weekId: string;
  weekStatus: string;

  matches: MatchWithPrediction[];
}

export function PredictionForm({ prodeId, weekId, weekStatus, matches }: PredictionFormProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [knockoutPreds, setKnockoutPreds] = useState<Record<string, { extraTime?: boolean; penalties?: boolean; winner?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const hasGroups = matches.some((m) => m.group);
  const [sortMode, setSortMode] = useState<SortMode>(hasGroups ? "group" : "date");

  // All matches editable until 1 min before each match starts
  const hasPerMatchLock = true;

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);
    }
    load();
  }, []);

  // Initialize from existing predictions
  useEffect(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    for (const match of matches) {
      const existing = match.predictions?.[0];
      if (existing) {
        initial[match.id] = {
          home: String(existing.predHomeScore),
          away: String(existing.predAwayScore),
        };
      } else {
        initial[match.id] = { home: "", away: "" };
      }
    }
    setPredictions(initial);

    const initialKnockout: Record<string, { extraTime?: boolean; penalties?: boolean; winner?: string }> = {};
    for (const match of matches) {
      const existing = match.predictions?.[0];
      if (existing && (existing.predExtraTime != null || existing.predPenalties != null || existing.predWinner != null)) {
        initialKnockout[match.id] = {
          extraTime: existing.predExtraTime ?? undefined,
          penalties: existing.predPenalties ?? undefined,
          winner: existing.predWinner ?? undefined,
        };
      }
    }
    setKnockoutPreds(initialKnockout);
  }, [matches]);

  const isOpen = weekStatus === "OPEN" || hasPerMatchLock;
  const canPredict = isOpen && userId;

  function updateScore(matchId: string, side: "home" | "away", value: string) {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value },
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    const preds = Object.entries(predictions)
      .filter(([, v]) => v.home !== "" && v.away !== "")
      .map(([matchId, v]) => {
        const ko = knockoutPreds[matchId];
        return {
          matchId,
          predHomeScore: parseInt(v.home) || 0,
          predAwayScore: parseInt(v.away) || 0,
          ...(ko?.extraTime != null && { predExtraTime: ko.extraTime }),
          ...(ko?.penalties != null && { predPenalties: ko.penalties }),
          ...(ko?.winner && { predWinner: ko.winner }),
        };
      });

    if (preds.length === 0) {
      setMessage("Completá al menos una predicción");
      setLoading(false);
      return;
    }

    const result = await savePredictions(prodeId, weekId, preds);
    if (result.error) {
      setMessage(result.error);
    } else {
      const saved = result.saved ?? preds.length;
      const skipped = result.skipped ?? 0;
      const msg = skipped > 0
        ? `¡${saved} predicciones guardadas! (${skipped} partidos ya cerrados, no se modificaron)`
        : `¡${saved} predicciones guardadas!`;
      setMessage(msg);
      router.refresh();
    }
    setLoading(false);
  }

  // Group matches by selected sort mode
  const grouped = new Map<string, MatchWithPrediction[]>();
  const sortedMatches = [...matches];

  if (sortMode === "date") {
    // Sort chronologically, group by date
    sortedMatches.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    for (const match of sortedMatches) {
      const dateKey = new Date(match.matchDate).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(match);
    }
  } else {
    // Sort by group
    for (const match of sortedMatches) {
      const key = match.group ? `Grupo ${match.group}` : match.stage ?? "Partidos";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(match);
    }
  }

  const filledCount = Object.values(predictions).filter(
    (v) => v.home !== "" && v.away !== "",
  ).length;

  return (
    <div className="space-y-6">
      {!userId && isOpen && (
        <div className="rounded-lg border border-gold/50 bg-gold/10 p-4 text-sm text-gold">
          Iniciá sesión para hacer tus predicciones
        </div>
      )}

      {/* Sort toggle — only show if matches have groups */}
      {hasGroups && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/40">Ordenar por:</span>
          <div className="inline-flex rounded-lg border border-surface-light bg-surface">
            <button
              onClick={() => setSortMode("group")}
              className={`rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                sortMode === "group"
                  ? "bg-accent text-background"
                  : "text-foreground/60 hover:text-accent"
              }`}
            >
              Grupo
            </button>
            <button
              onClick={() => setSortMode("date")}
              className={`rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                sortMode === "date"
                  ? "bg-accent text-background"
                  : "text-foreground/60 hover:text-accent"
              }`}
            >
              Fecha
            </button>
          </div>
        </div>
      )}

      {Array.from(grouped.entries()).map(([groupName, groupMatches]) => (
        <div key={groupName}>
          <h3 className="mb-3 text-sm font-bold uppercase text-foreground/50">{groupName}</h3>
          <div className="space-y-3">
            {groupMatches.map((match) => {
              const pred = predictions[match.id];
              const isFinished = match.status === "FINISHED";
              const existingPred = match.predictions?.[0];
              // Per-match lock: for group stage, lock 1 minute before kickoff
              const cutoff = new Date(new Date(match.matchDate).getTime() - 60_000);
              const matchStarted = hasPerMatchLock && cutoff <= new Date();
              const matchLocked = isFinished || matchStarted;

              return (
                <div
                  key={match.id}
                  className={`rounded-lg border p-4 ${
                    matchLocked
                      ? "border-surface-light/50 bg-background/50 opacity-75"
                      : "border-surface-light bg-background"
                  }`}
                >
                  {/* Match date + venue + lock indicator */}
                  <div className="mb-2 flex flex-wrap items-center justify-between text-xs text-foreground/40">
                    <span className="flex items-center gap-1.5">
                      {matchStarted && !isFinished && (
                        <span className="text-gold" title="Partido en curso">🔒</span>
                      )}
                      {new Date(match.matchDate).toLocaleDateString("es-AR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {match.venue && <span>{match.venue}</span>}
                  </div>

                  {/* Teams + scores */}
                  <div className="flex items-center justify-center gap-4">
                    <span className="flex w-36 items-center justify-end gap-1.5 font-medium">
                      {match.homeTeam}
                      <TeamFlag team={match.homeTeam} />
                    </span>

                    {canPredict && !matchLocked ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={pred?.home ?? ""}
                          onChange={(e) => updateScore(match.id, "home", e.target.value)}
                          className="w-12 rounded border border-surface-light bg-surface px-2 py-1 text-center text-lg font-bold text-foreground focus:border-accent focus:outline-none"
                          placeholder="-"
                        />
                        <span className="text-foreground/40">-</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={pred?.away ?? ""}
                          onChange={(e) => updateScore(match.id, "away", e.target.value)}
                          className="w-12 rounded border border-surface-light bg-surface px-2 py-1 text-center text-lg font-bold text-foreground focus:border-accent focus:outline-none"
                          placeholder="-"
                        />
                      </div>
                    ) : isFinished ? (
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{match.homeScore}</span>
                          <span className="text-foreground/40">-</span>
                          <span className="text-2xl font-bold">{match.awayScore}</span>
                        </div>
                        {existingPred && (
                          <div className="mt-1 text-xs">
                            <span className="text-foreground/40">
                              Tu predicción: {existingPred.predHomeScore}-{existingPred.predAwayScore}
                            </span>
                            {" · "}
                            <PointsBadge
                              pred={existingPred}
                              real={{ home: match.homeScore!, away: match.awayScore! }}
                            />
                          </div>
                        )}
                      </div>
                    ) : existingPred ? (
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-accent">{existingPred.predHomeScore}</span>
                          <span className="text-foreground/40">-</span>
                          <span className="text-lg font-bold text-accent">{existingPred.predAwayScore}</span>
                        </div>
                        <span className="text-xs text-foreground/40">Tu predicción</span>
                      </div>
                    ) : (
                      <span className="text-lg text-foreground/30">vs</span>
                    )}

                    <span className="flex w-36 items-center gap-1.5 font-medium">
                      <TeamFlag team={match.awayTeam} />
                      {match.awayTeam}
                    </span>
                  </div>

                  {/* Knockout hint */}
                  {!match.group && canPredict && !matchLocked && (
                    <p className="mt-1 text-center text-[10px] text-foreground/30">
                      Si predecís empate, podés elegir tiempo extra, penales y quién avanza
                    </p>
                  )}

                  {/* Knockout: extra time / penalties / winner */}
                  {!match.group && canPredict && !matchLocked && (() => {
                    const h = parseInt(pred?.home ?? "");
                    const a = parseInt(pred?.away ?? "");
                    const isDraw = !isNaN(h) && !isNaN(a) && h === a;
                    if (!isDraw) return null;
                    const ko = knockoutPreds[match.id] || {};
                    return (
                      <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
                        <p className="text-xs font-bold text-accent">¿Cómo se define el partido?</p>
                        <div className="flex gap-2">
                          <label className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                            ko.extraTime ? "bg-accent text-background" : "border border-surface-light text-foreground/60 hover:border-accent"
                          }`}>
                            <input
                              type="checkbox"
                              checked={!!ko.extraTime}
                              onChange={(e) => setKnockoutPreds(prev => ({
                                ...prev,
                                [match.id]: {
                                  ...prev[match.id],
                                  extraTime: e.target.checked,
                                  ...(e.target.checked ? {} : { penalties: false }),
                                },
                              }))}
                              className="sr-only"
                            />
                            ⏱️ Tiempo extra
                          </label>
                          <label className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                            ko.penalties ? "bg-accent text-background" : "border border-surface-light text-foreground/60 hover:border-accent"
                          }`}>
                            <input
                              type="checkbox"
                              checked={!!ko.penalties}
                              onChange={(e) => setKnockoutPreds(prev => ({
                                ...prev,
                                [match.id]: {
                                  ...prev[match.id],
                                  penalties: e.target.checked,
                                  ...(e.target.checked ? { extraTime: true } : {}),
                                },
                              }))}
                              className="sr-only"
                            />
                            🥅 Penales
                          </label>
                        </div>
                        {(ko.extraTime || ko.penalties) && (
                          <div>
                            <p className="text-xs text-foreground/50 mb-1">¿Quién avanza?</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setKnockoutPreds(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], winner: match.homeTeam },
                                }))}
                                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                  ko.winner === match.homeTeam
                                    ? "bg-gold text-background"
                                    : "border border-surface-light text-foreground/60 hover:border-gold"
                                }`}
                              >
                                <TeamFlag team={match.homeTeam} size={14} />
                                {match.homeTeam}
                              </button>
                              <button
                                type="button"
                                onClick={() => setKnockoutPreds(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], winner: match.awayTeam },
                                }))}
                                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                  ko.winner === match.awayTeam
                                    ? "bg-gold text-background"
                                    : "border border-surface-light text-foreground/60 hover:border-gold"
                                }`}
                              >
                                <TeamFlag team={match.awayTeam} size={14} />
                                {match.awayTeam}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Knockout prediction display when locked */}
                  {!match.group && matchLocked && existingPred?.predExtraTime != null && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground/50">
                      {existingPred.predExtraTime && (
                        <span className="rounded bg-accent/10 px-2 py-0.5">⏱️ Tiempo extra</span>
                      )}
                      {existingPred.predPenalties && (
                        <span className="rounded bg-accent/10 px-2 py-0.5">🥅 Penales</span>
                      )}
                      {existingPred.predWinner && (
                        <span className="rounded bg-gold/10 px-2 py-0.5 flex items-center gap-1">
                          Avanza: <TeamFlag team={existingPred.predWinner} size={12} /> {existingPred.predWinner}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Show all participants' predictions after match started */}
                  {matchLocked && match.allPredictions && match.allPredictions.length > 0 && (
                    <OtherPredictions
                      predictions={match.allPredictions}
                      realHome={match.homeScore}
                      realAway={match.awayScore}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit button */}
      {canPredict && (
        <div className="sticky bottom-4 rounded-lg border border-surface-light bg-surface p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">
              {filledCount}/{matches.length} predicciones completadas
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading || filledCount === 0}
              className="rounded-lg bg-accent px-6 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar predicciones"}
            </button>
          </div>
          {message && (
            <p className={`mt-2 text-sm ${message.includes("error") || message.includes("Error") ? "text-red-400" : "text-accent"}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OtherPredictions({
  predictions,
  realHome,
  realAway,
}: {
  predictions: OtherPrediction[];
  realHome: number | null;
  realAway: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 border-t border-surface-light/50 pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-bold text-gold hover:text-gold/80"
      >
        {open ? "▾" : "▸"} Predicciones de jugadores ({predictions.length})
      </button>
      {open && (
        <div className="mt-1.5 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {predictions.map((p) => {
            let bg = "bg-surface/30";
            if (realHome != null && realAway != null) {
              const isExact = p.predHomeScore === realHome && p.predAwayScore === realAway;
              const realOut = realHome > realAway ? "H" : realHome < realAway ? "A" : "D";
              const predOut = p.predHomeScore > p.predAwayScore ? "H" : p.predHomeScore < p.predAwayScore ? "A" : "D";
              if (isExact) bg = "bg-gold/10 border-gold/30";
              else if (realOut === predOut) bg = "bg-accent/10 border-accent/30";
              else bg = "bg-red-500/5 border-red-500/20";
            }
            return (
              <div
                key={p.username}
                className={`rounded-lg border border-surface-light/50 px-2 py-1.5 text-xs ${bg}`}
              >
                <span className="font-medium text-foreground/70">{p.username}</span>
                <span className="ml-1 font-bold">
                  {p.predHomeScore}-{p.predAwayScore}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PointsBadge({
  pred,
  real,
}: {
  pred: { predHomeScore: number; predAwayScore: number };
  real: { home: number; away: number };
}) {
  const isExact = pred.predHomeScore === real.home && pred.predAwayScore === real.away;

  if (isExact) {
    return <span className="rounded bg-gold/20 px-1.5 py-0.5 font-bold text-gold">+5 Exacto!</span>;
  }

  const realOutcome = real.home > real.away ? "home" : real.home < real.away ? "away" : "draw";
  const predOutcome =
    pred.predHomeScore > pred.predAwayScore
      ? "home"
      : pred.predHomeScore < pred.predAwayScore
        ? "away"
        : "draw";

  if (realOutcome === predOutcome) {
    return <span className="rounded bg-accent/20 px-1.5 py-0.5 font-bold text-accent">+3 Ganador</span>;
  }

  return <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400">+0</span>;
}
