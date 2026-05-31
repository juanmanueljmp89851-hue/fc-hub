import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getProde, getProdeLeaderboard, getProdeWeeks } from "@/lib/actions/prode";
import { getCurrentUser } from "@/lib/actions/user";
import Link from "next/link";
import { ShareCodeCopy } from "@/components/prode/ShareCodeCopy";

function getMedalClass(pos: number) {
  if (pos === 1) return "bg-gold text-background";
  if (pos === 2) return "bg-gray-300 text-background";
  if (pos === 3) return "bg-amber-700 text-white";
  return "bg-surface-light text-foreground/60";
}

function getWeekStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    UPCOMING: { label: "Próxima", color: "bg-surface-light text-foreground/50" },
    OPEN: { label: "Abierta", color: "bg-accent/20 text-accent" },
    CLOSED: { label: "Cerrada", color: "bg-gold/20 text-gold" },
    SCORED: { label: "Puntuada", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

interface PageProps {
  params: { id: string };
}

export default async function ProdeDetailPage({ params }: PageProps) {
  const [prode, leaderboard, weeks] = await Promise.all([
    getProde(params.id),
    getProdeLeaderboard(params.id),
    getProdeWeeks(),
  ]);

  if (!prode) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const canEdit = currentUser && (currentUser.id === prode.createdById || currentUser.role === "ADMIN");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/prode" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Mis Prodes
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{prode.name}</h1>
            {canEdit && (
              <Link
                href={`/prode/${prode.id}/editar`}
                className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-accent hover:text-accent"
              >
                Editar
              </Link>
            )}
          </div>
          {prode.description && (
            <p className="mt-1 text-foreground/60">{prode.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-foreground/50">
            <span>Creado por <span className="text-accent">{prode.createdBy.username}</span></span>
            <span>·</span>
            <span>{prode.participants.length} participantes</span>
          </div>

          {/* Share code */}
          <div className="mt-4">
            <ShareCodeCopy shareCode={prode.shareCode} />
          </div>
        </div>

        {/* Prizes */}
        {(prode.prizeGeneral || prode.prizePerWeek || prode.prizeGroupOrder || prode.prizeRounds) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Premios</CardTitle>
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {prode.prizeGeneral && (
                <div className="rounded-lg bg-gold/5 p-3">
                  <p className="text-xs font-bold text-gold">🏆 General</p>
                  <p className="mt-1 text-sm">{prode.prizeGeneral}</p>
                </div>
              )}
              {prode.prizePerWeek && (
                <div className="rounded-lg bg-accent/5 p-3">
                  <p className="text-xs font-bold text-accent">📅 Por fecha</p>
                  <p className="mt-1 text-sm">{prode.prizePerWeek}</p>
                </div>
              )}
              {prode.prizeGroupOrder && (
                <div className="rounded-lg bg-blue-500/5 p-3">
                  <p className="text-xs font-bold text-blue-400">📊 Orden de grupo</p>
                  <p className="mt-1 text-sm">{prode.prizeGroupOrder}</p>
                </div>
              )}
              {prode.prizeRounds && (
                <div className="rounded-lg bg-purple-500/5 p-3">
                  <p className="text-xs font-bold text-purple-400">🔮 Equipos que pasan</p>
                  <p className="mt-1 text-sm">{prode.prizeRounds}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Weeks + predictions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Weeks list */}
            <Card>
              <CardHeader>
                <CardTitle>Fechas del Mundial</CardTitle>
              </CardHeader>
              {weeks.length === 0 ? (
                <p className="text-sm text-foreground/50">No hay fechas cargadas todavía</p>
              ) : (
                <div className="space-y-2">
                  {weeks.map((week) => {
                    const statusInfo = getWeekStatusInfo(week.status);
                    return (
                      <Link
                        key={week.id}
                        href={`/prode/${prode.id}/${week.id}`}
                        className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 transition-colors hover:border-accent/50"
                      >
                        <div>
                          <p className="font-medium">{week.title}</p>
                          <p className="text-xs text-foreground/50">
                            {week._count.matches} partidos ·{" "}
                            {new Date(week.deadline).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Group + Advance predictions links */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href={`/prode/${prode.id}/grupos`}>
                <Card className="h-full transition-colors hover:border-accent/50">
                  <p className="text-lg font-bold">📊 Orden de Grupos</p>
                  <p className="mt-1 text-sm text-foreground/60">
                    Predecí el 1°, 2°, 3° y 4° de cada grupo
                  </p>
                </Card>
              </Link>
              <Link href={`/prode/${prode.id}/avance`}>
                <Card className="h-full transition-colors hover:border-accent/50">
                  <p className="text-lg font-bold">🔮 Equipos que avanzan</p>
                  <p className="mt-1 text-sm text-foreground/60">
                    Predecí qué equipos pasan cada ronda
                  </p>
                </Card>
              </Link>
            </div>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participantes ({prode.participants.length})</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {prode.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2"
                  >
                    <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface">
                      {p.user.avatarUrl ? (
                        <Image src={p.user.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">👤</div>
                      )}
                    </div>
                    <span className="truncate text-sm">{p.user.username}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Leaderboard */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Ranking</CardTitle>
              </CardHeader>
              {leaderboard.length === 0 || leaderboard.every((e) => e.totalPoints === 0) ? (
                <p className="text-sm text-foreground/50">
                  Se actualiza cuando se puntúen las fechas
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${getMedalClass(i + 1)}`}
                        >
                          {i + 1}
                        </span>
                        <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface">
                          {entry.avatarUrl ? (
                            <Image src={entry.avatarUrl} alt="" fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">👤</div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{entry.username}</span>
                          {entry.exactResults > 0 && (
                            <span className="ml-1 text-xs text-gold">{entry.exactResults}🎯</span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-gold">{entry.totalPoints}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Points breakdown legend */}
              <div className="mt-4 space-y-1 rounded-lg bg-surface-light/50 p-3 text-xs text-foreground/50">
                <p className="font-medium text-foreground/70">Puntos</p>
                <p>🎯 Exacto: <span className="font-bold text-gold">5</span></p>
                <p>✅ Ganador: <span className="font-bold text-accent">3</span></p>
                <p>📊 Grupo perfecto: <span className="font-bold text-gold">10</span></p>
                <p>🔮 Campeón: <span className="font-bold text-accent">10</span></p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
