"use client";

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
}

export function LeagueTable({ standings }: LeagueTableProps) {
  if (standings.length === 0) {
    return <p className="text-sm text-foreground/50">No hay tabla de posiciones todavía</p>;
  }

  return (
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
          {standings.map((s, i) => (
            <tr
              key={s.id}
              className={`border-b border-surface-light/50 transition-colors hover:bg-surface/50 ${
                i < 2 ? "bg-accent/5" : ""
              }`}
            >
              <td className="px-2 py-2 font-bold text-foreground/60">{i + 1}</td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 overflow-hidden rounded-full bg-surface">
                    {s.user.avatarUrl ? (
                      <img src={s.user.avatarUrl} alt="" className="h-full w-full object-cover" />
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
