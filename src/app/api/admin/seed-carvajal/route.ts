import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== "seed_carvajal_eoe") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Remove all records with wrong eaId (186942 = Gündoğan, not Carvajal)
  await prisma.futCard.deleteMany({
    where: { eaId: 186942 },
  });

  const card = await prisma.futCard.upsert({
    where: { eaId_cardType: { eaId: 204963, cardType: "end_of_era" } },
    update: {
      name: "Dani Carvajal",
      commonName: "Carvajal",
      overall: 94,
      position: "RB",
      altPositions: ["RWB"],
      pace: 85,
      shooting: 78,
      passing: 88,
      dribbling: 86,
      defending: 94,
      physical: 85,
      club: "Real Madrid",
      league: "LaLiga EA Sports",
      nation: "España",
      promo: "End of Era",
      promoOrder: 999999,
      cardImageId: null,
      imageUrl: null,
      skillMoves: 3,
      weakFoot: 3,
      foot: "Right",
      height: 173,
      weight: 75,
      workRateAtk: "Medium",
      workRateDef: "High",
      releaseDate: new Date("2026-06-01"),
    },
    create: {
      eaId: 204963,
      name: "Dani Carvajal",
      commonName: "Carvajal",
      overall: 94,
      position: "RB",
      altPositions: ["RWB"],
      pace: 85,
      shooting: 78,
      passing: 88,
      dribbling: 86,
      defending: 94,
      physical: 85,
      club: "Real Madrid",
      league: "LaLiga EA Sports",
      nation: "España",
      cardType: "end_of_era",
      promo: "End of Era",
      promoOrder: 999999,
      cardImageId: null,
      imageUrl: null,
      skillMoves: 3,
      weakFoot: 3,
      foot: "Right",
      height: 173,
      weight: 75,
      workRateAtk: "Medium",
      workRateDef: "High",
      releaseDate: new Date("2026-06-01"),
      source: "manual",
    },
  });

  return NextResponse.json({
    ok: true,
    card: { id: card.id, name: card.name, overall: card.overall, cardType: card.cardType, eaId: card.eaId },
  });
}
