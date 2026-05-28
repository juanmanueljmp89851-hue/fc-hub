import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getRanking } from "@/lib/actions/casual";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Ranking de jugadores de EA FC Argentina. Subí posiciones ganando partidas.",
};

function getMedalClass(pos: number) {
  if (pos === 1) return "bg-gold text-background";
  if (pos === 2) return "bg-gray-300 text-background";
  if (pos === 3) return "bg-amber-700 text-white";
  return "bg-surface-light text-foreground/60";
}

interface PageProps {
  searchParams: { period?: string };
}

export default async function RankingPage({ searchParams }: PageProps) {
  const period = (searchParams.period ?? "all") as "all" | "month" | "week";
  const ranking = await getRanking({ period });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ranking General</h1>
            <p className="mt-1 text-foreground/60">
              Tabla de posiciones de partidos casuales
            </p>
          </div>
          <Link
            href="/casual"
            className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
          >
            Jugar casual
          </Link>
        </div>

        {/* Top 3 Cards */}
        {ranking.length >= 3 && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {ranking.slice(0, 3).map((entry, i) => (
              <Card
                key={entry!.id}
                className={`text-center ${
                  i === 0
                    ? "border-gold/50"
                    : i === 1
                      ? "border-gray-400/50"
                      : "border-amber-700/50"
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${getMedalClass(i + 1)}`}
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="mb-1 flex justify-center">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-surface">
                    {entry!.avatarUrl ? (
                      <Image src={entry!.avatarUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg text-foreground/30">👤</div>
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold">{entry!.username}</p>
                <p className="text-2xl font-bold text-accent">{entry!.rankingPoints} pts</p>
                {period === "all" && (
                  <div className="mt-2 flex justify-center gap-4 text-xs text-foreground/60">
                    <span>{entry!.won}V</span>
                    <span>{entry!.drawn}E</span>
                    <span>{entry!.lost}D</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <RankingFilters activePeriod={period} />

        {/* Table */}
        {ranking.length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <p className="text-foreground/50">No hay jugadores en el ranking todavía.</p>
            <Link
              href="/casual"
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              Jugá tu primer partido casual →
            </Link>
          </Card>
        ) : (
          <Card className="mt-4 overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-light text-left text-foreground/50">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Jugador</th>
                  {period === "all" && (
                    <>
                      <th className="px-4 py-3 font-medium text-center">PJ</th>
                      <th className="px-4 py-3 font-medium text-center">PG</th>
                      <th className="px-4 py-3 font-medium text-center">PE</th>
                      <th className="px-4 py-3 font-medium text-center">PP</th>
                      <th className="px-4 py-3 font-medium text-center">GF</th>
                      <th className="px-4 py-3 font-medium text-center">GC</th>
                      <th className="px-4 py-3 font-medium text-center">DIF</th>
                    </>
                  )}
                  <th className="px-4 py-3 font-medium text-center">PTS</th>
                  <th className="px-4 py-3 font-medium text-center">REP</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => {
                  const pos = i + 1;
                  const diff = entry!.goalsFor - entry!.goalsAgainst;
                  return (
                    <tr
                      key={entry!.id}
                      className="border-b border-surface-light/50 transition-colors hover:bg-surface-light/30"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${getMedalClass(pos)}`}
                        >
                          {pos}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface">
                            {entry!.avatarUrl ? (
                              <Image src={entry!.avatarUrl} alt="" fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">👤</div>
                            )}
                          </div>
                          <span className="font-medium">{entry!.username}</span>
                        </div>
                      </td>
                      {period === "all" && (
                        <>
                          <td className="px-4 py-3 text-center text-foreground/70">{entry!.played}</td>
                          <td className="px-4 py-3 text-center text-green-400">{entry!.won}</td>
                          <td className="px-4 py-3 text-center text-foreground/70">{entry!.drawn}</td>
                          <td className="px-4 py-3 text-center text-red-400">{entry!.lost}</td>
                          <td className="px-4 py-3 text-center text-foreground/70">{entry!.goalsFor}</td>
                          <td className="px-4 py-3 text-center text-foreground/70">{entry!.goalsAgainst}</td>
                          <td className="px-4 py-3 text-center font-medium">
                            <span className={diff > 0 ? "text-accent" : diff < 0 ? "text-red-400" : "text-foreground/70"}>
                              {diff > 0 ? "+" : ""}{diff}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center font-bold text-accent">{entry!.rankingPoints}</td>
                      <td className="px-4 py-3 text-center text-foreground/70">{entry!.reputationPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  );
}
