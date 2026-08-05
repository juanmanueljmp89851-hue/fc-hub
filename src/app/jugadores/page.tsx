import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getLatestCardsLive } from "@/lib/futgg";
import { JugadoresClient } from "./JugadoresClient";
import { AdSlot } from "@/components/ads/AdSlot";
import type { FutPlayer } from "@/types/player";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min cache

export const metadata: Metadata = {
  title: "Cartas FC 26",
  description:
    "Base de datos de cartas de EA FC 26. Filtrá por promo, posición, overall y más.",
  alternates: { canonical: "/jugadores" },
  openGraph: {
    title: "Cartas FC 26 | Modo Fosa",
    description: "Base de datos de cartas de EA FC 26. Filtrá por promo, posición, overall y más.",
  },
};

export default async function JugadoresPage() {
  const [cards, liveCards] = await Promise.all([
    prisma.futCard.findMany({
      orderBy: [{ promoOrder: "desc" }, { releaseDate: "desc" }, { overall: "desc" }],
      take: 1000,
    }),
    getLatestCardsLive(3).catch(() => []),
  ]);

  const dbPlayers: FutPlayer[] = cards.map((c) => ({
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
    gkDiving: c.gkDiving ?? undefined,
    gkHandling: c.gkHandling ?? undefined,
    gkKicking: c.gkKicking ?? undefined,
    gkReflexes: c.gkReflexes ?? undefined,
    gkSpeed: c.gkSpeed ?? undefined,
    gkPositioning: c.gkPositioning ?? undefined,
    club: c.club,
    league: c.league,
    nation: c.nation,
    cardType: c.cardType as FutPlayer["cardType"],
    promo: c.promo ?? undefined,
    promoOrder: c.promoOrder,
    height: c.height ?? undefined,
    weight: c.weight ?? undefined,
    foot: c.foot ?? undefined,
    weakFoot: c.weakFoot ?? undefined,
    skillMoves: c.skillMoves ?? undefined,
    imageUrl: c.imageUrl ?? undefined,
    cardImageId: c.cardImageId ?? undefined,
    cardBgImageUrl: c.cardBgImageUrl ?? undefined,
    cardFullUrl: c.cardFullUrl ?? undefined,
    pricePs: c.pricePs ?? undefined,
    pricePc: c.pricePc ?? undefined,
    futbinRating: c.futbinRating ?? undefined,
    addedAt: c.createdAt.toISOString(),
  }));

  const dbEaIds = new Set(dbPlayers.map((c) => c.eaId));
  const liveFut: FutPlayer[] = liveCards
    .filter((lc) => !dbEaIds.has(lc.eaId))
    .map((lc) => ({
      id: `live-${lc.eaId}`,
      eaId: lc.eaId,
      name: lc.name,
      commonName: lc.commonName,
      position: lc.position,
      alternatePositions: lc.altPositions,
      overall: lc.overall,
      pace: lc.pace,
      shooting: lc.shooting,
      passing: lc.passing,
      dribbling: lc.dribbling,
      defending: lc.defending,
      physical: lc.physical,
      gkDiving: lc.gkDiving,
      gkHandling: lc.gkHandling,
      gkKicking: lc.gkKicking,
      gkReflexes: lc.gkReflexes,
      gkSpeed: lc.gkSpeed,
      gkPositioning: lc.gkPositioning,
      club: lc.club,
      league: lc.league,
      nation: lc.nation,
      cardType: lc.cardType as FutPlayer["cardType"],
      promo: lc.promo,
      promoOrder: lc.promoOrder,
      height: lc.height,
      foot: lc.foot,
      weakFoot: lc.weakFoot,
      skillMoves: lc.skillMoves,
      imageUrl: lc.imageUrl,
      cardBgImageUrl: lc.cardBgImageUrl,
      cardFullUrl: lc.cardFullUrl,
      pricePs: lc.pricePs,
      pricePc: lc.pricePc,
      addedAt: lc.createdAt,
    }));

  const players = [...liveFut, ...dbPlayers]
    .sort((a, b) => (b.promoOrder ?? 0) - (a.promoOrder ?? 0));

  const allPromos = [...new Set([...liveCards.map((c) => c.promo), ...cards.map((c) => c.promo)].filter(Boolean))] as string[];
  const promos = allPromos;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cartas FC 26",
    description: "Base de datos de cartas de EA FC 26. Filtrá por promo, posición, overall y más.",
    url: "https://www.modofosa.com.ar/jugadores",
    isPartOf: { "@id": "https://www.modofosa.com.ar/#website" },
    numberOfItems: players.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JugadoresClient players={players} promos={promos} />
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <AdSlot format="auto" />
      </div>
    </>
  );
}
