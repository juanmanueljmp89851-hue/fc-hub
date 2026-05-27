import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWorldCupFixtures, type NormalizedFixture } from "@/lib/services/football-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-time or weekly sync: imports all World Cup fixtures and links externalId
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fixtures = await getWorldCupFixtures();
    const results = await linkFixtures(fixtures);
    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function linkFixtures(fixtures: NormalizedFixture[]) {
  let linked = 0;
  const created = 0;
  let skipped = 0;

  // Get all existing matches without externalId
  const unlinked = await prisma.prodeMatch.findMany({
    where: { externalId: null },
  });

  for (const fixture of fixtures) {
    // Already linked?
    const existing = await prisma.prodeMatch.findUnique({
      where: { externalId: fixture.externalId },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // Try to match by teams + date (fuzzy: same day)
    const matchCandidate = unlinked.find((m: { homeTeam: string; awayTeam: string; matchDate: Date }) => {
      const sameHome = m.homeTeam === fixture.homeTeam;
      const sameAway = m.awayTeam === fixture.awayTeam;
      const sameDay =
        m.matchDate.toISOString().split("T")[0] ===
        fixture.matchDate.toISOString().split("T")[0];
      return sameHome && sameAway && sameDay;
    });

    if (matchCandidate) {
      await prisma.prodeMatch.update({
        where: { id: matchCandidate.id },
        data: {
          externalId: fixture.externalId,
          venue: fixture.venue ?? matchCandidate.venue,
          matchDate: fixture.matchDate,
        },
      });
      linked++;
    } else {
      // No match in DB — could auto-create if there's a matching week
      // For now skip; admin should create weeks first
      skipped++;
    }
  }

  return { linked, created, skipped, totalFixtures: fixtures.length };
}
