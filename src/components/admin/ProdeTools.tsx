"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { propagateBracket, getGroupsForScoring } from "@/lib/actions/admin";
import { scoreGroupPredictions } from "@/lib/actions/prode";

export function ProdeTools() {
  return (
    <div className="space-y-6">
      <BracketPropagator />
      <GroupScorer />
    </div>
  );
}

function BracketPropagator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updates: number; log: string[] } | null>(null);

  async function handlePropagate() {
    setLoading(true);
    setResult(null);
    const res = await propagateBracket();
    if ("updates" in res) {
      setResult({ updates: res.updates, log: res.log });
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-surface-light bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">🔄 Propagar bracket</h3>
          <p className="text-xs text-foreground/50">
            Actualiza equipos en octavos/cuartos/semis/final con ganadores de rondas anteriores
          </p>
        </div>
        <button
          onClick={handlePropagate}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Propagando..." : "Propagar"}
        </button>
      </div>
      {result && (
        <div className="mt-3 rounded-lg bg-background p-3 text-xs">
          {result.updates === 0 ? (
            <p className="text-foreground/50">Sin cambios — no hay nuevos ganadores para propagar.</p>
          ) : (
            <>
              <p className="mb-2 font-bold text-green-400">✅ {result.updates} equipos actualizados</p>
              {result.log.map((line, i) => (
                <p key={i} className="text-foreground/60">• {line}</p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GroupScorer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scoringGroup, setScoringGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [scoredGroups, setScoredGroups] = useState<string[]>([]);
  const [order, setOrder] = useState<{ first: string; second: string; third: string; fourth: string }>({
    first: "",
    second: "",
    third: "",
    fourth: "",
  });
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getGroupsForScoring();
      setGroups(data.groups);
      setScoredGroups(data.scoredGroups);
    }
    load();
  }, []);

  function openGroup(groupName: string) {
    const teams = groups[groupName] ?? [];
    setScoringGroup(groupName);
    setOrder({
      first: teams[0] ?? "",
      second: teams[1] ?? "",
      third: teams[2] ?? "",
      fourth: teams[3] ?? "",
    });
    setResult(null);
  }

  async function handleScore() {
    if (!scoringGroup) return;
    if (!order.first || !order.second || !order.third || !order.fourth) return;
    const unique = new Set([order.first, order.second, order.third, order.fourth]);
    if (unique.size !== 4) {
      setResult("Error: equipos repetidos");
      return;
    }
    setLoading(true);
    const res = await scoreGroupPredictions(scoringGroup, order);
    if ("error" in res) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(`✅ Grupo ${scoringGroup} puntuado`);
      setScoredGroups((prev) => [...prev, scoringGroup!]);
      setScoringGroup(null);
    }
    router.refresh();
    setLoading(false);
  }

  const groupNames = Object.keys(groups).sort();

  if (groupNames.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-light bg-surface p-4">
      <h3 className="mb-1 font-bold">📊 Puntuar predicciones de grupo</h3>
      <p className="mb-3 text-xs text-foreground/50">
        Seleccioná un grupo e ingresá el orden final real (1° a 4°)
      </p>

      <div className="flex flex-wrap gap-2">
        {groupNames.map((g) => {
          const isScored = scoredGroups.includes(g);
          return (
            <button
              key={g}
              onClick={() => !isScored && openGroup(g)}
              disabled={isScored}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isScored
                  ? "bg-green-500/20 text-green-400 cursor-default"
                  : scoringGroup === g
                    ? "bg-accent text-background"
                    : "border border-surface-light text-foreground/60 hover:border-accent hover:text-accent"
              }`}
            >
              {isScored ? `✓ G${g}` : `G${g}`}
            </button>
          );
        })}
      </div>

      {scoringGroup && (
        <div className="mt-4 rounded-lg bg-background p-4">
          <h4 className="mb-3 text-sm font-bold">Grupo {scoringGroup} — Orden final</h4>
          {(["first", "second", "third", "fourth"] as const).map((pos, i) => (
            <div key={pos} className="mb-2 flex items-center gap-3">
              <span className="w-6 text-center text-sm font-bold text-foreground/40">{i + 1}°</span>
              <select
                value={order[pos]}
                onChange={(e) => setOrder((prev) => ({ ...prev, [pos]: e.target.value }))}
                className="flex-1 rounded border border-surface-light bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
              >
                {(groups[scoringGroup] ?? []).map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleScore}
              disabled={loading}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Puntuando..." : "Puntuar grupo"}
            </button>
            <button
              onClick={() => setScoringGroup(null)}
              className="text-xs text-foreground/40 hover:text-foreground/60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {result && (
        <p className={`mt-3 text-xs ${result.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
