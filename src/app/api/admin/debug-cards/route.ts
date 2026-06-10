import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== "debug_cards_2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const top = await prisma.futCard.findMany({
    orderBy: [{ promoOrder: "desc" }, { overall: "desc" }],
    take: 20,
    select: {
      name: true,
      commonName: true,
      overall: true,
      cardType: true,
      promoOrder: true,
      cardImageId: true,
    },
  });

  // Also find Richards and Mazraoui specifically
  const richards = await prisma.futCard.findFirst({
    where: { eaId: 250954 },
    select: { name: true, overall: true, cardType: true, promoOrder: true, cardImageId: true },
  });
  const mazraoui = await prisma.futCard.findFirst({
    where: { eaId: 236401 },
    select: { name: true, overall: true, cardType: true, promoOrder: true, cardImageId: true },
  });

  return NextResponse.json({ top, richards, mazraoui });
}
