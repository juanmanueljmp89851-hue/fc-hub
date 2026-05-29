import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getExternalLeagues } from "@/lib/actions/external-leagues";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Competitivo",
  description: "Escena competitiva de FC 26: IESA, EFA, eLiga Profesional, VPG y más.",
};

function getGameModeLabel(mode: string) {
  const map: Record<string, string> = {
    CLUBS_PRO: "Clubes Pro",
    ULTIMATE_TEAM: "Ultimate Team",
    SEASONS: "Temporadas Online",
    MIXED: "Varios modos",
  };
  return map[mode] ?? mode;
}

export default async function EscenaPage() {
  const leagues = await getExternalLeagues();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Competitivo</h1>
          <p className="mt-1 text-foreground/60">
            Seguimiento de ligas y torneos oficiales de FC 26
          </p>
        </div>

        {/* Known leagues info (always show first) */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground/80">Ligas que seguimos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <LeagueInfoCard
              name="IESA Argentina"
              description="Liga más grande del mundo de Clubes Pro. Varias divisiones con ascensos y descensos."
              mode="Clubes Pro"
              links={[
                { label: "Instagram", url: "https://www.instagram.com/iesafifaar/" },
                { label: "Web", url: "https://iesa-global.com/pro/federacion.php?sec=fed&fed=2" },
              ]}
            />
            <LeagueInfoCard
              name="eLPF (eLiga Profesional)"
              description="Competencia oficial de la AFA. 30 clubes de Primera División. Ultimate Team en PS5."
              mode="Ultimate Team"
              links={[
                { label: "Web", url: "https://elpf.ar/" },
                { label: "Liga Profesional", url: "https://www.ligaprofesional.ar/elpf/" },
              ]}
            />
            <LeagueInfoCard
              name="VPG (Virtual Pro Gaming)"
              description="Plataforma global de 11v11. 500K+ usuarios. Ligas por zona horaria, división Latam."
              mode="Clubes Pro 11v11"
              links={[
                { label: "Web", url: "https://virtualprogaming.com/" },
                { label: "Instagram", url: "https://www.instagram.com/vpgesports/" },
              ]}
            />
            <LeagueInfoCard
              name="Liga Argentina de Clubes Pro"
              description="Comunidad argentina independiente de Clubes Pro."
              mode="Clubes Pro"
              links={[
                { label: "Instagram", url: "https://www.instagram.com/licpargentina/" },
              ]}
            />
            <LeagueInfoCard
              name="FC Pro Leagues"
              description="Circuito oficial de EA. Clasificatorias nacionales → FC Pro World Championship."
              mode="Ultimate Team"
              links={[
                { label: "Web", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/fc-pro-leagues" },
              ]}
            />
          </div>
        </div>

        {/* Dynamic leagues from DB */}
        {leagues.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-bold text-foreground/80">Ligas en seguimiento</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => {
                const activeSeason = league.seasons[0];
                return (
                  <Link key={league.id} href={`/escena/${league.slug}`}>
                    <Card className="h-full transition-colors hover:border-accent/50">
                      <div className="mb-3 flex items-center gap-3">
                        {league.logoUrl ? (
                          <Image
                            src={league.logoUrl}
                            alt={league.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-xl">
                            🏆
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold">{league.name}</h3>
                          <p className="text-xs text-foreground/50">{league.country}</p>
                        </div>
                      </div>

                      {league.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-foreground/60">
                          {league.description}
                        </p>
                      )}

                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          {getGameModeLabel(league.gameMode)}
                        </span>
                        {league.platform.map((p) => (
                          <span
                            key={p}
                            className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60"
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      {activeSeason && (
                        <div className="border-t border-surface-light pt-3 text-xs text-foreground/50">
                          <p className="font-medium text-foreground/70">{activeSeason.name}</p>
                          <div className="mt-1 flex gap-3">
                            <span>{activeSeason._count.standings} equipos</span>
                            <span>{activeSeason._count.matches} partidos</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        {league.websiteUrl && (
                          <span className="text-xs text-foreground/40">🌐 Web</span>
                        )}
                        {league.instagramUrl && (
                          <span className="text-xs text-foreground/40">📸 Instagram</span>
                        )}
                        {league.discordUrl && (
                          <span className="text-xs text-foreground/40">💬 Discord</span>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LeagueInfoCard({
  name,
  description,
  mode,
  links,
}: {
  name: string;
  description: string;
  mode: string;
  links: { label: string; url: string }[];
}) {
  return (
    <div className="rounded-xl border border-surface-light bg-background p-4">
      <h3 className="font-bold">{name}</h3>
      <p className="mt-1 text-sm text-foreground/60">{description}</p>
      <span className="mt-2 inline-block rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
        {mode}
      </span>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            {link.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
