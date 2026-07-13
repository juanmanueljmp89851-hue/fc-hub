"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { propagateBracket } from "@/lib/actions/admin";
import { scoreTopScorerPredictions, scoreChampionPredictions } from "@/lib/actions/prode";

const TOP_SCORER_OPTIONS = [
  "Lionel Messi",
  "Erling Haaland",
  "Kylian Mbappé",
  "Ousmane Dembélé",
  "Harry Kane",
  "Jude Bellingham",
  "Mikel Oyarzabal",
];

export function ProdeTools() {
  return (
    <div className="space-y-6">
      <BracketPropagator />
      <TopScorerScorer />
      <ChampionScorer />
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

function TopScorerScorer() {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState(TOP_SCORER_OPTIONS[0]);
  const [customPlayer, setCustomPlayer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ scored: number; total: number } | null>(null);

  async function handleScore() {
    const player = customPlayer || selectedPlayer;
    if (!player) return;
    setLoading(true);
    setResult(null);
    const res = await scoreTopScorerPredictions(player);
    if ("scored" in res) {
      setResult({ scored: res.scored!, total: res.total! });
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-surface-light bg-surface p-4">
      <h3 className="mb-2 font-bold">⚽ Asignar goleador del torneo</h3>
      <p className="mb-3 text-xs text-foreground/50">
        Seleccioná el goleador real y puntuá las predicciones de todos los prodes (+10 pts al que acertó)
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Goleador</label>
          <select
            value={selectedPlayer}
            onChange={(e) => { setSelectedPlayer(e.target.value); setCustomPlayer(""); }}
            className="rounded border border-surface-light bg-background px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            {TOP_SCORER_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="__custom__">Otro...</option>
          </select>
        </div>
        {selectedPlayer === "__custom__" && (
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Nombre</label>
            <input
              type="text"
              value={customPlayer}
              onChange={(e) => setCustomPlayer(e.target.value)}
              placeholder="Nombre del goleador"
              className="rounded border border-surface-light bg-background px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        )}
        <button
          onClick={handleScore}
          disabled={loading || (!customPlayer && selectedPlayer === "__custom__")}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Puntuando..." : "Puntuar"}
        </button>
      </div>
      {result && (
        <div className="mt-3 rounded-lg bg-background p-3 text-xs">
          <p className="font-bold text-green-400">
            ✅ {result.scored}/{result.total} participantes acertaron (+10 pts)
          </p>
        </div>
      )}
    </div>
  );
}

const CHAMPION_OPTIONS = ["Francia", "España", "Argentina", "Inglaterra"];

function ChampionScorer() {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState(CHAMPION_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ scored: number; total: number } | null>(null);

  async function handleScore() {
    setLoading(true);
    setResult(null);
    const res = await scoreChampionPredictions(selectedTeam);
    if ("scored" in res) {
      setResult({ scored: res.scored!, total: res.total! });
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-surface-light bg-surface p-4">
      <h3 className="mb-2 font-bold">🏆 Asignar campeón del torneo</h3>
      <p className="mb-3 text-xs text-foreground/50">
        Seleccioná el campeón real y puntuá las predicciones de todos los prodes (+5 pts al que acertó)
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Campeón</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="rounded border border-surface-light bg-background px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            {CHAMPION_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleScore}
          disabled={loading}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Puntuando..." : "Puntuar"}
        </button>
      </div>
      {result && (
        <div className="mt-3 rounded-lg bg-background p-3 text-xs">
          <p className="font-bold text-green-400">
            ✅ {result.scored}/{result.total} participantes acertaron (+5 pts)
          </p>
        </div>
      )}
    </div>
  );
}
