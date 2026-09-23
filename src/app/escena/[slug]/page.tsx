import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getExternalLeague } from "@/lib/actions/external-leagues";
import { getTournamentBySlug } from "@/lib/tournaments-db";
import type { Tournament, TournamentStanding, TournamentMatch, TournamentScorer, TournamentBracket } from "@/lib/tournaments-db";
import Link from "next/link";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const league = await getExternalLeague(params.slug);
  if (league) {
    return {
      title: `${league.name} — Competitivo | Modo Fosa`,
      description: league.description || `${league.name} — Cobertura competitiva de EA FC en Modo Fosa.`,
      alternates: { canonical: `/escena/${league.slug}` },
      openGraph: {
        title: `${league.name} | Modo Fosa`,
        description: league.description || `Cobertura competitiva en Modo Fosa`,
        ...(league.logoUrl && { images: [{ url: league.logoUrl }] }),
      },
    };
  }

  const tournament = await getTournamentBySlug(params.slug);
  if (tournament) {
    return {
      title: `${tournament.name} — Competitivo | Modo Fosa`,
      description: tournament.description || `Cobertura de ${tournament.name} por Modo Fosa.`,
      alternates: { canonical: `/escena/${tournament.slug}` },
      openGraph: {
        title: `${tournament.name} | Modo Fosa`,
        description: tournament.description,
        ...(tournament.logoUrl && { images: [{ url: tournament.logoUrl }] }),
      },
    };
  }

  return { title: "Torneo no encontrado | Modo Fosa" };
}

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

const STATUS_STYLES: Record<string, string> = {
  live: "bg-green-500/20 text-green-400",
  upcoming: "bg-accent/10 text-accent",
  completed: "bg-surface-light text-foreground/50",
  tba: "bg-surface-light text-foreground/40",
};

export default async function TournamentDetailPage({ params }: PageProps) {
  const league = await getExternalLeague(params.slug);
  if (league) return <ExternalLeagueDetail league={league} />;

  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) notFound();

  return <TournamentDetail tournament={tournament} />;
}

