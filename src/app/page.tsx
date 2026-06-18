export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Modo Fosa — Comunidad EA FC Argentina | Stats, Torneos, Prode" },
  description:
    "Modo Fosa: la comunidad de EA FC Argentina. Torneos, prode del Mundial 2026, ranking, cartas FC 26, noticias y más.",
  alternates: { canonical: "/" },
};
import { Navbar } from "@/components/layout/Navbar";
import { HeroParallax } from "@/components/home/HeroParallax";
import { Card } from "@/components/ui/Card";
import { NewsFeed } from "@/components/home/NewsFeed";
import { LiveTicker } from "@/components/home/LiveTicker";
import { LatestCards } from "@/components/home/LatestCards";
import { AdSlot } from "@/components/ads/AdSlot";
import { Onboarding } from "@/components/home/Onboarding";
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
    href: "/prode",
    title: "Prode",
    description: "Predicciones del Mundial 2026",
    icon: "⚽",
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
];

export default async function HomePage() {
  // Fetch top 15 cards — highest promoOrder first (featured/newest promos)
  const latestRaw = await prisma.futCard.findMany({
    orderBy: [{ promoOrder: "desc" }, { releaseDate: "desc" }, { overall: "desc" }],
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
        {/* Hero Parallax */}
        <div className="-mx-4 -mt-8 mb-8">
          <HeroParallax />
        </div>

        {/* Live Ticker */}
        <div className="-mx-4 mb-8">
          <LiveTicker />
        </div>

        {/* Quick Links */}
        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="relative flex h-full min-h-[120px] flex-col justify-end transition-all hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,255,135,0.05)]">
                <span className="absolute right-3 top-3 text-sm text-foreground/20 transition-colors group-hover:text-accent">↗</span>
                <div>
                  <span className="mb-3 block text-2xl">{link.icon}</span>
                  <h3 className="font-bold text-foreground">{link.title}</h3>
                  <p className="mt-1 text-xs text-foreground/50">
                    {link.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        {/* Ad Banner */}
        <div className="mb-8">
          <AdSlot format="horizontal" />
        </div>

        {/* Latest Cards Strip */}
        <LatestCards cards={latestCards} lastUpdated={lastUpdated} />

        {/* News Feed */}
        <section className="mb-8">
          <NewsFeed variant="home" />
        </section>

        {/* Ad In-Feed */}
        <div className="mb-8">
          <AdSlot format="auto" />
        </div>
      </main>
      <Onboarding />
    </div>
  );
}
