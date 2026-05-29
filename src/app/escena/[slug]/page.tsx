import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getExternalLeague } from "@/lib/actions/external-leagues";
import Link from "next/link";

function getGameModeLabel(mode: string) {
  const map: Record<string, string> = {
    CLUBS_PRO: "Clubes Pro",
    ULTIMATE_TEAM: "Ultimate Team",
    SEASONS: "Temporadas Online",
    MIXED: "Varios modos",
  };
  return map[mode] ?? mode;
}

function getSeasonStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    IN_PROGRESS: { label: "En curso", color: "bg-accent/20 text-accent" },
    UPCOMING: { label: "Próximamente", color: "bg-gold/20 text-gold" },
    FINISHED: { label: "Finalizada", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

interface PageProps {
  params: { slug: string };
}

export default async function ExternalLeagueDetailPage({ params }: PageProps) {
  const league = await getExternalLeague(params.slug);

  if (!league) {
    notFound();
  }

  const activeSeason = league.seasons.find((s) => s.status === "IN_PROGRESS") ?? league.seasons[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/escena" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a Competitivo
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {league.logoUrl ? (
              <Image src={league.logoUrl} alt={league.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-3xl">
                🏆
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{league.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {getGameModeLabel(league.gameMode)}
                </span>
                {league.platform.map((p) => (
                  <span key={p} className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60">
                    {p}
                  </span>
                ))}
                <span className="text-xs text-foreground/50">{league.country}</span>
              </div>
            </div>
          </div>

          {league.description && (
            <p className="mt-4 text-foreground/70">{league.description}</p>
          )}

          {/* Links */}
          <div className="mt-4 flex flex-wrap gap-3">
            {league.websiteUrl && (
              <a href={league.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-surface-light px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-accent hover:text-accent">
                🌐 Sitio web
              </a>
            )}
            {league.instagramUrl && (
              <a href={league.instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-surface-light px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-accent hover:text-accent">
                📸 Instagram
              </a>
            )}
            {league.discordUrl && (
              <a href={league.discordUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-surface-light px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-accent hover:text-accent">
                💬 Discord
              </a>
            )}
          </div>

          {league.lastFetchAt && (
            <p className="mt-3 text-xs text-foreground/40">
              Última actualización: {new Date(league.lastFetchAt).toLocaleString("es-AR")}
            </p>
          )}
        </div>

        {/* Seasons */}
        {league.seasons.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-foreground/50">No hay datos de temporadas todavía</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Season tabs */}
            {league.seasons.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {league.seasons.map((season) => {
                  const statusInfo = getSeasonStatusLabel(season.status);
                  return (
                    <span
                      key={season.id}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        season.id === activeSeason?.id ? statusInfo.color : "bg-surface-light text-foreground/50"
                      }`}
                    >
                      {season.name}
                    </span>
                  );
                })}
              </div>
            )}

            {activeSeason && (
              <>
                {/* Standings */}
                {activeSeason.standings.length > 0 && (
                  <Card className="overflow-x-auto p-0">
                    <CardHeader>
                      <CardTitle>
                        Posiciones — {activeSeason.name}
                      </CardTitle>
                    </CardHeader>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-light text-left text-foreground/50">
                          <th className="px-4 py-3 font-medium">#</th>
                          <th className="px-4 py-3 font-medium">Equipo</th>
                          {activeSeason.standings[0]?.division && (
                            <th className="px-4 py-3 font-medium">Div</th>
                          )}
                          <th className="px-4 py-3 font-medium text-center">PJ</th>
                          <th className="px-4 py-3 font-medium text-center">PG</th>
                          <th className="px-4 py-3 font-medium text-center">PE</th>
                          <th className="px-4 py-3 font-medium text-center">PP</th>
                          <th className="px-4 py-3 font-medium text-center">GF</th>
                          <th className="px-4 py-3 font-medium text-center">GC</th>
                          <th className="px-4 py-3 font-medium text-center">DIF</th>
                          <th className="px-4 py-3 font-medium text-center">PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSeason.standings.map((s) => {
                          const diff = s.goalsFor - s.goalsAgainst;
                          return (
                            <tr
                              key={s.id}
                              className="border-b border-surface-light/50 transition-colors hover:bg-surface-light/30"
                            >
                              <td className="px-4 py-3 font-bold text-foreground/60">{s.position}</td>
                              <td className="px-4 py-3 font-medium">{s.teamName}</td>
                              {activeSeason.standings[0]?.division && (
                                <td className="px-4 py-3 text-xs text-foreground/50">{s.division}</td>
                              )}
                              <td className="px-4 py-3 text-center text-foreground/70">{s.played}</td>
                              <td className="px-4 py-3 text-center text-green-400">{s.won}</td>
                              <td className="px-4 py-3 text-center text-foreground/70">{s.drawn}</td>
                              <td className="px-4 py-3 text-center text-red-400">{s.lost}</td>
                              <td className="px-4 py-3 text-center text-foreground/70">{s.goalsFor}</td>
                              <td className="px-4 py-3 text-center text-foreground/70">{s.goalsAgainst}</td>
                              <td className="px-4 py-3 text-center font-medium">
                                <span className={diff > 0 ? "text-accent" : diff < 0 ? "text-red-400" : "text-foreground/70"}>
                                  {diff > 0 ? "+" : ""}{diff}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-accent">{s.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>
                )}

                {/* Recent matches */}
                {activeSeason.matches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resultados recientes</CardTitle>
                    </CardHeader>
                    <div className="space-y-2">
                      {activeSeason.matches
                        .filter((m) => m.status === "FINISHED")
                        .slice(0, 20)
                        .map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 text-sm"
                          >
                            <span className={match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? "font-bold text-accent" : "text-foreground/70"}>
                              {match.homeTeam}
                            </span>
                            <div className="mx-4 text-center">
                              {match.homeScore !== null && match.awayScore !== null ? (
                                <span className="font-bold text-foreground">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                              ) : (
                                <span className="text-foreground/40">vs</span>
                              )}
                            </div>
                            <span className={match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore ? "font-bold text-accent" : "text-foreground/70"}>
                              {match.awayTeam}
                            </span>
                            {match.round && (
                              <span className="ml-4 text-xs text-foreground/40">{match.round}</span>
                            )}
                          </div>
                        ))}

                      {/* Upcoming matches */}
                      {activeSeason.matches.filter((m) => m.status === "SCHEDULED").length > 0 && (
                        <>
                          <h4 className="mt-4 text-sm font-semibold text-foreground/50">Próximos</h4>
                          {activeSeason.matches
                            .filter((m) => m.status === "SCHEDULED")
                            .slice(0, 10)
                            .map((match) => (
                              <div
                                key={match.id}
                                className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 text-sm"
                              >
                                <span className="text-foreground/70">{match.homeTeam}</span>
                                <div className="mx-4 text-center">
                                  <span className="text-foreground/40">vs</span>
                                  {match.matchDate && (
                                    <p className="text-xs text-foreground/40">
                                      {new Date(match.matchDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                                    </p>
                                  )}
                                </div>
                                <span className="text-foreground/70">{match.awayTeam}</span>
                                {match.round && (
                                  <span className="ml-4 text-xs text-foreground/40">{match.round}</span>
                                )}
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
