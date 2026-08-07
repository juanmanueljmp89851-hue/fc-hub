import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTodayFixtures, type NormalizedFixture } from "@/lib/services/football-api";
import { PRODE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fixtures = await getTodayFixtures();
    const results = await syncFixtures(fixtures);
    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function syncFixtures(fixtures: NormalizedFixture[]) {
  let updated = 0;
  let scored = 0;

  const externalIds = fixtures.map((f) => f.externalId);
  const existingMatches = await prisma.prodeMatch.findMany({
    where: { externalId: { in: externalIds } },
  });
  const matchByExtId = new Map(existingMatches.map((m) => [m.externalId, m]));

  for (const fixture of fixtures) {
    const match = matchByExtId.get(fixture.externalId);
    if (!match) continue;

    const statusChanged = match.status !== fixture.status;
    const scoreChanged =
      match.homeScore !== fixture.homeScore || match.awayScore !== fixture.awayScore;

    if (!statusChanged && !scoreChanged) continue;

    await prisma.prodeMatch.update({
      where: { id: match.id },
      data: {
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        status: fixture.status,
      },
    });
    updated++;

    if (fixture.status === "FINISHED" && match.status !== "FINISHED") {
      await scoreMatchPredictions(
        match.id,
        fixture.homeScore!,
        fixture.awayScore!,
      );
      scored++;
    }
  }

  await checkWeekStatus();

  return { updated, scored, total: fixtures.length };
}

async function scoreMatchPredictions(
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const predictions = await prisma.prodePrediction.findMany({
    where: { matchId },
  });

  if (predictions.length === 0) return;

  const realOutcome = homeScore > awayScore ? "H" : homeScore < awayScore ? "A" : "D";

  const exactIds: string[] = [];
  const winnerIds: string[] = [];
  const incorrectIds: string[] = [];

  for (const pred of predictions) {
    if (pred.predHomeScore === homeScore && pred.predAwayScore === awayScore) {
      exactIds.push(pred.id);
    } else {
      const predOutcome =
        pred.predHomeScore > pred.predAwayScore
          ? "H"
          : pred.predHomeScore < pred.predAwayScore
            ? "A"
            : "D";
      if (realOutcome === predOutcome) {
        winnerIds.push(pred.id);
      } else {
        incorrectIds.push(pred.id);
      }
    }
  }

  await prisma.$transaction([
    ...(exactIds.length > 0
      ? [prisma.prodePrediction.updateMany({
          where: { id: { in: exactIds } },
          data: { pointsEarned: PRODE.EXACT_RESULT },
        })]
      : []),
    ...(winnerIds.length > 0
      ? [prisma.prodePrediction.updateMany({
          where: { id: { in: winnerIds } },
          data: { pointsEarned: PRODE.CORRECT_WINNER },
        })]
      : []),
    ...(incorrectIds.length > 0
      ? [prisma.prodePrediction.updateMany({
          where: { id: { in: incorrectIds } },
          data: { pointsEarned: PRODE.INCORRECT },
        })]
      : []),
  ]);
}

async function checkWeekStatus() {
  // Auto-close weeks past deadline
  const now = new Date();
  await prisma.prodeWeek.updateMany({
    where: {
      status: "OPEN",
      deadline: { lte: now },
    },
    data: { status: "CLOSED" },
  });

  // Auto-mark as SCORED if all matches in week are FINISHED
  const closedWeeks = await prisma.prodeWeek.findMany({
    where: { status: "CLOSED" },
    include: { matches: { select: { status: true } } },
  });

  for (const week of closedWeeks) {
    const allFinished = week.matches.length > 0 && week.matches.every((m: { status: string }) => m.status === "FINISHED");
    if (allFinished) {
      await prisma.prodeWeek.update({
        where: { id: week.id },
        data: { status: "SCORED" },
      });
    }
  }
}
