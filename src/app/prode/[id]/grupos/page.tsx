"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { saveGroupPredictions, getUserGroupPredictions, getSimulatedGroupOrder } from "@/lib/actions/prode";
import { TEAM_CODES } from "@/lib/teamFlags";

const WORLD_CUP_GROUPS: Record<string, string[]> = {
  A: ["México", "Sudáfrica", "Corea del Sur", "Chequia"],
  B: ["Canadá", "Bosnia y Herzegovina", "Catar", "Suiza"],
  C: ["Brasil", "Marruecos", "Haití", "Escocia"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Turquía"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Países Bajos", "Japón", "Suecia", "Túnez"],
  G: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
  H: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Irak", "Noruega"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Portugal", "RD Congo", "Uzbekistán", "Colombia"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panamá"],
};

export default function GruposPredictionPage() {
  const router = useRouter();
  const params = useParams();
  const prodeId = params.id as string;

  const [predictions, setPredictions] = useState<
    Record<string, { first: string; second: string; third: string; fourth: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [simulatedOrder, setSimulatedOrder] = useState<Record<string, { first: string; second: string; third: string; fourth: string }> | null>(null);

  useEffect(() => {
    async function load() {
      const [existing, simulated] = await Promise.all([
        getUserGroupPredictions(prodeId),
        getSimulatedGroupOrder(prodeId),
      ]);
      const preds: typeof predictions = {};

      for (const [groupName, teams] of Object.entries(WORLD_CUP_GROUPS)) {
        const saved = existing.find((e) => e.groupName === groupName);
        if (saved) {
          preds[groupName] = {
            first: saved.first,
            second: saved.second,
            third: saved.third,
            fourth: saved.fourth,
          };
        } else if (simulated && simulated[groupName]) {
          preds[groupName] = simulated[groupName];
        } else {
          preds[groupName] = { first: teams[0], second: teams[1], third: teams[2], fourth: teams[3] };
        }
      }

      setPredictions(preds);
      setSimulatedOrder(simulated);
      setInitialLoading(false);
    }
    load();
  }, [prodeId]);

  function setPosition(group: string, position: "first" | "second" | "third" | "fourth", team: string) {
    setPredictions((prev) => {
      const current = prev[group];
      if (!current) return prev;

      // Swap: find what position the team currently holds
      const updated = { ...current };
      const positions = ["first", "second", "third", "fourth"] as const;
      const currentTeamPos = positions.find((p) => updated[p] === team);
      const targetTeam = updated[position];

      if (currentTeamPos && currentTeamPos !== position) {
        updated[currentTeamPos] = targetTeam;
      }
      updated[position] = team;

      return { ...prev, [group]: updated };
    });
  }

  async function handleSave() {
    setLoading(true);
    setMessage("");

    const groups = Object.entries(predictions).map(([groupName, pred]) => ({
      groupName,
      ...pred,
    }));

    const result = await saveGroupPredictions(prodeId, groups);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("¡Predicciones de grupos guardadas!");
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

        <h1 className="mb-2 text-2xl font-bold">📊 Orden de Grupos</h1>
        <p className="mb-6 text-sm text-foreground/60">
          Predecí cómo termina cada grupo. Arrastrá (o seleccioná) para ordenar 1° a 4°.
          <br />
          <span className="text-gold">+10 pts</span> si acertás los 4 ·{" "}
          <span className="text-accent">+6</span> por 3 ·{" "}
          <span className="text-accent">+3</span> por 2 ·{" "}
          <span className="text-foreground/50">+1</span> por 1
        </p>

        {simulatedOrder && Object.keys(simulatedOrder).length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => {
                setPredictions((prev) => {
                  const next = { ...prev };
                  for (const [g, order] of Object.entries(simulatedOrder)) {
                    next[g] = order;
                  }
                  return next;
                });
                setMessage("Orden auto-completado según tus predicciones de partidos");
              }}
              className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20"
            >
              ⚡ Auto-completar según tus predicciones de partidos
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(WORLD_CUP_GROUPS).map(([groupName, teams]) => {
            const pred = predictions[groupName];
            if (!pred) return null;
            const ordered = [pred.first, pred.second, pred.third, pred.fourth];
            const positions = ["first", "second", "third", "fourth"] as const;

            return (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle>Grupo {groupName}</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {positions.map((pos, i) => (
                    <div key={pos} className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold text-foreground/40">
                        {i + 1}°
                      </span>
                      {TEAM_CODES[ordered[i]] && (
                        <img
                          src={`https://flagcdn.com/w20/${TEAM_CODES[ordered[i]]}.png`}
                          alt=""
                          width={20}
                          height={15}
                          className="shrink-0"
                        />
                      )}
                      <select
                        value={ordered[i]}
                        onChange={(e) => setPosition(groupName, pos, e.target.value)}
                        className="flex-1 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                      >
                        {teams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-6 rounded-lg border border-surface-light bg-surface p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">
              {Object.keys(predictions).length} grupos configurados
            </span>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-lg bg-accent px-6 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar orden de grupos"}
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
