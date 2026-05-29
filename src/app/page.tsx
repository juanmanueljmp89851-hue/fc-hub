import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { NewsFeed } from "@/components/home/NewsFeed";
import { LiveTicker } from "@/components/home/LiveTicker";
import { LatestCards } from "@/components/home/LatestCards";
import { AdSlot } from "@/components/ads/AdSlot";
import { prisma } from "@/lib/db";
import type { FutPlayer } from "@/types/player";

const quickLinks = [
  {
    href: "/actualidad",
    title: "Actualidad",
    description: "Noticias y novedades de FC 26",
    icon: "📰",
  },
  {
    href: "/jugadores",
    title: "Cartas FC26",
    description: "Base de datos de jugadores y cartas",
    icon: "🃏",
  },
  {
    href: "/torneos",
    title: "Arena",
    description: "Torneos y copas de la comunidad",
    icon: "🏆",
  },
  {
    href: "/jugar",
    title: "Duelos",
    description: "Desafiá rivales y demostrá quién manda",
    icon: "🎮",
  },
];

export default async function HomePage() {
  // Fetch newest 15 cards by release order
  const latestRaw = await prisma.futCard.findMany({
    orderBy: { promoOrder: "desc" },
    take: 15,
  });

  const lastUpdated = latestRaw[0]?.updatedAt?.toISOString() ?? null;

  const latestCards: FutPlayer[] = latestRaw.map((c) => ({
    id: c.id,
    eaId: c.eaId,
    name: c.name,
    commonName: c.commonName ?? undefined,
    position: c.position,
    alternatePositions: c.altPositions,
    overall: c.overall,
    pace: c.pace,
    shooting: c.shooting,
    passing: c.passing,
    dribbling: c.dribbling,
    defending: c.defending,
    physical: c.physical,
    club: c.club,
    league: c.league,
    nation: c.nation,
    cardType: c.cardType as FutPlayer["cardType"],
    promo: c.promo ?? undefined,
    promoOrder: c.promoOrder,
    imageUrl: c.imageUrl ?? undefined,
    cardImageId: c.cardImageId ?? undefined,
    skillMoves: c.skillMoves ?? undefined,
    weakFoot: c.weakFoot ?? undefined,
  }));

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Banner — estética Claude Design */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-surface-light bg-gradient-to-br from-surface via-surface to-surface-light p-8 md:p-12">
          {/* Glow decorativo */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />

          <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent">
            <span className="inline-block h-px w-5 bg-accent" />
            Todo el universo EA FC y fútbol en una sola plataforma
          </p>
          <h1 className="mb-3 text-4xl font-black leading-[1.1] md:text-5xl">
            <span className="italic text-foreground">Stats, mercado y fútbol. </span>
            <span className="italic text-accent">No salís más, caíste.</span>
          </h1>
          <p className="max-w-xl text-sm text-foreground/50">
            Donde vive el meta. Armá squads, seguí precios, competí y viví fútbol sin pausa.
          </p>
        </section>

        {/* Live Ticker — resultados en vivo fútbol real + FC 26 */}
        <div className="-mx-4 mb-8">
          <LiveTicker />
        </div>

        {/* Quick Links */}
        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="flex h-full flex-col justify-between transition-all hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,255,135,0.05)]">
                <div>
                  <span className="mb-2 block text-2xl">{link.icon}</span>
                  <h3 className="font-bold text-foreground">{link.title}</h3>
                  <p className="mt-1 text-xs text-foreground/50">
                    {link.description}
                  </p>
                </div>
                <div className="mt-3 text-right">
                  <span className="text-foreground/20 transition-colors group-hover:text-accent">→</span>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        {/* Ad Banner */}
        <div className="mb-8 flex justify-center">
          <AdSlot slot="banner" />
        </div>

        {/* Latest Cards Strip */}
        <LatestCards cards={latestCards} lastUpdated={lastUpdated} />

        {/* News Feed */}
        <section className="mb-8">
          <NewsFeed />
        </section>

        {/* Ad In-Feed */}
        <div className="mb-8 flex justify-center">
          <AdSlot slot="inFeed" />
        </div>
      </main>
    </div>
  );
}
