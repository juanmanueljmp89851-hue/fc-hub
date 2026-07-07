"use client";

import { useState, useEffect } from "react";
import {
  getTopScorerPredictions,
  getUserTopScorerPrediction,
  saveTopScorerPrediction,
} from "@/lib/actions/prode";

const TOP_SCORER_OPTIONS = [
  "Lionel Messi",
  "Erling Haaland",
  "Kylian Mbappé",
  "Ousmane Dembélé",
  "Harry Kane",
  "Jude Bellingham",
  "Mikel Oyarzabal",
];

interface Prediction {
  playerName: string;
  pointsEarned: number;
  user: { username: string; avatarUrl: string | null };
}

export function TopScorerPredictions({ prodeId }: { prodeId: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [topScorer, setTopScorer] = useState("");
  const [topScorerSaved, setTopScorerSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allPredictions, myPrediction] = await Promise.all([
        getTopScorerPredictions(prodeId),
        getUserTopScorerPrediction(prodeId),
      ]);
      setPredictions(allPredictions as Prediction[]);
      if (myPrediction) {
        setTopScorer(myPrediction.playerName);
        setTopScorerSaved(true);
      }
      setLoading(false);
    }
    load();
  }, [prodeId]);

  async function handleSave() {
    if (!topScorer) return;
    setSaving(true);
    setMessage("");
    const res = await saveTopScorerPrediction(prodeId, topScorer);
    if (res.error) {
      setMessage(res.error);
    } else {
      setTopScorerSaved(true);
      setMessage("¡Goleador guardado!");
      const updated = await getTopScorerPredictions(prodeId);
      setPredictions(updated as Prediction[]);
    }
    setSaving(false);
  }

  if (loading) return null;

  const grouped = predictions.reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.playerName]) acc[p.playerName] = [];
    acc[p.playerName].push(p.user.username);
    return acc;
  }, {});

  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-light flex items-center justify-between">
        <h3 className="text-sm font-bold">⚽ Goleador del torneo</h3>
        <span className="text-xs font-medium text-gold">+10 pts</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Picker or locked state */}
        {topScorerSaved ? (
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
            <p className="text-sm font-medium text-gold">🔒 Tu predicción: {topScorer}</p>
            <p className="mt-1 text-xs text-foreground/40">No se puede cambiar una vez elegido</p>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-xs text-foreground/50">
              Elegí quién creés que será el goleador del Mundial 2026.
              <span className="font-bold text-gold"> Una vez guardado no se puede cambiar.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {TOP_SCORER_OPTIONS.map((player) => (
                <button
                  key={player}
                  onClick={() => setTopScorer(player)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    topScorer === player
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-surface-light bg-surface/30 text-foreground/70 hover:border-gold/50 hover:text-gold"
                  }`}
                >
                  {player}
                </button>
              ))}
            </div>
            {topScorer && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-3 rounded-lg bg-gold px-5 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar goleador"}
              </button>
            )}
            {message && (
              <p className={`mt-2 text-xs ${message.includes("error") || message.includes("Error") || message.includes("Ya") ? "text-red-400" : "text-accent"}`}>
                {message}
              </p>
            )}
          </div>
        )}

        {/* All predictions */}
        {sorted.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground/50 uppercase">Predicciones de todos</h4>
            {sorted.map(([player, users]) => (
              <div key={player} className="flex items-center justify-between rounded-lg bg-surface-light/30 px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{player}</span>
                  <span className="ml-2 text-xs text-foreground/40">({users.length})</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {users.map((u) => (
                    <span key={u} className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] text-foreground/60">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {predictions.length > 0 && (
        <div className="px-4 py-2 border-t border-surface-light/50">
          <p className="text-[10px] text-foreground/30">
            {predictions.length} predicciones · +10 pts si acertás al goleador
          </p>
        </div>
      )}
    </div>
  );
}
