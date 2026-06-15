"use server";

import { prisma } from "@/lib/db";

export async function getUserStats(userId: string) {
  const [
    tournamentMatches,
    casualMatches,
    tournamentsPlayed,
    tournamentsWon,
  ] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: "FINISHED",
      },
      select: {
        player1Id: true,
        player2Id: true,
        resultP1: true,
        resultP2: true,
        winnerId: true,
        createdAt: true,
        tournament: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.casualMatch.findMany({
      where: {
        OR: [{ challengerId: userId }, { challengedId: userId }],
        status: "FINISHED",
      },
      select: {
        challengerId: true,
        challengedId: true,
        resultChallenger: true,
        resultChallenged: true,
        winnerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournamentParticipant.count({
      where: { userId, status: "CONFIRMED" },
    }),
    prisma.tournamentParticipant.count({
      where: { userId, positionFinal: 1 },
    }),
  ]);

  let totalWins = 0;
  let totalLosses = 0;
  let totalDraws = 0;
  let totalGoalsFor = 0;
  let totalGoalsAgainst = 0;
  let currentStreak = 0;
  let streakType: "W" | "L" | "D" | null = null;

  const allMatches: Array<{
    date: Date;
    result: "W" | "L" | "D";
    goalsFor: number;
    goalsAgainst: number;
    type: "tournament" | "casual";
    context?: string;
    rivalId?: string;
  }> = [];

  for (const m of tournamentMatches) {
    const isP1 = m.player1Id === userId;
    const gf = (isP1 ? m.resultP1 : m.resultP2) ?? 0;
    const ga = (isP1 ? m.resultP2 : m.resultP1) ?? 0;
    const result = m.winnerId === userId ? "W" : m.winnerId ? "L" : "D";

    totalGoalsFor += gf;
    totalGoalsAgainst += ga;
    if (result === "W") totalWins++;
    else if (result === "L") totalLosses++;
    else totalDraws++;

    allMatches.push({
      date: m.createdAt,
      result,
      goalsFor: gf,
      goalsAgainst: ga,
      type: "tournament",
      context: m.tournament.name,
      rivalId: isP1 ? m.player2Id ?? undefined : m.player1Id ?? undefined,
    });
  }

  for (const m of casualMatches) {
    const isChallenger = m.challengerId === userId;
    const gf = (isChallenger ? m.resultChallenger : m.resultChallenged) ?? 0;
    const ga = (isChallenger ? m.resultChallenged : m.resultChallenger) ?? 0;
    const result = m.winnerId === userId ? "W" : m.winnerId ? "L" : "D";

    totalGoalsFor += gf;
    totalGoalsAgainst += ga;
    if (result === "W") totalWins++;
    else if (result === "L") totalLosses++;
    else totalDraws++;

    allMatches.push({
      date: m.createdAt,
      result,
      goalsFor: gf,
      goalsAgainst: ga,
      type: "casual",
      rivalId: isChallenger ? m.challengedId : m.challengerId,
    });
  }

  allMatches.sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const m of allMatches) {
    if (streakType === null) {
      streakType = m.result;
      currentStreak = 1;
    } else if (m.result === streakType) {
      currentStreak++;
    } else {
      break;
    }
  }

  let bestWinStreak = 0;
  let tempStreak = 0;
  for (const m of allMatches) {
    if (m.result === "W") {
      tempStreak++;
      if (tempStreak > bestWinStreak) bestWinStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const totalPlayed = totalWins + totalLosses + totalDraws;
  const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

  return {
    totalPlayed,
    totalWins,
    totalLosses,
    totalDraws,
    winRate,
    totalGoalsFor,
    totalGoalsAgainst,
    goalDiff: totalGoalsFor - totalGoalsAgainst,
    avgGoalsFor: totalPlayed > 0 ? +(totalGoalsFor / totalPlayed).toFixed(1) : 0,
    currentStreak,
    currentStreakType: streakType,
    bestWinStreak,
    tournamentsPlayed,
    tournamentsWon,
    recentMatches: allMatches.slice(0, 20),
  };
}

export async function getHeadToHead(userId1: string, userId2: string) {
  const [tournamentMatches, casualMatches] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: {
        OR: [
          { player1Id: userId1, player2Id: userId2 },
          { player1Id: userId2, player2Id: userId1 },
        ],
        status: "FINISHED",
      },
      select: {
        player1Id: true,
        player2Id: true,
        resultP1: true,
        resultP2: true,
        winnerId: true,
        createdAt: true,
        tournament: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.casualMatch.findMany({
      where: {
        OR: [
          { challengerId: userId1, challengedId: userId2 },
          { challengerId: userId2, challengedId: userId1 },
        ],
        status: "FINISHED",
      },
      select: {
        challengerId: true,
        challengedId: true,
        resultChallenger: true,
        resultChallenged: true,
        winnerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let u1Wins = 0;
  let u2Wins = 0;
  let draws = 0;
  let u1Goals = 0;
  let u2Goals = 0;

  for (const m of tournamentMatches) {
    const isU1P1 = m.player1Id === userId1;
    u1Goals += (isU1P1 ? m.resultP1 : m.resultP2) ?? 0;
    u2Goals += (isU1P1 ? m.resultP2 : m.resultP1) ?? 0;
    if (m.winnerId === userId1) u1Wins++;
    else if (m.winnerId === userId2) u2Wins++;
    else draws++;
  }

  for (const m of casualMatches) {
    const isU1Challenger = m.challengerId === userId1;
    u1Goals += (isU1Challenger ? m.resultChallenger : m.resultChallenged) ?? 0;
    u2Goals += (isU1Challenger ? m.resultChallenged : m.resultChallenger) ?? 0;
    if (m.winnerId === userId1) u1Wins++;
    else if (m.winnerId === userId2) u2Wins++;
    else draws++;
  }

  return {
    totalMatches: u1Wins + u2Wins + draws,
    u1Wins,
    u2Wins,
    draws,
    u1Goals,
    u2Goals,
  };
}