/* ─── Standings Table ─── */
function StandingsTable({ standings, title }: { standings: TournamentStanding[]; title?: string }) {
  return (
    <Card className="overflow-x-auto p-0">
      {title && (
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-light text-left text-foreground/50">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Equipo</th>
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
          {standings.map((s, i) => {
            const diff = s.goalsFor - s.goalsAgainst;
            return (
              <tr key={i} className="border-b border-surface-light/50 transition-colors hover:bg-surface-light/30">
                <td className="px-4 py-3 font-bold text-foreground/60">{s.position}</td>
                <td className="px-4 py-3 font-medium">{s.team}</td>
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
  );
}

/* ─── Match List ─── */
function MatchList({ matches, title }: { matches: TournamentMatch[]; title?: string }) {
  const finished = matches.filter((m) => m.status === "finished");
  const scheduled = matches.filter((m) => m.status === "scheduled");
  const live = matches.filter((m) => m.status === "live");

  return (
    <Card>
      {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
      <div className="space-y-2 p-4">
        {live.length > 0 && (
          <>
            <h4 className="text-sm font-bold text-green-400">🔴 En vivo</h4>
            {live.map((m, i) => <MatchRow key={`live-${i}`} match={m} />)}
          </>
        )}
        {finished.length > 0 && (
          <>
            {live.length > 0 && <h4 className="mt-4 text-sm font-semibold text-foreground/50">Resultados</h4>}
            {finished.map((m, i) => <MatchRow key={`fin-${i}`} match={m} />)}
          </>
        )}
        {scheduled.length > 0 && (
          <>
            <h4 className="mt-4 text-sm font-semibold text-foreground/50">Próximos</h4>
            {scheduled.map((m, i) => <MatchRow key={`sch-${i}`} match={m} />)}
          </>
        )}
      </div>
    </Card>
  );
}

function MatchRow({ match: m }: { match: TournamentMatch }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 text-sm">
      <div className="flex-1 text-right">
        <span className={m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore ? "font-bold text-accent" : "text-foreground/70"}>
          {m.home}
        </span>
      </div>
      <div className="mx-4 min-w-[60px] text-center">
        {m.homeScore != null && m.awayScore != null ? (
          <span className="font-bold text-foreground">{m.homeScore} - {m.awayScore}</span>
        ) : m.date ? (
          <span className="text-xs text-foreground/40">{m.date}</span>
        ) : (
          <span className="text-foreground/40">vs</span>
        )}
      </div>
      <div className="flex-1">
        <span className={m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore ? "font-bold text-accent" : "text-foreground/70"}>
          {m.away}
        </span>
      </div>
      {(m.round || m.stage) && (
        <span className="ml-3 whitespace-nowrap text-[11px] text-foreground/40">{m.stage || m.round}</span>
      )}
    </div>
  );
}

/* ─── Top Scorers ─── */
function TopScorersTable({ scorers }: { scorers: TournamentScorer[] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <CardHeader><CardTitle>Goleadores</CardTitle></CardHeader>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-light text-left text-foreground/50">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Jugador</th>
            <th className="px-4 py-3 font-medium">Equipo</th>
            <th className="px-4 py-3 font-medium text-center">⚽</th>
            {scorers[0]?.assists != null && <th className="px-4 py-3 font-medium text-center">🅰️</th>}
          </tr>
        </thead>
        <tbody>
          {scorers.map((s, i) => (
            <tr key={i} className="border-b border-surface-light/50 transition-colors hover:bg-surface-light/30">
              <td className="px-4 py-3 font-bold text-foreground/60">{i + 1}</td>
              <td className="px-4 py-3 font-medium">{s.name}</td>
              <td className="px-4 py-3 text-foreground/70">{s.team}</td>
              <td className="px-4 py-3 text-center font-bold text-gold">{s.goals}</td>
              {scorers[0]?.assists != null && <td className="px-4 py-3 text-center text-accent">{s.assists ?? 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ─── Bracket ─── */
function BracketSection({ brackets }: { brackets: TournamentBracket[] }) {
  return (
    <div className="space-y-6">
      {brackets.map((b, i) => (
        <Card key={i}>
          <CardHeader><CardTitle>{b.stage}</CardTitle></CardHeader>
          <div className="space-y-2 p-4">
            {b.matches.map((m, j) => <MatchRow key={j} match={m} />)}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── JSON Tournament Detail Page ─── */
function TournamentDetail({ tournament: t }: { tournament: Tournament }) {
  const hasStandings = (t.standings && t.standings.length > 0) || (t.groups && t.groups.length > 0);
  const hasMatches = t.matches && t.matches.length > 0;
  const hasScorers = t.topScorers && t.topScorers.length > 0;
  const hasBrackets = t.brackets && t.brackets.length > 0;
  const hasContent = hasStandings || hasMatches || hasScorers || hasBrackets || t.content;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/escena" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a Competitivo
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {t.logoUrl ? (
              <Image src={t.logoUrl} alt={t.name} width={64} height={64} className="h-16 w-16 rounded-xl object-contain" unoptimized />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-3xl">🏆</div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{t.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{t.mode}</span>
                <span className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60">{t.region}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[t.status] ?? STATUS_STYLES.tba}`}>
                  {t.statusLabel}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-foreground/70">{t.description}</p>

          {/* Info cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile label="Organizador" value={t.org} />
            <InfoTile label="Fechas" value={t.dates} />
            {t.prizePool && <InfoTile label="Premio" value={t.prizePool} highlight />}
            {t.format && <InfoTile label="Formato" value={t.format} />}
          </div>

          {t.updatedAt && (
            <p className="mt-3 text-xs text-foreground/40">
              Última actualización: {new Date(t.updatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Content sections */}
        {hasContent ? (
          <div className="space-y-8">
            {t.content && (
              <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/70" dangerouslySetInnerHTML={{ __html: t.content }} />
            )}

            {/* Groups */}
            {t.groups && t.groups.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Fase de Grupos</h2>
                <div className="space-y-6">
                  {t.groups.map((g, i) => (
                    <StandingsTable key={i} standings={g.standings} title={g.name} />
                  ))}
                </div>
              </section>
            )}

            {/* Standings (no groups) */}
            {t.standings && t.standings.length > 0 && !t.groups && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Posiciones</h2>
                <StandingsTable standings={t.standings} />
              </section>
            )}

            {/* Brackets / Playoffs */}
            {hasBrackets && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Playoffs</h2>
                <BracketSection brackets={t.brackets!} />
              </section>
            )}

            {/* Matches / Fixture */}
            {hasMatches && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Fixture</h2>
                <MatchList matches={t.matches!} />
              </section>
            )}

            {/* Top Scorers */}
            {hasScorers && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Goleadores</h2>
                <TopScorersTable scorers={t.topScorers!} />
              </section>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <span className="mb-2 block text-3xl">📡</span>
            <h2 className="text-lg font-bold text-foreground/80">Cobertura en curso</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50">
              Estamos siguiendo este torneo. A medida que avance vamos a ir publicando resultados, brackets y análisis.
            </p>
          </Card>
        )}

        <p className="mt-8 text-center text-[11px] text-foreground/30">
          Cobertura de Modo Fosa · ¿Tenés info para aportar?{" "}
          <a href="https://instagram.com/modofosa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            @modofosa
          </a>
        </p>
      </main>
    </div>
  );
}

function InfoTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${highlight ? "border-gold/20 bg-gold/5" : "border-surface-light bg-surface/30"}`}>
      <span className="block text-[10px] uppercase text-foreground/40">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

/* ─── ExternalLeague Detail Page (DB-backed) ─── */
function ExternalLeagueDetail({ league }: { league: NonNullable<Awaited<ReturnType<typeof getExternalLeague>>> }) {
  const activeSeason = league.seasons.find((s) => s.status === "IN_PROGRESS") ?? league.seasons[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/escena" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a Competitivo
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {league.logoUrl ? (
              <Image src={league.logoUrl} alt={league.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-3xl">🏆</div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{league.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {getGameModeLabel(league.gameMode)}
                </span>
                {league.platform.map((p) => (
                  <span key={p} className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60">{p}</span>
                ))}
                <span className="text-xs text-foreground/50">{league.country}</span>
              </div>
            </div>
          </div>

          {league.description && <p className="mt-4 text-foreground/70">{league.description}</p>}

          {league.lastFetchAt && (
            <p className="mt-3 text-xs text-foreground/40">
              Última actualización: {new Date(league.lastFetchAt).toLocaleString("es-AR")}
            </p>
          )}
        </div>

        {league.seasons.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-foreground/50">No hay datos de temporadas todavía</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {league.seasons.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {league.seasons.map((season) => {
                  const statusInfo = getSeasonStatusLabel(season.status);
                  return (
                    <span key={season.id} className={`rounded-full px-3 py-1 text-xs font-bold ${season.id === activeSeason?.id ? statusInfo.color : "bg-surface-light text-foreground/50"}`}>
                      {season.name}
                    </span>
                  );
                })}
              </div>
            )}

            {activeSeason && (
              <>
                {activeSeason.standings.length > 0 && (
                  <Card className="overflow-x-auto p-0">
                    <CardHeader><CardTitle>Posiciones — {activeSeason.name}</CardTitle></CardHeader>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-light text-left text-foreground/50">
                          <th className="px-4 py-3 font-medium">#</th>
                          <th className="px-4 py-3 font-medium">Equipo</th>
                          {activeSeason.standings[0]?.division && <th className="px-4 py-3 font-medium">Div</th>}
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
                            <tr key={s.id} className="border-b border-surface-light/50 transition-colors hover:bg-surface-light/30">
                              <td className="px-4 py-3 font-bold text-foreground/60">{s.position}</td>
                              <td className="px-4 py-3 font-medium">{s.teamName}</td>
                              {activeSeason.standings[0]?.division && <td className="px-4 py-3 text-xs text-foreground/50">{s.division}</td>}
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

                {activeSeason.matches.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Resultados recientes</CardTitle></CardHeader>
                    <div className="space-y-2 p-4">
                      {activeSeason.matches
                        .filter((m) => m.status === "FINISHED")
                        .slice(0, 20)
                        .map((match) => (
                          <div key={match.id} className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 text-sm">
                            <span className={match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore ? "font-bold text-accent" : "text-foreground/70"}>
                              {match.homeTeam}
                            </span>
                            <div className="mx-4 text-center">
                              {match.homeScore != null && match.awayScore != null ? (
                                <span className="font-bold text-foreground">{match.homeScore} - {match.awayScore}</span>
                              ) : (
                                <span className="text-foreground/40">vs</span>
                              )}
                            </div>
                            <span className={match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore ? "font-bold text-accent" : "text-foreground/70"}>
                              {match.awayTeam}
                            </span>
                            {match.round && <span className="ml-4 text-xs text-foreground/40">{match.round}</span>}
                          </div>
                        ))}

                      {activeSeason.matches.filter((m) => m.status === "SCHEDULED").length > 0 && (
                        <>
                          <h4 className="mt-4 text-sm font-semibold text-foreground/50">Próximos</h4>
                          {activeSeason.matches
                            .filter((m) => m.status === "SCHEDULED")
                            .slice(0, 10)
                            .map((match) => (
                              <div key={match.id} className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 text-sm">
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
                                {match.round && <span className="ml-4 text-xs text-foreground/40">{match.round}</span>}
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

        <p className="mt-8 text-center text-[11px] text-foreground/30">
          Cobertura de Modo Fosa · ¿Tenés info para aportar?{" "}
          <a href="https://instagram.com/modofosa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            @modofosa
          </a>
        </p>
      </main>
    </div>
  );
}
