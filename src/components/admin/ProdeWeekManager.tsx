"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWeekStatus, updateMatchScore } from "@/lib/actions/admin";
import { scoreProdeWeek } from "@/lib/actions/prode";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: string;
  externalId: number | null;
  group: string | null;
}

interface Week {
  id: string;
  title: string;
  deadline: string;
  status: string;
  createdAt: string;
  matches: Match[];
  _count: { matches: number };
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-foreground/20 text-foreground/60",
  OPEN: "bg-accent/20 text-accent",
  CLOSED: "bg-gold/20 text-gold",
  SCORED: "bg-green-500/20 text-green-400",
};

const STATUS_OPTIONS = ["UPCOMING", "OPEN", "CLOSED", "SCORED"] as const;

export function ProdeWeekManager({ weeks }: { weeks: Week[] }) {
  const router = useRouter();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState("");
  const [editScores, setEditScores] = useState<Record<string, { home: string; away: string }>>({});

  async function handleStatusChange(weekId: string, status: string) {
    setLoading(weekId);
    await updateWeekStatus(weekId, status as "UPCOMING" | "OPEN" | "CLOSED" | "SCORED");
    router.refresh();
    setLoading("");
  }

  async function handleScoreSave(matchId: string) {
    const scores = editScores[matchId];
    if (!scores || scores.home === "" || scores.away === "") return;
    setLoading(matchId);
    await updateMatchScore(matchId, parseInt(scores.home), parseInt(scores.away));
    router.refresh();
    setLoading("");
  }

  async function handleScoreAll(weekId: string, matches: Match[]) {
    const finishedWithScores = matches.filter(
      (m) => m.status !== "FINISHED" && editScores[m.id]?.home !== "" && editScores[m.id]?.away !== "",
    );

    if (finishedWithScores.length === 0) return;
    setLoading(weekId + "-score");

    const results = finishedWithScores.map((m) => ({
      matchId: m.id,
      homeScore: parseInt(editScores[m.id].home),
      awayScore: parseInt(editScores[m.id].away),
    }));

    await scoreProdeWeek(weekId, results);
    router.refresh();
    setLoading("");
  }

  function initEditScores(matches: Match[]) {
    const initial: Record<string, { home: string; away: string }> = {};
    for (const m of matches) {
      initial[m.id] = {
        home: m.homeScore !== null ? String(m.homeScore) : "",
        away: m.awayScore !== null ? String(m.awayScore) : "",
      };
    }
    setEditScores(initial);
  }

  return (
    <div className="space-y-4">
      {weeks.map((week) => {
        const isExpanded = expandedWeek === week.id;

        return (
          <div key={week.id} className="rounded-xl border border-surface-light bg-surface">
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => {
                if (!isExpanded) initEditScores(week.matches);
                setExpandedWeek(isExpanded ? null : week.id);
              }}
            >
              <div>
                <h3 className="font-bold">{week.title}</h3>
                <p className="text-xs text-foreground/50">
                  Cierre: {new Date(week.deadline).toLocaleDateString("es-AR")} · {week._count.matches} partidos
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[week.status] ?? ""}`}>
                  {week.status}
                </span>
                <span className="text-foreground/30">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-surface-light p-4">
                {/* Status controls */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(week.id, s)}
                      disabled={loading === week.id || week.status === s}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        week.status === s
                          ? "bg-accent text-background"
                          : "border border-surface-light text-foreground/60 hover:border-accent hover:text-accent disabled:opacity-30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Matches */}
                <div className="space-y-2">
                  {week.matches.map((match) => (
                    <div key={match.id} className="flex items-center gap-3 rounded-lg bg-background p-3 text-sm">
                      <span className="w-8 text-center text-xs text-foreground/30">
                        {match.group ? `G${match.group}` : ""}
                      </span>
                      <span className="flex-1 text-right">{match.homeTeam}</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={editScores[match.id]?.home ?? ""}
                        onChange={(e) =>
                          setEditScores((prev) => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], home: e.target.value },
                          }))
                        }
                        className="w-10 rounded border border-surface-light bg-surface px-1 py-0.5 text-center font-bold focus:border-accent focus:outline-none"
                      />
                      <span className="text-foreground/30">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={editScores[match.id]?.away ?? ""}
                        onChange={(e) =>
                          setEditScores((prev) => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], away: e.target.value },
                          }))
                        }
                        className="w-10 rounded border border-surface-light bg-surface px-1 py-0.5 text-center font-bold focus:border-accent focus:outline-none"
                      />
                      <span className="flex-1">{match.awayTeam}</span>
                      <span className={`text-xs ${match.status === "FINISHED" ? "text-green-400" : "text-foreground/30"}`}>
                        {match.status === "FINISHED" ? "✓" : match.status === "IN_PROGRESS" ? "●" : "—"}
                      </span>
                      <button
                        onClick={() => handleScoreSave(match.id)}
                        disabled={loading === match.id}
                        className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent hover:bg-accent/30"
                      >
                        {loading === match.id ? "..." : "Guardar"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Score all button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleScoreAll(week.id, week.matches)}
                    disabled={loading === week.id + "-score"}
                    className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
                  >
                    {loading === week.id + "-score" ? "Puntuando..." : "Puntuar toda la jornada"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
