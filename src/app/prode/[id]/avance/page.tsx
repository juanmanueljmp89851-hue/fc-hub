"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  saveAdvancePredictions,
  getUserAdvancePredictions,
  getAdvanceRoundStatus,
  getAdvancedTeams,
} from "@/lib/actions/prode";
import { getFlag } from "@/lib/teamFlags";

const ALL_TEAMS = [
  // Group A
  "México", "Sudáfrica", "Corea del Sur", "Chequia",
  // Group B
  "Canadá", "Bosnia y Herzegovina", "Catar", "Suiza",
  // Group C
  "Brasil", "Marruecos", "Haití", "Escocia",
  // Group D
  "Estados Unidos", "Paraguay", "Australia", "Turquía",
  // Group E
  "Alemania", "Curazao", "Costa de Marfil", "Ecuador",
  // Group F
  "Países Bajos", "Japón", "Suecia", "Túnez",
  // Group G
  "Bélgica", "Egipto", "Irán", "Nueva Zelanda",
  // Group H
  "España", "Cabo Verde", "Arabia Saudita", "Uruguay",
  // Group I
  "Francia", "Senegal", "Irak", "Noruega",
  // Group J
  "Argentina", "Argelia", "Austria", "Jordania",
  // Group K
  "Portugal", "RD Congo", "Uzbekistán", "Colombia",
  // Group L
  "Inglaterra", "Croacia", "Ghana", "Panamá",
];

const ROUNDS = [
  { key: "ROUND_32", label: "Clasificados a Octavos de Final (32)", teamsNeeded: 32, pts: 1, prevLabel: "" },
  { key: "ROUND_16", label: "Octavos de final (16)", teamsNeeded: 16, pts: 2, prevLabel: "la fase de grupos" },
  { key: "QUARTERS", label: "Cuartos de final (8)", teamsNeeded: 8, pts: 3, prevLabel: "los octavos" },
  { key: "SEMIS", label: "Semifinales (4)", teamsNeeded: 4, pts: 5, prevLabel: "los cuartos" },
  { key: "FINAL", label: "Final (2)", teamsNeeded: 2, pts: 7, prevLabel: "las semis" },
  { key: "CHAMPION", label: "Campeón", teamsNeeded: 1, pts: 10, prevLabel: "la final" },
];

export default function AvancePredictionPage() {
  const router = useRouter();
  const params = useParams();
  const prodeId = params.id as string;

  const [predictions, setPredictions] = useState<Record<string, string[]>>({});
  const [roundStatus, setRoundStatus] = useState<Record<string, boolean>>({});
  const [advancedTeams, setAdvancedTeams] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [existing, status, advanced] = await Promise.all([
        getUserAdvancePredictions(prodeId),
        getAdvanceRoundStatus(),
        getAdvancedTeams(),
      ]);

      const preds: Record<string, string[]> = {};
      for (const round of ROUNDS) {
        const saved = existing.find((e) => e.round === round.key);
        preds[round.key] = saved?.teams ?? [];
      }

      setPredictions(preds);
      setRoundStatus(status);
      setAdvancedTeams(advanced);
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

    // First round: all teams
    if (roundIdx === 0) return ALL_TEAMS;

    // If real results exist for previous round, use those
    const prevRound = ROUNDS[roundIdx - 1];
    const realTeams = advancedTeams[prevRound.key];
    if (realTeams && realTeams.length > 0) return realTeams;

    // Otherwise use user's predictions from previous round
    const prevSelected = predictions[prevRound.key] ?? [];
    return prevSelected.length > 0 ? prevSelected : [];
  }

  async function handleSave() {
    setLoading(true);
    setMessage("");

    // Only save open rounds
    const rounds = Object.entries(predictions)
      .filter(([round, teams]) => teams.length > 0 && roundStatus[round])
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

  const openRounds = ROUNDS.filter((r) => roundStatus[r.key]);
  const lockedRounds = ROUNDS.filter((r) => !roundStatus[r.key]);

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
          Las rondas se desbloquean a medida que avanza el torneo.
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
          {/* Open rounds — editable */}
          {openRounds.map((round) => {
            const selected = predictions[round.key] ?? [];
            const available = getAvailableTeams(round.key);

            return (
              <Card key={round.key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                      {round.label}
                    </span>
                    <span className="text-sm font-normal text-foreground/50">
                      {selected.length}/{round.teamsNeeded} · <span className="text-accent">+{round.pts} c/u</span>
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
                        {getFlag(team)} {team}
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

          {/* Locked rounds — show as disabled */}
          {lockedRounds.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-foreground/30">Próximas rondas</h3>
              {lockedRounds.map((round) => {
                const saved = predictions[round.key] ?? [];
                return (
                  <Card key={round.key} className="opacity-50">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/30">🔒</span>
                        <span className="font-medium text-foreground/50">{round.label}</span>
                      </div>
                      <span className="text-xs text-foreground/30">
                        {saved.length > 0
                          ? `${saved.length} equipos guardados`
                          : `Se habilita al terminar ${round.prevLabel}`}
                      </span>
                    </div>
                    {saved.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                        {saved.map((team) => (
                          <span
                            key={team}
                            className="rounded-full border border-surface-light/50 px-2.5 py-1 text-xs text-foreground/40"
                          >
                            {getFlag(team)} {team}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button — only if there are open rounds */}
        {openRounds.length > 0 && (
          <div className="sticky bottom-4 mt-6 rounded-lg border border-surface-light bg-surface p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">
                {openRounds.filter((r) => (predictions[r.key]?.length ?? 0) > 0).length}/{openRounds.length} rondas habilitadas completadas
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
        )}
      </main>
    </div>
  );
}
