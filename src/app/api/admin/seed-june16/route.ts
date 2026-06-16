import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TOKEN = process.env.SEED_TOKEN ?? "abe93ed109bf48ba93591cc7a0486513";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get current max promoOrder so new cards appear first
  const top = await prisma.futCard.findFirst({
    orderBy: { promoOrder: "desc" },
    select: { promoOrder: true },
  });
  const baseOrder = (top?.promoOrder ?? 999_999) + 1;

  const newCards = [
    {
      eaId: 25881, name: 'Aaron Wan-Bissaka', commonName: 'Wan-Bissaka',
      overall: 93, position: 'RB', altPositions: ['RM'],
      pace: 94, shooting: 66, passing: 91, dribbling: 92, defending: 93, physical: 93,
      club: 'West Ham', league: 'Premier League', nation: 'Congo DR',
      cardType: 'path_to_glory', promo: 'Path to Glory', cardImageId: 'path_to_glory',
      skillMoves: 4, weakFoot: 4, foot: 'Right', height: 183, weight: 72,
      workRateAtk: 'Medium', workRateDef: 'High',
      releaseDate: new Date('2026-06-16'),
    },
    {
      eaId: 25880, name: "Samuel Eto'o", commonName: "Eto'o",
      overall: 95, position: 'ST', altPositions: [] as string[],
      pace: 96, shooting: 95, passing: 87, dribbling: 94, defending: 55, physical: 88,
      club: 'EA FC ICONS', league: 'Icons', nation: 'Cameroon',
      cardType: 'icon', promo: 'Greats of the Game', cardImageId: 'icon',
      skillMoves: 5, weakFoot: 5, foot: 'Right', height: 179, weight: 75,
      workRateAtk: 'High', workRateDef: 'Low',
      releaseDate: new Date('2026-06-15'),
    },
    {
      eaId: 25879, name: 'Xaver Schlager', commonName: 'Schlager',
      overall: 93, position: 'CDM', altPositions: ['CM'],
      pace: 89, shooting: 88, passing: 90, dribbling: 92, defending: 94, physical: 93,
      club: 'RB Leipzig', league: 'Bundesliga', nation: 'Austria',
      cardType: 'path_to_glory', promo: 'Path to Glory', cardImageId: 'path_to_glory',
      skillMoves: 4, weakFoot: 4, foot: 'Left', height: 174, weight: 71,
      workRateAtk: 'High', workRateDef: 'High',
      releaseDate: new Date('2026-06-15'),
    },
    {
      eaId: 25878, name: 'Alexia Putellas Segura', commonName: 'Alexia Putellas',
      overall: 96, position: 'CM', altPositions: ['CDM', 'CAM'],
      pace: 91, shooting: 95, passing: 95, dribbling: 96, defending: 89, physical: 88,
      club: 'FC Barcelona', league: 'Liga F', nation: 'Spain',
      cardType: 'end_of_era', promo: 'End of Era', cardImageId: 'end_of_era',
      skillMoves: 5, weakFoot: 5, foot: 'Left', height: 173, weight: 60,
      workRateAtk: 'High', workRateDef: 'Medium',
      releaseDate: new Date('2026-06-14'),
    },
    {
      eaId: 25877, name: 'Martin Baturina', commonName: 'Baturina',
      overall: 91, position: 'CAM', altPositions: ['CM'],
      pace: 91, shooting: 92, passing: 92, dribbling: 93, defending: 75, physical: 85,
      club: 'Como', league: 'Serie A TIM', nation: 'Croatia',
      cardType: 'showdown', promo: 'Showdown', cardImageId: 'showdown',
      skillMoves: 5, weakFoot: 4, foot: 'Right', height: 172, weight: 64,
      workRateAtk: 'High', workRateDef: 'Medium',
      releaseDate: new Date('2026-06-14'),
    },
    {
      eaId: 25876, name: 'Tino Livramento', commonName: 'Livramento',
      overall: 91, position: 'RB', altPositions: ['LB', 'RM'],
      pace: 91, shooting: 62, passing: 90, dribbling: 90, defending: 91, physical: 91,
      club: 'Newcastle Utd', league: 'Premier League', nation: 'England',
      cardType: 'showdown', promo: 'Showdown', cardImageId: 'showdown',
      skillMoves: 4, weakFoot: 5, foot: 'Right', height: 181, weight: 73,
      workRateAtk: 'Medium', workRateDef: 'High',
      releaseDate: new Date('2026-06-14'),
    },
    {
      eaId: 25875, name: 'Alexis Mac Allister', commonName: 'Mac Allister',
      overall: 95, position: 'CM', altPositions: ['CDM'],
      pace: 94, shooting: 95, passing: 95, dribbling: 95, defending: 94, physical: 91,
      club: 'Liverpool', league: 'Premier League', nation: 'Argentina',
      cardType: 'path_to_glory', promo: 'Path to Glory', cardImageId: 'path_to_glory',
      skillMoves: 4, weakFoot: 5, foot: 'Right', height: 176, weight: 70,
      workRateAtk: 'High', workRateDef: 'High',
      releaseDate: new Date('2026-06-13'),
    },
  ];

  const results = [];
  for (let i = 0; i < newCards.length; i++) {
    const c = newCards[i];
    const order = baseOrder + (newCards.length - 1 - i);
    const card = await prisma.futCard.upsert({
      where: { eaId_cardType: { eaId: c.eaId, cardType: c.cardType } },
      update: {
        name: c.name, commonName: c.commonName, overall: c.overall,
        position: c.position, altPositions: c.altPositions,
        pace: c.pace, shooting: c.shooting, passing: c.passing,
        dribbling: c.dribbling, defending: c.defending, physical: c.physical,
        club: c.club, league: c.league, nation: c.nation,
        promo: c.promo, promoOrder: order, cardImageId: c.cardImageId,
        skillMoves: c.skillMoves, weakFoot: c.weakFoot, foot: c.foot,
        height: c.height, weight: c.weight,
        workRateAtk: c.workRateAtk, workRateDef: c.workRateDef,
        releaseDate: c.releaseDate,
      },
      create: {
        ...c, promoOrder: order, imageUrl: null, source: 'manual',
      },
    });
    results.push({ id: card.id, name: card.commonName, overall: card.overall, promoOrder: order });
  }

  return NextResponse.json({ ok: true, baseOrder, seeded: results.length, cards: results });
}
