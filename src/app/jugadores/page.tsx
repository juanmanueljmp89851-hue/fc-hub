import { prisma } from "@/lib/db";
import { JugadoresClient } from "./JugadoresClient";
import type { FutPlayer } from "@/types/player";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min cache

export default async function JugadoresPage() {
  // Fetch cards from DB grouped by promo, newest first
  const cards = await prisma.futCard.findMany({
    orderBy: [{ promoOrder: "desc" }, { overall: "desc" }],
    take: 1000,
  });

  // Map Prisma model → FutPlayer type
  const players: FutPlayer[] = cards.map((c) => ({
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
    pricePs: c.pricePs ?? undefined,
    pricePc: c.pricePc ?? undefined,
    futbinRating: c.futbinRating ?? undefined,
    addedAt: c.createdAt.toISOString(),
  }));

  // Get unique promos in order (for filter dropdown)
  const promos = [...new Set(cards.map((c) => c.promo).filter(Boolean))] as string[];

  return <JugadoresClient players={players} promos={promos} />;
}
