import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdSlot } from "@/components/ads/AdSlot";
import { PlayerSearch } from "@/components/casual/PlayerSearch";
import { getMyMatches } from "@/lib/actions/casual";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partidos Casuales",
  description:
    "Desafiá a otros jugadores de EA FC, ganá puntos y subí en el ranking de Modo Fosa.",
  alternates: { canonical: "/casual" },
  openGraph: {
    title: "Partidos Casuales | Modo Fosa",
    description: "Desafiá a otros jugadores de EA FC, ganá puntos y subí en el ranking.",
  },
};

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "bg-gold/20 text-gold" },
    ACCEPTED: { label: "Aceptado", color: "bg-blue-500/20 text-blue-400" },
    IN_PROGRESS: { label: "En curso", color: "bg-accent/20 text-accent" },
    PENDING_CONFIRMATION: { label: "Resultado cargado", color: "bg-orange-500/20 text-orange-400" },
    DISPUTED: { label: "Disputado", color: "bg-red-500/20 text-red-400" },
    FINISHED: { label: "Finalizado", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

export default async function CasualPage() {
  const matches = await getMyMatches();

  const activeMatches = matches.filter(
    (m) => !["FINISHED", "CANCELLED", "REJECTED"].includes(m.status),
  );
  const recentMatches = matches.filter((m) => m.status === "FINISHED").slice(0, 10);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Partidos Casuales</h1>
          <p className="mt-1 text-foreground/60">
            Desafiá a otros jugadores, ganá puntos y subí en el ranking
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Search + Challenge */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Rival</CardTitle>
              </CardHeader>
              <PlayerSearch />
            </Card>

            <div className="mt-4">
              <Link
                href="/ranking"
                className="block rounded-lg border border-surface-light bg-background p-4 text-center transition-colors hover:border-accent"
              >
                <span className="text-sm font-medium text-foreground/70">Ver </span>
                <span className="font-bold text-accent">Clasificación</span>
              </Link>
            </div>
          </div>

          {/* Right: My matches */}
          <div className="space-y-6 lg:col-span-2">
            {/* Active matches */}
            <Card>
              <CardHeader>
                <CardTitle>Partidos activos ({activeMatches.length})</CardTitle>
              </CardHeader>
              {activeMatches.length === 0 ? (
                <p className="text-sm text-foreground/50">
                  No tenés partidos activos. Buscá un rival y desafialo.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeMatches.map((match) => {
                    const statusInfo = getStatusLabel(match.status);
                    return (
                      <Link
                        key={match.id}
                        href={`/casual/${match.id}`}
                        className="flex items-center justify-between rounded-lg border border-surface-light bg-background p-4 transition-colors hover:border-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 overflow-hidden rounded-full bg-surface">
                              {match.challenger.avatarUrl ? (
                                <Image src={match.challenger.avatarUrl} alt="" fill className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">👤</div>
                              )}
                            </div>
                            <span className="text-sm font-medium">{match.challenger.username}</span>
                          </div>
                          <span className="text-xs text-foreground/40">vs</span>
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 overflow-hidden rounded-full bg-surface">
                              {match.challenged.avatarUrl ? (
                                <Image src={match.challenged.avatarUrl} alt="" fill className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">👤</div>
                              )}
                            </div>
                            <span className="text-sm font-medium">{match.challenged.username}</span>
                          </div>
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

            {/* Recent matches */}
            {recentMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Últimos partidos</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {recentMatches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/casual/${match.id}`}
                      className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 text-sm transition-colors hover:border-surface-light"
                    >
                      <div className="flex items-center gap-2">
                        <span className={match.winner?.id === match.challenger.id ? "font-bold text-accent" : "text-foreground/70"}>
                          {match.challenger.username}
                        </span>
                        <span className="text-foreground/40">
                          {match.resultChallenger} - {match.resultChallenged}
                        </span>
                        <span className={match.winner?.id === match.challenged.id ? "font-bold text-accent" : "text-foreground/70"}>
                          {match.challenged.username}
                        </span>
                      </div>
                      <span className="text-xs text-foreground/40">
                        {new Date(match.confirmedAt ?? match.createdAt).toLocaleDateString("es-AR")}
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Ad */}
        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}
