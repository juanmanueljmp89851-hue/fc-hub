"use client";

import Image from "next/image";

interface StandingData {
  id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface LeagueTableProps {
  standings: StandingData[];
  relegationCount?: number;
  cup1Name?: string;
  cup1Spots?: number;
  cup2Name?: string;
  cup2Spots?: number;
  isFinished?: boolean;
}

function getPositionIcon(pos: number): string | null {
  if (pos === 1) return "🏆";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return null;
}

type Zone = "champion" | "cup1" | "cup2" | "normal" | "relegation";

function getZone(
  pos: number,
  total: number,
  cup1Spots: number,
  cup2Spots: number,
  relegationCount: number,
): Zone {
  if (pos === 1) return "champion";
  if (cup1Spots > 0 && pos <= cup1Spots) return "cup1";
  if (cup2Spots > 0 && pos <= cup1Spots + cup2Spots) return "cup2";
  if (relegationCount > 0 && pos > total - relegationCount) return "relegation";
  return "normal";
}

const ZONE_STYLES: Record<Zone, string> = {
  champion: "border-l-4 border-l-gold bg-gold/5",
  cup1: "border-l-4 border-l-accent bg-accent/5",
  cup2: "border-l-4 border-l-blue-400 bg-blue-400/5",
  normal: "",
  relegation: "border-l-4 border-l-red-500 bg-red-500/5",
};

export function LeagueTable({
  standings,
  relegationCount = 0,
  cup1Name,
  cup1Spots = 0,
  cup2Name,
  cup2Spots = 0,
  isFinished = false,
}: LeagueTableProps) {
  if (standings.length === 0) {
    return <p className="text-sm text-foreground/50">No hay tabla de posiciones todavía</p>;
  }

  const total = standings.length;
  const hasZones = cup1Spots > 0 || cup2Spots > 0 || relegationCount > 0;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-light text-xs font-semibold uppercase text-foreground/50">
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Jugador</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">PG</th>
              <th className="px-2 py-2 text-center">PE</th>
              <th className="px-2 py-2 text-center">PP</th>
              <th className="px-2 py-2 text-center">GF</th>
              <th className="px-2 py-2 text-center">GC</th>
              <th className="px-2 py-2 text-center">DG</th>
              <th className="px-2 py-2 text-center font-bold text-accent">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const pos = i + 1;
              const zone = getZone(pos, total, cup1Spots, cup2Spots, relegationCount);
              const icon = isFinished ? getPositionIcon(pos) : null;

              return (
                <tr
                  key={s.id}
                  className={`border-b border-surface-light/50 transition-colors hover:bg-surface/50 ${ZONE_STYLES[zone]}`}
                >
                  <td className="px-2 py-2 font-bold text-foreground/60">
                    <span className="flex items-center gap-1">
                      {icon && <span>{icon}</span>}
                      {pos}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="relative h-5 w-5 overflow-hidden rounded-full bg-surface">
                        {s.user.avatarUrl ? (
                          <Image src={s.user.avatarUrl} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">
                            👤
                          </div>
                        )}
                      </div>
                      <span className="font-medium">{s.user.username}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-foreground/60">{s.played}</td>
                  <td className="px-2 py-2 text-center text-foreground/60">{s.won}</td>
                  <td className="px-2 py-2 text-center text-foreground/60">{s.drawn}</td>
                  <td className="px-2 py-2 text-center text-foreground/60">{s.lost}</td>
                  <td className="px-2 py-2 text-center text-foreground/60">{s.goalsFor}</td>
                  <td className="px-2 py-2 text-center text-foreground/60">{s.goalsAgainst}</td>
                  <td className="px-2 py-2 text-center text-foreground/60">
                    {s.goalsFor - s.goalsAgainst > 0 ? "+" : ""}
                    {s.goalsFor - s.goalsAgainst}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-accent">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Zone legend */}
      {hasZones && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground/50">
          {cup1Spots > 0 && cup1Name && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-1 rounded-full bg-accent" />
              {cup1Name} ({cup1Spots} plazas)
            </span>
          )}
          {cup2Spots > 0 && cup2Name && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-1 rounded-full bg-blue-400" />
              {cup2Name} ({cup2Spots} plazas)
            </span>
          )}
          {relegationCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-1 rounded-full bg-red-500" />
              Descenso ({relegationCount})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
