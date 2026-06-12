import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PRODE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== "fix_mexico_2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Find Mexico vs South Africa match
  const matches = await prisma.prodeMatch.findMany({
    where: {
      OR: [
        { homeTeam: { contains: "xico" } },
        { homeTeam: { contains: "MEX" } },
      ],
    },
    select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, status: true },
  });

  const mexico = matches.find(
    (m) => m.awayTeam.includes("Sud") || m.awayTeam.includes("RSA") || m.awayTeam.includes("South")
  );

  if (!mexico) {
    return NextResponse.json({ error: "Match not found", candidates: matches });
  }

  // Update score
  await prisma.prodeMatch.update({
    where: { id: mexico.id },
    data: { homeScore: 2, awayScore: 0, status: "FINISHED" },
  });

  // Recalculate predictions
  const predictions = await prisma.prodePrediction.findMany({
    where: { matchId: mexico.id },
  });

  const realOutcome = "H"; // Mexico won
  let updated = 0;

  for (const pred of predictions) {
    if (pred.homeScore == null || pred.awayScore == null) continue;
    let points = 0;
    if (pred.homeScore === 2 && pred.awayScore === 0) {
      points = PRODE.EXACT_RESULT;
    } else {
      const predOutcome = pred.homeScore > pred.awayScore ? "H" : pred.homeScore < pred.awayScore ? "A" : "D";
      if (realOutcome === predOutcome) points = PRODE.CORRECT_WINNER;
    }
    await prisma.prodePrediction.update({
      where: { id: pred.id },
      data: { pointsEarned: points },
    });
    updated++;
  }

  return NextResponse.json({
    success: true,
    match: `${mexico.homeTeam} vs ${mexico.awayTeam}`,
    score: "2-0",
    predictionsUpdated: updated,
  });
}
