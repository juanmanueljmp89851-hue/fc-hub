import { FutCard } from "@/components/jugadores/FutCard";
import { POSITION_MAP, type FutPlayer, type PositionCategory } from "@/types/player";
import type { SbcSolution } from "@/lib/futgg";

type SolPlayer = SbcSolution["players"][number];

function toFutPlayer(p: SolPlayer): FutPlayer {
  return {
    id: String(p.eaId),
    eaId: p.eaId,
    name: p.name,
    commonName: p.commonName,
    position: p.position,
    alternatePositions: [],
    overall: p.overall,
    pace: p.pace,
    shooting: p.shooting,
    passing: p.passing,
    dribbling: p.dribbling,
    defending: p.defending,
    physical: p.physical,
    club: p.club,
    league: p.league,
    nation: p.nation,
    cardType: "special",
    cardFullUrl: p.cardFullUrl,
    imageUrl: p.imageUrl,
    skillMoves: p.skillMoves,
    weakFoot: p.weakFoot,
  };
}

function fmtCoins(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// Orden de líneas de arriba (ataque) a abajo (arco)
const LINES: PositionCategory[] = ["ATK", "MID", "DEF", "GK"];

export function SolutionPitch({ players }: { players: SolPlayer[] }) {
  const byLine: Record<PositionCategory, SolPlayer[]> = { ATK: [], MID: [], DEF: [], GK: [] };
  for (const p of players) {
    const cat = POSITION_MAP[p.position] ?? "MID";
    byLine[cat].push(p);
  }
  const activeLines = LINES.filter((l) => byLine[l].length > 0);

  return (
    <div className="overflow-x-auto">
      <div
        className="relative mx-auto min-w-[680px] overflow-hidden rounded-2xl border border-emerald-900/50 p-4"
        style={{
          background:
            "repeating-linear-gradient(180deg, #0f3d24 0px, #0f3d24 48px, #123f27 48px, #123f27 96px)",
        }}
      >
        {/* Líneas de cancha */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="none">
          <rect x="2%" y="2%" width="96%" height="96%" fill="none" stroke="white" strokeWidth="2" />
          <line x1="2%" y1="50%" x2="98%" y2="50%" stroke="white" strokeWidth="2" />
          <circle cx="50%" cy="50%" r="46" fill="none" stroke="white" strokeWidth="2" />
          <rect x="32%" y="2%" width="36%" height="14%" fill="none" stroke="white" strokeWidth="2" />
          <rect x="32%" y="84%" width="36%" height="14%" fill="none" stroke="white" strokeWidth="2" />
        </svg>

        {/* Líneas de jugadores */}
        <div className="relative z-10 flex flex-col gap-4">
          {activeLines.map((line) => (
            <div key={line} className="flex flex-wrap items-start justify-center gap-3">
              {byLine[line].map((p) => (
                <div key={p.eaId} className="flex flex-col items-center gap-1">
                  <FutCard player={toFutPlayer(p)} size="sm" />
                  <span className="rounded bg-black/40 px-1.5 text-[11px] font-bold text-gold">
                    {p.price != null ? fmtCoins(p.price) : "—"}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
