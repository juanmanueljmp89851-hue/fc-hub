import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdSlot } from "@/components/ads/AdSlot";
import { getTournament } from "@/lib/actions/tournament";
import { getCurrentUser } from "@/lib/actions/user";
import { TournamentActions } from "@/components/tournaments/TournamentActions";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { LeagueTable } from "@/components/tournaments/LeagueTable";
import { DeleteTournamentButton } from "@/components/tournaments/DeleteTournamentButton";
import { DuplicateTournamentButton } from "@/components/tournaments/DuplicateTournamentButton";
import { ResetTournamentButton } from "@/components/tournaments/ResetTournamentButton";
import { PendingParticipants } from "@/components/tournaments/PendingParticipants";
import { AdminMatchEdit } from "@/components/tournaments/AdminMatchEdit";
import { AdminPlayerActions } from "@/components/tournaments/AdminPlayerActions";
import { CollapsibleText } from "@/components/ui/CollapsibleText";
import { ShareTournamentLink } from "@/components/tournaments/ShareTournamentLink";
import { TournamentChat } from "@/components/tournaments/TournamentChat";
import { RemindPendingButton } from "@/components/tournaments/RemindPendingButton";
import { SendDmButton } from "@/components/dm/SendDmButton";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournament = await getTournament(params.id);
  if (!tournament) return { title: "Torneo no encontrado" };
  return {
    title: tournament.name,
    description: tournament.description || `Torneo ${tournament.name} en Modo Fosa. Formato: ${tournament.format}. ${tournament.maxPlayers} jugadores.`,
    alternates: { canonical: `/torneos/${tournament.id}` },
    openGraph: {
      title: `${tournament.name} | Modo Fosa`,
      description: tournament.description || `Torneo de EA FC en Modo Fosa`,
      ...(tournament.bannerUrl && { images: [{ url: tournament.bannerUrl }] }),
    },
  };
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Próximamente",
    REGISTRATION: "Inscripciones abiertas",
    IN_PROGRESS: "En curso",
    FINISHED: "Finalizado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

function getStatusColor(status: string) {
  switch (status) {
    case "IN_PROGRESS": return "bg-accent/20 text-accent";
    case "REGISTRATION": return "bg-gold/20 text-gold";
    case "FINISHED": return "bg-foreground/10 text-foreground/50";
    default: return "bg-surface-light text-foreground/50";
  }
}

function getFormatLabel(format: string) {
  const map: Record<string, string> = {
    SINGLE_ELIMINATION: "Eliminación Simple",
    DOUBLE_ELIMINATION: "Doble Eliminación",
    LEAGUE: "Liga",
    GROUP_KNOCKOUT: "Grupos + Eliminación",
  };
  return map[format] ?? format;
}

function getVerificationBadge(level: string) {
  switch (level) {
    case "OFFICIAL":
      return <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">Oficial</span>;
    case "VERIFIED_ORGANIZER":
      return <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">Verificado</span>;
    default: return null;
  }
}

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};
const DAY_LABELS: Record<string, string> = {
  SUNDAY: "Domingo", MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles", THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado",
};

function getScheduleDateForRound(scheduleDays: string[], roundIndex: number, startDate?: Date | null): string {
  if (!scheduleDays.length) return "";
  const dayNumbers = scheduleDays.map((d) => DAY_MAP[d]).filter((n) => n !== undefined).sort((a, b) => a - b);
  if (!dayNumbers.length) return "";
  const base = startDate ? new Date(startDate) : new Date();
  const current = new Date(base);
  let found = 0;
  for (let i = 0; i < 365; i++) {
    if (dayNumbers.includes(current.getDay())) {
      if (found === roundIndex) {
        const dayName = Object.entries(DAY_MAP).find(([, v]) => v === current.getDay())?.[0];
        const label = dayName ? DAY_LABELS[dayName] : "";
        return `${label} ${current.getDate().toString().padStart(2, "0")}/${(current.getMonth() + 1).toString().padStart(2, "0")}`;
      }
      found++;
    }
    current.setDate(current.getDate() + 1);
  }
  return "";
}

interface PageProps {
  params: { id: string };
}

