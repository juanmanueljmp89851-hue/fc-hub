import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getPeriod, getPeriodRanking, getMyPeriodStats } from "@/lib/actions/ambassador";
import { PeriodCountdown } from "@/components/ambassador/PeriodCountdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const period = await getPeriod(params.id);
  if (!period) return { title: "Período no encontrado" };
  return {
    title: `${period.name} | Embajadores Modo Fosa`,
    description: `Ranking del ${period.name}. Competí para ser Embajador del Mes.`,
  };
}

export default async function PeriodoDetailPage({ params }: { params: { id: string } }) {
  const period = await getPeriod(params.id);
  if (!period) notFound();

  const [ranking, myStats] = await Promise.all([
    getPeriodRanking(period.id, 50),
    getMyPeriodStats(period.id),
  ]);

  const isActive = period.status === "ACTIVE";
  const isCompleted = period.status === "COMPLETED";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/embajadores"
          className="mb-4 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-accent"
        >
          ← Embajadores
        </Link>

        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-black">🏆 {period.name}</h1>
          {isActive && <PeriodCountdown endDate={period.endDate} />}
          {isCompleted && (
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">Finalizado</span>
          )}
        </div>

        {/* Prizes */}
        {period.prizes.length > 0 && (
          <div className="mb-6 space-y-2">
            {period.prizes.map((prize) => (
              <div key={prize.id} className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {prize.position === 1 ? "🥇" : prize.position === 2 ? "🥈" : "🥉"}
                  </span>
                  <div>
                    <p className="font-bold text-gold">{prize.name}</p>
                    {prize.description && (
                      <p className="text-sm text-foreground/50">{prize.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Winners (completed) */}
        {isCompleted && period.winners.length > 0 && (
          <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4">
            <h3 className="mb-3 text-sm font-bold text-gold">
              {period.winners.length === 1 ? "Embajador" : "Podio"}
            </h3>
            <div className="space-y-3">
              {period.winners.map((w) => (
                <div key={w.id} className="flex items-center gap-3">
                  <span className="text-2xl">
                    {w.position === 1 ? "🥇" : w.position === 2 ? "🥈" : "🥉"}
                  </span>
                  {w.user.avatarUrl ? (
                    <Image
                      src={w.user.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
                      {w.user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{w.user.username}</p>
                    <p className="text-xs text-foreground/50">
                      {w.activeReferrals} referidos activos · {w.bengalasEarned} bengalas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal stats (active) */}
        {isActive && myStats && (
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-black text-accent">#{myStats.position}</p>
                <p className="text-xs text-foreground/50">Tu posición</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-accent">{myStats.myActiveReferrals}</p>
                <p className="text-xs text-foreground/50">Tus referidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-foreground/70">{myStats.firstPlace}</p>
                <p className="text-xs text-foreground/50">Primer puesto</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gold">{myStats.bengalas}</p>
                <p className="text-xs text-foreground/50">Bengalas</p>
              </div>
            </div>
            {myStats.difference > 0 && (
              <p className="mt-3 text-center text-sm text-foreground/60">
                Te faltan <span className="font-bold text-accent">{myStats.difference}</span> referidos para el primer puesto.
              </p>
            )}
          </div>
        )}

        {/* Ranking table */}
        <div className="rounded-xl border border-surface-light bg-background">
          <div className="border-b border-surface-light px-4 py-3">
            <h2 className="font-bold">🏆 Ranking</h2>
            <p className="text-xs text-foreground/40">Referidos activos del período</p>
          </div>
          {ranking.length === 0 ? (
            <div className="p-8 text-center text-foreground/50">Sin participantes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-light text-xs uppercase text-foreground/40">
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-3 py-2 text-left">Embajador</th>
                    <th className="px-3 py-2 text-center">Referidos activos</th>
                    <th className="px-3 py-2 text-center">Bengalas</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row) => (
                    <tr
                      key={row.user?.id}
                      className="border-b border-surface-light/50 transition-colors hover:bg-surface/20"
                    >
                      <td className="px-3 py-2.5 text-center font-bold">
                        {row.position <= 3 ? (
                          <span className="text-lg">
                            {row.position === 1 ? "🥇" : row.position === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-foreground/50">{row.position}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {row.user?.avatarUrl ? (
                            <Image
                              src={row.user.avatarUrl}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                              {row.user?.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <span className="font-medium">{row.user?.username}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-accent">
                        {row.activeReferrals}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-gold">
                        {row.bengalas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status info */}
        <div className="mt-4 space-y-2 rounded-xl border border-surface-light bg-background p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/50">Inicio</span>
            <span>{new Date(period.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/50">Fin</span>
            <span>{new Date(period.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>

        {isActive && (
          <div className="mt-6 text-center">
            <Link
              href="/perfil#embajador"
              className="inline-block rounded-lg bg-accent px-6 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
            >
              🔥 INVITAR AMIGOS
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
