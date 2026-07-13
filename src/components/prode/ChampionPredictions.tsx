"use client";

import { useState, useEffect } from "react";
import {
  getChampionPredictions,
  getUserChampionPrediction,
  saveChampionPrediction,
} from "@/lib/actions/prode";

const CHAMPION_OPTIONS = ["Francia", "España", "Argentina", "Inglaterra"];

interface Prediction {
  teamName: string;
  pointsEarned: number;
  user: { username: string; avatarUrl: string | null };
}

export function ChampionPredictions({ prodeId }: { prodeId: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [champion, setChampion] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allPredictions, myPrediction] = await Promise.all([
        getChampionPredictions(prodeId),
        getUserChampionPrediction(prodeId),
      ]);
      setPredictions(allPredictions as Prediction[]);
      if (myPrediction) {
        setChampion(myPrediction.teamName);
        setSaved(true);
      }
      setLoading(false);
    }
    load();
  }, [prodeId]);

  async function handleSave() {
    if (!champion) return;
    setSaving(true);
    setMessage("");
    const res = await saveChampionPrediction(prodeId, champion);
    if (res.error) {
      setMessage(res.error);
    } else {
      setSaved(true);
      setMessage("¡Campeón guardado!");
      const updated = await getChampionPredictions(prodeId);
      setPredictions(updated as Prediction[]);
    }
    setSaving(false);
  }

  if (loading) return null;

  const grouped = predictions.reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.teamName]) acc[p.teamName] = [];
    acc[p.teamName].push(p.user.username);
    return acc;
  }, {});

  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  const FLAG: Record<string, string> = {
    Francia: "🇫🇷",
    España: "🇪🇸",
    Argentina: "🇦🇷",
    Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  };

  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-light flex items-center justify-between">
        <h3 className="text-sm font-bold">🏆 Predicción del campeón</h3>
        <span className="text-xs font-medium text-gold">+10 pts</span>
      </div>

      <div className="p-4 space-y-4">
        {saved ? (
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
            <p className="text-sm font-medium text-gold">🔒 Tu predicción: {FLAG[champion] || ""} {champion}</p>
            <p className="mt-1 text-xs text-foreground/40">No se puede cambiar una vez elegido</p>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-xs text-foreground/50">
              Elegí quién creés que será el campeón del Mundial 2026.
              <span className="font-bold text-gold"> Una vez guardado no se puede cambiar.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {CHAMPION_OPTIONS.map((team) => (
                <button
                  key={team}
                  onClick={() => setChampion(team)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    champion === team
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-surface-light bg-surface/30 text-foreground/70 hover:border-gold/50 hover:text-gold"
                  }`}
                >
                  {FLAG[team]} {team}
                </button>
              ))}
            </div>
            {champion && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-3 rounded-lg bg-gold px-5 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar campeón"}
              </button>
            )}
            {message && (
              <p className={`mt-2 text-xs ${message.includes("Ya") ? "text-red-400" : "text-accent"}`}>
                {message}
              </p>
            )}
          </div>
        )}

        {sorted.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground/50 uppercase">Predicciones de todos</h4>
            {sorted.map(([team, users]) => (
              <div key={team} className="flex items-center justify-between rounded-lg bg-surface-light/30 px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{FLAG[team]} {team}</span>
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
            {predictions.length} predicciones · +10 pts si acertás al campeón
          </p>
        </div>
      )}
    </div>
  );
}
