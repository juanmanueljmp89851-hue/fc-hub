import { NextResponse } from "next/server";
import { getTodayAllLeagues } from "@/lib/services/football-api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic"; // No ISR cache — always fresh

export interface TickerMatch {
  id: string;
  league: string;
  leagueFlag: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "live" | "finished" | "upcoming";
  minute: string | null;
  type: "real" | "fc26";
}

export async function GET() {
  const [realMatches, fc26Matches] = await Promise.all([
    fetchRealFootball(),
    fetchFC26Matches(),
  ]);

  const allMatches = [...realMatches, ...fc26Matches];

  // Sort: live first, then finished, then upcoming
  const statusOrder = { live: 0, finished: 1, upcoming: 2 };
  allMatches.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return NextResponse.json(allMatches);
}

async function fetchRealFootball(): Promise<TickerMatch[]> {
  try {
    const fixtures = await getTodayAllLeagues();
    return fixtures.map((f) => ({
      id: `real-${f.externalId}`,
      league: f.leagueName,
      leagueFlag: f.leagueFlag,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      status:
        f.status === "IN_PROGRESS"
          ? ("live" as const)
          : f.status === "FINISHED"
            ? ("finished" as const)
            : ("upcoming" as const),
      minute: f.minute ? `${f.minute}'` : null,
      type: "real" as const,
    }));
  } catch (err) {
    console.error("[ticker] Real football error:", err);
    return [];
  }
}

async function fetchFC26Matches(): Promise<TickerMatch[]> {
  try {
    // Recent casual matches (last 24h, finished or in progress)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [casualMatches, tournamentMatches] = await Promise.all([
      prisma.casualMatch.findMany({
        where: {
          createdAt: { gte: oneDayAgo },
          status: { in: ["FINISHED", "PENDING_CONFIRMATION", "IN_PROGRESS"] },
        },
        include: {
          challenger: { select: { username: true } },
          challenged: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.tournamentMatch.findMany({
        where: {
          confirmedAt: { gte: oneDayAgo },
          status: { in: ["FINISHED", "PENDING_CONFIRMATION"] },
        },
        include: {
          player1: { select: { username: true } },
          player2: { select: { username: true } },
          tournament: { select: { name: true } },
        },
        orderBy: { confirmedAt: "desc" },
        take: 10,
      }),
    ]);

    const casual: TickerMatch[] = casualMatches.map((m) => ({
      id: `casual-${m.id}`,
      league: "Casual Ranked",
      leagueFlag: "⚔️",
      homeTeam: m.challenger.username,
      awayTeam: m.challenged.username,
      homeScore: m.resultChallenger,
      awayScore: m.resultChallenged,
      status:
        m.status === "FINISHED"
          ? ("finished" as const)
          : m.status === "IN_PROGRESS"
            ? ("live" as const)
            : ("live" as const), // PENDING_CONFIRMATION = still "live"
      minute: null,
      type: "fc26" as const,
    }));

    const tournament: TickerMatch[] = tournamentMatches
      .filter((m) => m.player1 && m.player2)
      .map((m) => ({
        id: `tourney-${m.id}`,
        league: m.tournament.name,
        leagueFlag: "🏆",
        homeTeam: m.player1!.username,
        awayTeam: m.player2!.username,
        homeScore: m.resultP1,
        awayScore: m.resultP2,
        status:
          m.status === "FINISHED"
            ? ("finished" as const)
            : ("live" as const),
        minute: null,
        type: "fc26" as const,
      }));

    return [...casual, ...tournament];
  } catch (err) {
    console.error("[ticker] FC26 matches error:", err);
    return [];
  }
}
