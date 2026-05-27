"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { saveAdvancePredictions, getUserAdvancePredictions } from "@/lib/actions/prode";

const ALL_TEAMS = [
  "México", "Serbia", "Canadá", "Países Bajos",
  "Estados Unidos", "Bolivia", "Turquía", "Gales",
  "Argentina", "Uzbekistán", "Dinamarca", "Perú",
  "Francia", "Colombia", "Corea del Sur", "Panamá",
  "Brasil", "Marruecos", "Japón", "Indonesia",
  "Alemania", "Uruguay", "Senegal", "República Checa",
];

const ROUNDS = [
  { key: "ROUND_32", label: "32avos de final", teamsNeeded: 32, pts: 1 },
  { key: "ROUND_16", label: "Octavos de final", teamsNeeded: 16, pts: 2 },
  { key: "QUARTERS", label: "Cuartos de final", teamsNeeded: 8, pts: 3 },
  { key: "SEMIS", label: "Semifinales", teamsNeeded: 4, pts: 5 },
  { key: "FINAL", label: "Final", teamsNeeded: 2, pts: 7 },
  { key: "CHAMPION", label: "Campeón", teamsNeeded: 1, pts: 10 },
];

export default function AvancePredictionPage() {
  const router = useRouter();
  const params = useParams();
  const prodeId = params.id as string;

  const [predictions, setPredictions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const existing = await getUserAdvancePredictions(prodeId);
      const preds: Record<string, string[]> = {};

      for (const round of ROUNDS) {
        const saved = existing.find((e) => e.round === round.key);
        preds[round.key] = saved?.teams ?? [];
      }

      setPredictions(preds);
      setInitialLoading(false);
    }
    load();
  }, [prodeId]);

  function toggleTeam(round: string, team: string, maxTeams: number) {
    setPredictions((prev) => {
      const current = prev[round] ?? [];
      if (current.includes(team)) {
        return { ...prev, [round]: current.filter((t) => t !== team) };
      }
      if (current.length >= maxTeams) return prev;
      return { ...prev, [round]: [...current, team] };
    });
  }

  function getAvailableTeams(roundKey: string): string[] {
    const roundIdx = ROUNDS.findIndex((r) => r.key === roundKey);
    if (roundIdx === 0) return ALL_TEAMS;
    const prevRound = ROUNDS[roundIdx - 1];
    const prevSelected = predictions[prevRound.key] ?? [];
    return prevSelected.length > 0 ? prevSelected : ALL_TEAMS;
  }

  async function handleSave() {
    setLoading(true);
    setMessage("");

    const rounds = Object.entries(predictions)
      .filter(([, teams]) => teams.length > 0)
      .map(([round, teams]) => ({ round, teams }));

    if (rounds.length === 0) {
      setMessage("Seleccioná al menos una predicción");
      setLoading(false);
      return;
    }

    const result = await saveAdvancePredictions(prodeId, rounds);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("¡Predicciones de avance guardadas!");
      router.refresh();
    }
    setLoading(false);
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => router.push(`/prode/${prodeId}`)}
          className="mb-4 text-sm text-foreground/50 hover:text-accent"
        >
          ← Volver al prode
        </button>

        <h1 className="mb-2 text-2xl font-bold">🏆 Avance por Rondas</h1>
        <p className="mb-6 text-sm text-foreground/60">
          Seleccioná qué equipos creés que avanzan en cada ronda.
          <br />
          Puntos por equipo acertado:{" "}
          {ROUNDS.map((r, i) => (
            <span key={r.key}>
              {i > 0 && " · "}
              <span className={r.pts >= 7 ? "text-gold" : "text-accent"}>
                {r.label}: +{r.pts}
              </span>
            </span>
          ))}
        </p>

        <div className="space-y-6">
          {ROUNDS.map((round) => {
            const selected = predictions[round.key] ?? [];
            const available = getAvailableTeams(round.key);

            return (
              <Card key={round.key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{round.label}</span>
                    <span className="text-sm font-normal text-foreground/50">
                      {selected.length}/{round.teamsNeeded}
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-wrap gap-2 px-4 pb-4">
                  {available.map((team) => {
                    const isSelected = selected.includes(team);
                    const isFull = selected.length >= round.teamsNeeded && !isSelected;
                    return (
                      <button
                        key={team}
                        onClick={() => toggleTeam(round.key, team, round.teamsNeeded)}
                        disabled={isFull}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-accent bg-accent/20 text-accent"
                            : isFull
                              ? "border-surface-light bg-surface/30 text-foreground/20 cursor-not-allowed"
                              : "border-surface-light bg-surface/30 text-foreground/70 hover:border-accent/50 hover:text-accent"
                        }`}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
                {available.length === 0 && (
                  <p className="px-4 pb-4 text-sm text-foreground/40">
                    Seleccioná equipos en la ronda anterior primero
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-6 rounded-lg border border-surface-light bg-surface p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">
              {ROUNDS.filter((r) => (predictions[r.key]?.length ?? 0) > 0).length}/{ROUNDS.length} rondas completadas
            </span>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-lg bg-accent px-6 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar avance por rondas"}
            </button>
          </div>
          {message && (
            <p className={`mt-2 text-sm ${message.includes("error") || message.includes("Error") ? "text-red-400" : "text-accent"}`}>
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
