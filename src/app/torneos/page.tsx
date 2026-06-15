import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { AdSlot } from "@/components/ads/AdSlot";
import { listTournaments } from "@/lib/actions/tournament";
import { TournamentFilters } from "@/components/tournaments/TournamentFilters";
import { TournamentCardJoin } from "@/components/tournaments/TournamentCardJoin";

export const metadata: Metadata = {
  title: "Arena",
  description: "Torneos, copas y eventos de EA FC organizados por la comunidad Modo Fosa.",
  alternates: { canonical: "/torneos" },
  openGraph: {
    title: "Arena | Modo Fosa",
    description: "Torneos de EA FC organizados por la comunidad.",
  },
};

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
    case "IN_PROGRESS":
      return "bg-accent/20 text-accent";
    case "REGISTRATION":
      return "bg-gold/20 text-gold";
    case "DRAFT":
      return "bg-surface-light text-foreground/50";
    case "FINISHED":
      return "bg-foreground/10 text-foreground/50";
    default:
      return "bg-surface-light text-foreground/50";
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
      return (
        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
          Oficial
        </span>
      );
    case "VERIFIED_ORGANIZER":
      return (
        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
          Verificado
        </span>
      );
    default:
      return null;
  }
}

interface PageProps {
  searchParams: {
    status?: string;
    platform?: string;
    search?: string;
    page?: string;
  };
}

export default async function TorneosPage({ searchParams }: PageProps) {
  const { tournaments, total } = await listTournaments({
    status: searchParams.status as undefined,
    platform: searchParams.platform as undefined,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Arena — Torneos EA FC",
    description: "Torneos, copas y eventos de EA FC organizados por la comunidad Modo Fosa.",
    url: "https://www.modofosa.com.ar/torneos",
    isPartOf: { "@id": "https://www.modofosa.com.ar/#website" },
    numberOfItems: total,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Arena</h1>
            <p className="mt-1 text-foreground/60">
              Torneos, copas y eventos de la comunidad
            </p>
          </div>
          <Link
            href="/torneos/crear"
            className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
          >
            + Crear Torneo
          </Link>
        </div>

        {/* Filtros */}
        <TournamentFilters />

        {/* Lista de torneos */}
        {tournaments.length === 0 ? (
          <Card className="py-12 text-center">
            <span className="mb-4 block text-5xl">🏟️</span>
            <h3 className="mb-2 text-lg font-bold">No hay torneos</h3>
            <p className="mb-4 text-sm text-foreground/60">
              Sé el primero en crear un torneo para la comunidad
            </p>
            <Link
              href="/torneos/crear"
              className="inline-block rounded-lg bg-accent px-5 py-2.5 font-bold text-background"
            >
              Crear Torneo
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {tournaments.map((torneo) => (
                <Link key={torneo.id} href={`/torneos/${torneo.id}`}>
                  <Card className="flex h-full flex-col overflow-hidden p-0 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
                    {/* Banner */}
                    <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-surface-light via-surface to-surface-light">
                      {torneo.bannerUrl ? (
                        <Image src={torneo.bannerUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl opacity-20">🏆</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusColor(torneo.status)}`}
                        >
                          {getStatusLabel(torneo.status)}
                        </span>
                        {getVerificationBadge(torneo.verificationLevel)}
                      </div>
                      <div className="flex gap-1">
                        {torneo.platforms.map((p) => (
                          <span
                            key={p}
                            className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-light">
                        {torneo.logoUrl ? (
                          <Image src={torneo.logoUrl} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">🏟️</div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold">{torneo.name}</h3>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
                      <span>{getFormatLabel(torneo.format)}</span>
                      {torneo.gameMode && (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                          {torneo.gameMode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/60">
                        {torneo.currentPlayers}/{torneo.maxPlayers} jugadores
                      </span>
                      {torneo.startDate && (
                        <span className="text-foreground/60">
                          Inicio:{" "}
                          {new Date(torneo.startDate).toLocaleDateString("es-AR")}
                        </span>
                      )}
                    </div>

                    {/* Progress bar inscripciones */}
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-light">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${Math.min((torneo.currentPlayers / torneo.maxPlayers) * 100, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gold">🏆 {torneo.prize || "Premio a definir"}</p>
                        <p className="text-xs text-foreground/40">
                          por {torneo.createdBy.username}
                        </p>
                      </div>
                      <TournamentCardJoin
                        tournamentId={torneo.id}
                        status={torneo.status}
                        createdById={torneo.createdById}
                        currentPlayers={torneo.currentPlayers}
                        maxPlayers={torneo.maxPlayers}
                        requiresVerification={torneo.requiresVerification}
                      />
                    </div>
                    </div>{/* end padding wrapper */}
                  </Card>
                </Link>
              ))}
            </div>

            {total > 12 && (
              <div className="mt-8 text-center text-sm text-foreground/50">
                Mostrando {tournaments.length} de {total} torneos
              </div>
            )}
          </>
        )}

        {/* Ad */}
        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}
