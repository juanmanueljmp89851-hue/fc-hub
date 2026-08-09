import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { getActivePeriod, getPeriodRanking, getMyPeriodStats, getPeriodHistory } from "@/lib/actions/ambassador";
import { PeriodCountdown } from "@/components/ambassador/PeriodCountdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Embajadores | Modo Fosa",
  description: "Competí para ser el Embajador del Mes. Invitá jugadores, hacé crecer la comunidad y ganá premios.",
  alternates: { canonical: "/embajadores" },
};

export default async function EmbajadoresPage() {
  const [activePeriod, history, myStats] = await Promise.all([
    getActivePeriod(),
    getPeriodHistory(),
    getMyPeriodStats(),
  ]);

  const ranking = activePeriod
    ? await getPeriodRanking(activePeriod.id, 20)
    : [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center sm:p-8">
          <h1 className="text-3xl font-black sm:text-4xl">
            🔥 ¿QUIÉN VA A <span className="text-accent">ENCENDER LA FOSA</span> ESTE MES?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-foreground/60">
            Convertite en Embajador de Modo Fosa. Invitá jugadores. Hacé crecer la comunidad. Subí en el ranking.
          </p>
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-surface-light bg-background/50 p-3">
              <span className="text-lg font-black text-accent">1.</span>
              <div>
                <p className="font-bold text-foreground/90">Compartí tu link</p>
                <p className="text-xs text-foreground/40">Lo encontrás en &quot;Mi perfil&quot; → sección Embajador</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-surface-light bg-background/50 p-3">
              <span className="text-lg font-black text-accent">2.</span>
              <div>
                <p className="font-bold text-foreground/90">Tu amigo se registra</p>
                <p className="text-xs text-foreground/40">Se crea una cuenta en Modo Fosa con tu link</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-surface-light bg-background/50 p-3">
              <span className="text-lg font-black text-accent">3.</span>
              <div>
                <p className="font-bold text-foreground/90">Participa activamente</p>
                <p className="text-xs text-foreground/40">Juega torneos, duelos casuales o crea un Prode</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-surface-light bg-background/50 p-3">
              <span className="text-lg font-black text-accent">4.</span>
              <div>
                <p className="font-bold text-foreground/90">Subís en el ranking</p>
                <p className="text-xs text-foreground/40">Cada referido activo te suma posiciones</p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-lg font-black text-accent">
            Y convertite en 🏆 EMBAJADOR DEL MES
          </p>
          <details className="mx-auto mt-3 max-w-lg text-left">
            <summary className="cursor-pointer text-sm font-bold text-foreground/50 hover:text-foreground/70">
              ¿Qué es un referido activo?
            </summary>
            <div className="mt-2 space-y-2 rounded-lg bg-background/50 p-4 text-sm text-foreground/50">
              <p>Tu referido se convierte en <span className="font-bold text-foreground/80">referido válido</span> cuando cumple <span className="font-bold text-accent">al menos una</span> de estas condiciones:</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li><span className="font-bold text-foreground/70">Duelos:</span> Jugar 5 duelos contra al menos 3 rivales distintos</li>
                <li><span className="font-bold text-foreground/70">Torneo:</span> Inscribirse a un torneo y jugar al menos 1 partido</li>
                <li><span className="font-bold text-foreground/70">Crear torneo:</span> Crear un torneo con 5+ participantes y al menos 2 partidos jugados</li>
                <li><span className="font-bold text-foreground/70">Crear prode:</span> Crear un prode con 5+ participantes</li>
              </ul>
              <p className="pt-1 text-xs text-foreground/30">Solo referidos válidos suman al ranking. Cada referido puede validarse una sola vez.</p>
            </div>
          </details>
        </div>

        {/* Active Period */}
        {activePeriod ? (
          <>
            {/* Period header + countdown */}
            <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 sm:p-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">
                    🏆 {activePeriod.name.toUpperCase()}
                  </h2>
                  {activePeriod.prizes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activePeriod.prizes
                        .sort((a, b) => a.position - b.position)
                        .map((prize) => (
                          <span
                            key={prize.id}
                            className="rounded-full bg-gold/10 px-2.5 py-0.5 text-sm font-bold text-gold"
                          >
                            {prize.position === 1 ? "🥇" : prize.position === 2 ? "🥈" : "🥉"} {prize.name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <PeriodCountdown endDate={activePeriod.endDate} />
              </div>
            </div>

            {/* Personal stats */}
            {myStats && (
              <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-accent">#{myStats.position}</p>
                    <p className="text-xs text-foreground/50">Tu posición</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-accent">{myStats.myActiveReferrals}</p>
                    <p className="text-xs text-foreground/50">Tus referidos activos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-foreground/70">{myStats.firstPlace}</p>
                    <p className="text-xs text-foreground/50">Primer puesto</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gold">{myStats.bengalas}</p>
                    <p className="text-xs text-foreground/50">Bengalas del período</p>
                  </div>
                </div>
                {myStats.difference > 0 && (
                  <p className="mt-3 text-center text-sm text-foreground/60">
                    Te faltan <span className="font-bold text-accent">{myStats.difference}</span> referidos para alcanzar el primer puesto.
                  </p>
                )}
                {myStats.difference === 0 && myStats.myActiveReferrals > 0 && (
                  <p className="mt-3 text-center text-sm font-bold text-accent">
                    🔥 ¡Vas primero! Seguí sumando para asegurar tu lugar.
                  </p>
                )}
                <div className="mt-3 text-center">
                  <Link
                    href="/perfil#embajador"
                    className="inline-block rounded-lg bg-accent px-6 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
                  >
                    🔥 INVITAR AMIGOS
                  </Link>
                </div>
              </div>
            )}

            {/* Ranking */}
            <div className="rounded-xl border border-surface-light bg-background">
              <div className="border-b border-surface-light px-4 py-3">
                <h2 className="font-bold">🏆 Ranking — {activePeriod.name}</h2>
                <p className="text-xs text-foreground/40">
                  Ordenado por referidos activos del período
                </p>
              </div>

              {ranking.length === 0 ? (
                <div className="p-8 text-center text-foreground/50">
                  Todavía no hay referidos activos este período
                </div>
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
          </>
        ) : (
          <div className="rounded-xl border border-surface-light bg-background p-12 text-center">
            <span className="mb-4 block text-4xl">🏆</span>
            <p className="text-foreground/50">No hay un período activo en este momento</p>
            <p className="mt-1 text-sm text-foreground/30">
              Seguí sumando referidos para cuando arranque el próximo período
            </p>
          </div>
        )}

        {/* Hall of Fame link */}
        {history.length > 0 && (
          <div className="mt-8">
            <Link
              href="/embajadores/historial"
              className="group flex items-center justify-between rounded-xl border border-surface-light bg-background p-4 transition-colors hover:border-accent/50"
            >
              <div>
                <h3 className="font-bold group-hover:text-accent">🔥 Salón de Embajadores</h3>
                <p className="text-xs text-foreground/40">
                  {history.length} {history.length === 1 ? "período finalizado" : "períodos finalizados"}
                </p>
              </div>
              <span className="text-foreground/30 group-hover:text-accent">→</span>
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/perfil#embajador"
            className="inline-block rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
          >
            🔥 Compartí tu link de referido
          </Link>
        </div>

        {/* Legal */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-foreground/30">
          <Link href="/legal/embajadores" className="hover:text-foreground/60">Bases del Programa</Link>
          <span>·</span>
          <Link href="/legal/embajadores-agosto-2026" className="hover:text-foreground/60">Bases Agosto 2026</Link>
          <span>·</span>
          <Link href="/legal/terminos" className="hover:text-foreground/60">Términos y condiciones</Link>
        </div>
      </main>
    </div>
  );
}