export default async function TorneoDetailPage({ params }: PageProps) {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  // If soft-deleted and not admin, show not found
  if (tournament.deletedAt && (!currentUser || currentUser.role !== "ADMIN")) {
    notFound();
  }

  const canEdit = currentUser && (currentUser.id === tournament.createdById || currentUser.role === "ADMIN") && !tournament.deletedAt;

  const confirmedCount = tournament.participants.filter((p) => p.status === "CONFIRMED").length;
  const isLeague = tournament.format === "LEAGUE";
  const isTeamTournament = tournament.teamType === "CLUBS_PRO" || tournament.teamType === "RUSH";
  const hasMatches = tournament.matches.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="relative mb-4 h-48 overflow-hidden rounded-xl bg-gradient-to-br from-surface-light via-surface to-surface-light">
            {tournament.bannerUrl ? (
              <Image src={tournament.bannerUrl} alt={tournament.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl opacity-20">🏆</div>
            )}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusColor(tournament.status)}`}>
              {getStatusLabel(tournament.status)}
            </span>
            {getVerificationBadge(tournament.verificationLevel)}
            {tournament.platforms.map((p) => (
              <span key={p} className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60">
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-surface-light bg-surface-light">
              {tournament.logoUrl ? (
                <Image src={tournament.logoUrl} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🏟️</div>
              )}
            </div>
            <h1 className="text-xl font-bold sm:text-3xl">{tournament.name}</h1>
            {canEdit && (
              <>
                <Link
                  href={`/torneos/${tournament.id}/editar`}
                  className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-accent hover:text-accent"
                >
                  Editar
                </Link>
                <DuplicateTournamentButton tournamentId={tournament.id} />
                <ResetTournamentButton tournamentId={tournament.id} />
                <DeleteTournamentButton tournamentId={tournament.id} tournamentName={tournament.name} />
                {tournament.status === "IN_PROGRESS" && (
                  <RemindPendingButton tournamentId={tournament.id} />
                )}
              </>
            )}
          </div>
          {tournament.description && (
            <CollapsibleText text={tournament.description} maxLines={3} className="mt-2 text-foreground/60" />
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-foreground/60">
            <span>Formato: <span className="text-foreground">{getFormatLabel(tournament.format)}</span></span>
            {tournament.gameMode && <span>Modo: <span className="text-foreground">{tournament.gameMode}</span></span>}
            <span>Jugadores: <span className="text-foreground">{confirmedCount}/{tournament.maxPlayers}</span></span>
            <span>Organizador: <span className="text-accent">{tournament.createdBy.username}</span></span>
            {tournament.prize && <span>Premio: <span className="text-gold">{tournament.prize}</span></span>}
            {tournament.startDate && (
              <span>Inicio: <span className="text-foreground">
                {new Date(tournament.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
              </span></span>
            )}
            {tournament.knockoutSeeding === "TRADITIONAL" && (
              <span>Cruces: <span className="text-foreground">Tradicional</span></span>
            )}
            {tournament.knockoutSeeding === "RANDOM" && tournament.randomDrawUntil !== "INITIAL_ONLY" && (
              <span>Sorteo: <span className="text-foreground">
                {tournament.randomDrawUntil === "FINAL" ? "Cada ronda" :
                 tournament.randomDrawUntil === "SEMIFINALS" ? "Hasta semis" : "Hasta cuartos"}
              </span></span>
            )}
            {tournament.knockoutFormat && tournament.knockoutFormat !== "SINGLE_MATCH" && (
              <span>Serie: <span className="text-foreground">
                {tournament.knockoutFormat === "TWO_LEG" && "Ida y vuelta"}
                {tournament.knockoutFormat === "TWO_LEG_PENALTIES" && "Ida y vuelta + penales"}
                {tournament.knockoutFormat === "TWO_LEG_EXTRA_PENALTIES" && "Ida y vuelta + prórroga + penales"}
                {tournament.knockoutFormat === "BEST_OF_3" && "Mejor de 3"}
                {tournament.knockoutFormat === "BEST_OF_5" && "Mejor de 5"}
              </span></span>
            )}
            {tournament.hasLosersBracket && tournament.format !== "DOUBLE_ELIMINATION" && (
              <span className="text-gold">+ Llave de perdedores</span>
            )}
            {tournament.scheduleDays && tournament.scheduleDays.length > 0 && (
              <span>Días: <span className="text-foreground">
                {tournament.scheduleDays.map((d: string) => {
                  const map: Record<string, string> = { MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié", THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom" };
                  return map[d] ?? d;
                }).join(", ")}
              </span></span>
            )}
            {tournament.scheduleTime && (
              <span>Horario: <span className="text-foreground">{tournament.scheduleTime}hs</span></span>
            )}
            {tournament.waitTimeMinutes && tournament.waitTimeMinutes > 0 && (
              <span>Espera: <span className="text-foreground">{tournament.waitTimeMinutes} min</span></span>
            )}
          </div>

          {/* Link compartir */}
          <div className="mt-4">
            <ShareTournamentLink tournamentId={tournament.id} />
          </div>

          {/* Botón inscripción */}
          <div className="mt-6">
            <TournamentActions
              tournamentId={tournament.id}
              status={tournament.status}
              createdById={tournament.createdById}
              participants={tournament.participants.map((p) => ({
                userId: p.userId,
                teamId: p.teamId,
                status: p.status,
              }))}
              maxPlayers={tournament.maxPlayers}
              teamType={tournament.teamType}
            />
          </div>

          {/* Solicitudes pendientes (creador/admin) */}
          {canEdit && (() => {
            const pending = tournament.participants.filter((p) => p.status === "PENDING");
            return pending.length > 0 ? (
              <div className="mt-6">
                <PendingParticipants
                  tournamentId={tournament.id}
                  participants={pending.map((p) => ({
                    id: p.id,
                    userId: p.userId,
                    user: {
                      username: p.user.username,
                      avatarUrl: p.user.avatarUrl,
                    },
                    joinedAt: p.joinedAt.toISOString(),
                  }))}
                />
              </div>
            ) : null;
          })()}
        </div>

        {/* Tabla/Bracket + Chat */}
        {hasMatches && (
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <Card className="overflow-x-auto">
              <CardHeader>
                <CardTitle>{isLeague ? "Posiciones" : "Bracket"}</CardTitle>
              </CardHeader>
              {isLeague ? (
                <LeagueTable
                  standings={tournament.standings}
                  relegationCount={tournament.relegationCount ?? 0}
                  cup1Name={tournament.cup1Name ?? undefined}
                  cup1Spots={tournament.cup1Spots ?? 0}
                  cup2Name={tournament.cup2Name ?? undefined}
                  cup2Spots={tournament.cup2Spots ?? 0}
                  isFinished={tournament.status === "FINISHED"}
                />
              ) : (
                <TournamentBracket matches={tournament.matches} isTeamTournament={isTeamTournament} />
              )}
            </Card>

            <Card>
              <TournamentChat
                tournamentId={tournament.id}
                messages={tournament.chatMessages}
                currentUserId={currentUser?.id ?? ""}
                creatorId={tournament.createdById}
              />
            </Card>
          </div>
        )}

        {/* Chat sin partidos (pre-torneo) */}
        {!hasMatches && (
          <Card className="mb-8">
            <TournamentChat
              tournamentId={tournament.id}
              messages={tournament.chatMessages}
              currentUserId={currentUser?.id ?? ""}
              creatorId={tournament.createdById}
            />
          </Card>
        )}

        {/* Fixture */}
        {hasMatches && (() => {
          const rounds = Array.from(new Set(tournament.matches.map((m) => m.round))).sort();
          const hasDays = tournament.scheduleDays && tournament.scheduleDays.length > 0;
          return (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Fixture</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {rounds.map((round, roundIdx) => {
                  const roundMatches = tournament.matches.filter((m) => m.round === round);
                  const dateLabel = hasDays ? getScheduleDateForRound(tournament.scheduleDays, roundIdx, tournament.startDate) : "";
                  return (
                    <div key={round}>
                      <div className="mb-2 flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-foreground/60">{round}</h4>
                        {dateLabel && (
                          <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
                            {dateLabel}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {roundMatches.map((match) => {
                          const hasPlayers = match.player1Id && match.player2Id;
                          const isPlayable = hasPlayers && match.status !== "FINISHED" && match.status !== "WALKOVER";
                          const isFinished = match.status === "FINISHED" || match.status === "WALKOVER";
                          return (
                            <div
                              key={match.id}
                              className={`flex items-center justify-between rounded-lg border p-3 text-sm transition-colors ${
                                isPlayable ? "border-accent/30 bg-accent/5" : "border-surface-light"
                              }`}
                            >
                              <div className="flex flex-1 items-center gap-2">
                                <span className={match.winnerId === match.player1Id ? "font-bold text-accent" : "text-foreground/70"}>
                                  {match.player1?.username ?? "TBD"}
                                </span>
                                <span className="mx-2 text-foreground/40">
                                  {match.resultP1 !== null ? `${match.resultP1} - ${match.resultP2}` : "vs"}
                                </span>
                                <span className={match.winnerId === match.player2Id ? "font-bold text-accent" : "text-foreground/70"}>
                                  {match.player2?.username ?? "TBD"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {canEdit && match.player1Id && match.player2Id && (
                                  <AdminMatchEdit
                                    matchId={match.id}
                                    player1Name={match.player1?.username ?? "?"}
                                    player2Name={match.player2?.username ?? "?"}
                                    currentP1={match.resultP1}
                                    currentP2={match.resultP2}
                                  />
                                )}
                                {hasPlayers && !isFinished && (
                                  <Link
                                    href={`/arena/${match.id}`}
                                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90"
                                  >
                                    Ir al duelo
                                  </Link>
                                )}
                                {isFinished && (
                                  <Link
                                    href={`/arena/${match.id}`}
                                    className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/50 transition-colors hover:border-accent hover:text-accent"
                                  >
                                    Ver
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {/* Info y Participantes */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Reglas */}
          {(tournament.rules || tournament.matchTime || tournament.difficulty) && (
            <Card>
              <CardHeader>
                <CardTitle>Reglas</CardTitle>
              </CardHeader>
              {tournament.rules && <CollapsibleText text={tournament.rules} maxLines={4} className="mb-4 text-sm text-foreground/70" />}
              <div className="space-y-1 text-sm text-foreground/60">
                {tournament.matchTime && <p>Tiempo: <span className="text-foreground">{tournament.matchTime}</span></p>}
                {tournament.difficulty && <p>Dificultad: <span className="text-foreground">{tournament.difficulty}</span></p>}
                {tournament.controls && <p>Controles: <span className="text-foreground">{tournament.controls}</span></p>}
                {tournament.stadium && <p>Estadio: <span className="text-foreground">{tournament.stadium}</span></p>}
                <p>Equipos: <span className="text-foreground">{tournament.teamType === "ULTIMATE_TEAM" ? "Ultimate Team" : tournament.teamType === "FUT_CHAMPIONS" ? "Alineación FUT Champions" : "Equipos reales"}</span></p>
              </div>
            </Card>
          )}

          {/* Participantes */}
          <Card>
            <CardHeader>
              <CardTitle>{isTeamTournament ? "Equipos" : "Participantes"} ({confirmedCount})</CardTitle>
            </CardHeader>
            {tournament.participants.length === 0 ? (
              <p className="text-sm text-foreground/50">No hay inscriptos todavía</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tournament.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2"
                  >
                    {isTeamTournament && p.team ? (
                      <Link href={`/equipos/${p.team.id}`} className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-surface">
                          {p.team.logoUrl ? (
                            <Image src={p.team.logoUrl} alt="" fill className="object-contain p-0.5" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm">🛡️</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.team.name}</span>
                          {p.team.tag && <span className="text-xs text-foreground/40">[{p.team.tag}]</span>}
                        </div>
                      </Link>
                    ) : (
                      <>
                        <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface">
                          {p.user.avatarUrl ? (
                            <Image src={p.user.avatarUrl} alt="" fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">👤</div>
                          )}
                        </div>
                        <span className="truncate text-sm text-foreground/70">{p.user.username}</span>
                      </>
                    )}
                    {p.status === "PENDING" && (
                      <span className="ml-auto text-xs text-gold">Pendiente</span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      {!isTeamTournament && currentUser && p.userId !== currentUser.id && p.status === "CONFIRMED" && (
                        <SendDmButton userId={p.userId} username={p.user.username} />
                      )}
                      {canEdit && p.status === "CONFIRMED" && p.userId !== tournament.createdById && (
                        <AdminPlayerActions
                          tournamentId={tournament.id}
                          userId={p.userId}
                          username={p.user.username}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Ad */}
        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}
