"use client";

import { useState, useEffect } from "react";
import { getTopScorerPredictions } from "@/lib/actions/prode";

interface Prediction {
  playerName: string;
  pointsEarned: number;
  user: { username: string; avatarUrl: string | null };
}

export function TopScorerPredictions({ prodeId }: { prodeId: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopScorerPredictions(prodeId).then((data) => {
      setPredictions(data as Prediction[]);
      setLoading(false);
    });
  }, [prodeId]);

  if (loading) return null;
  if (predictions.length === 0) return null;

  const grouped = predictions.reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.playerName]) acc[p.playerName] = [];
    acc[p.playerName].push(p.user.username);
    return acc;
  }, {});

  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-light">
        <h3 className="text-sm font-bold">⚽ Predicciones de goleador</h3>
      </div>
      <div className="p-4 space-y-2">
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
      <div className="px-4 py-2 border-t border-surface-light/50">
        <p className="text-[10px] text-foreground/30">
          {predictions.length} predicciones · +15 pts si acertás al goleador
        </p>
      </div>
    </div>
  );
}
