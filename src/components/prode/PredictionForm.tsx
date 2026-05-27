"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { savePredictions } from "@/lib/actions/prode";
import { getCurrentUser } from "@/lib/actions/user";

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
  predictions?: { predHomeScore: number; predAwayScore: number }[];
}

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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
  }, [matches]);

  const isOpen = weekStatus === "OPEN";
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
      .map(([matchId, v]) => ({
        matchId,
        predHomeScore: parseInt(v.home) || 0,
        predAwayScore: parseInt(v.away) || 0,
      }));

    if (preds.length === 0) {
      setMessage("Completá al menos una predicción");
      setLoading(false);
      return;
    }

    const result = await savePredictions(prodeId, weekId, preds);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(`¡${preds.length} predicciones guardadas!`);
      router.refresh();
    }
    setLoading(false);
  }

  // Group matches by stage/group
  const grouped = new Map<string, MatchWithPrediction[]>();
  for (const match of matches) {
    const key = match.group ? `Grupo ${match.group}` : match.stage ?? "Partidos";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(match);
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

      {Array.from(grouped.entries()).map(([groupName, groupMatches]) => (
        <div key={groupName}>
          <h3 className="mb-3 text-sm font-bold uppercase text-foreground/50">{groupName}</h3>
          <div className="space-y-3">
            {groupMatches.map((match) => {
              const pred = predictions[match.id];
              const isFinished = match.status === "FINISHED";
              const existingPred = match.predictions?.[0];

              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-surface-light bg-background p-4"
                >
                  {/* Match date + venue */}
                  <div className="mb-2 flex flex-wrap items-center justify-between text-xs text-foreground/40">
                    <span>
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
                    <span className="w-32 text-right font-medium">{match.homeTeam}</span>

                    {canPredict && !isFinished ? (
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

                    <span className="w-32 font-medium">{match.awayTeam}</span>
                  </div>
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
