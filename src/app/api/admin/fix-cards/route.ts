import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TOKEN = process.env.SEED_TOKEN ?? "abe93ed109bf48ba93591cc7a0486513";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fixes = [
    { oldEaId: 204963, newEaId: 67313827, cardType: "end_of_era", cardImageId: "25_end_of_era" },
    { oldEaId: 25881, newEaId: 67338744, cardType: "path_to_glory", cardImageId: "107_path_to_glory" },
    { oldEaId: 25880, newEaId: 100672972, cardType: "icon", cardImageId: "131_greats_of_the_game_icon" },
    { oldEaId: 25879, newEaId: 50564843, cardType: "path_to_glory", cardImageId: "107_path_to_glory" },
    { oldEaId: 25878, newEaId: 151222147, cardType: "end_of_era", cardImageId: "25_end_of_era" },
    { oldEaId: 25877, newEaId: 84148922, cardType: "showdown", cardImageId: "62_fof_showdown" },
    { oldEaId: 25876, newEaId: 67370982, cardType: "showdown", cardImageId: "62_fof_showdown" },
    { oldEaId: 25875, newEaId: 84125917, cardType: "path_to_glory", cardImageId: "107_path_to_glory" },
  ];

  const results = [];
  for (const f of fixes) {
    const existing = await prisma.futCard.findUnique({
      where: { eaId_cardType: { eaId: f.oldEaId, cardType: f.cardType } },
      select: { id: true, commonName: true },
    });

    if (!existing) {
      results.push({ oldEaId: f.oldEaId, status: "not_found" });
      continue;
    }

    // Update by primary key — avoids compound unique constraint issues
    await prisma.futCard.update({
      where: { id: existing.id },
      data: { eaId: f.newEaId, cardImageId: f.cardImageId },
    });

    results.push({
      oldEaId: f.oldEaId,
      newEaId: f.newEaId,
      cardImageId: f.cardImageId,
      name: existing.commonName,
      status: "fixed",
    });
  }

  return NextResponse.json({ ok: true, results });
}
