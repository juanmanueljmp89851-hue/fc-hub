"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/user";
import { revalidatePath } from "next/cache";
import { PRODE } from "@/lib/constants";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return user;
}

// ─── Dashboard stats ───────────────────────────────────────

export async function getAdminStats() {
  await requireAdmin();

  const [users, tournaments, casualMatches, prodes, influencers, prodeWeeks] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count(),
    prisma.casualMatch.count(),
    prisma.prode.count(),
    prisma.influencer.count({ where: { active: true } }),
    prisma.prodeWeek.count(),
  ]);

  return { users, tournaments, casualMatches, prodes, influencers, prodeWeeks };
}

// ─── User management ──────────────────────────────────────

export async function getUsers(search?: string) {
  await requireAdmin();

  return prisma.user.findMany({
    where: search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      rankingPoints: true,
      banned: true,
      bannedReason: true,
      createdAt: true,
    },
  });
}

export async function toggleUserRole(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return { error: "Usuario no encontrado" };

  const newRole = user.role === "ADMIN" ? "PLAYER" : "ADMIN";
  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });

  revalidatePath("/admin/usuarios");
  return { success: true, newRole };
}

// ─── Admin: all prodes (including deleted) ────────────────

export async function getAllProdesAdmin() {
  await requireAdmin();

  return prisma.prode.findMany({
    include: {
      createdBy: { select: { username: true } },
      _count: { select: { participants: true, joinRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Prode week management ────────────────────────────────

export async function getProdeWeeksAdmin() {
  await requireAdmin();

  return prisma.prodeWeek.findMany({
    orderBy: { deadline: "asc" },
    include: {
      matches: {
        orderBy: { matchDate: "asc" },
        select: {
          id: true,
          homeTeam: true,
          awayTeam: true,
          homeScore: true,
          awayScore: true,
          matchDate: true,
          status: true,
          externalId: true,
          group: true,
          extraTime: true,
          penalties: true,
          winnerTeam: true,
        },
      },
      _count: { select: { matches: true } },
    },
  });
}

export async function updateWeekStatus(weekId: string, status: "UPCOMING" | "OPEN" | "CLOSED" | "SCORED") {
  await requireAdmin();

  await prisma.prodeWeek.update({
    where: { id: weekId },
    data: { status },
  });

  revalidatePath("/admin/prode");
  return { success: true };
}

export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number) {
  await requireAdmin();

  await prisma.prodeMatch.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "FINISHED" },
  });

  // Recalculate points for all predictions on this match
  const predictions = await prisma.prodePrediction.findMany({
    where: { matchId },
  });

  const realOutcome = homeScore > awayScore ? "H" : homeScore < awayScore ? "A" : "D";

  for (const pred of predictions) {
    if (pred.predHomeScore == null || pred.predAwayScore == null) continue;
    let points = 0;
    if (pred.predHomeScore === homeScore && pred.predAwayScore === awayScore) {
      points = PRODE.EXACT_RESULT;
    } else {
      const predOutcome = pred.predHomeScore > pred.predAwayScore ? "H" : pred.predHomeScore < pred.predAwayScore ? "A" : "D";
      if (realOutcome === predOutcome) points = PRODE.CORRECT_WINNER;
    }
    await prisma.prodePrediction.update({
      where: { id: pred.id },
      data: { pointsEarned: points },
    });
  }

  revalidatePath("/admin/prode");
  revalidatePath("/prode");
  return { success: true };
}

// ─── Influencer management ────────────────────────────────

export async function getInfluencersAdmin() {
  await requireAdmin();

  return prisma.influencer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { videos: true } } },
  });
}

export async function toggleInfluencerActive(influencerId: string) {
  await requireAdmin();

  const inf = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { active: true } });
  if (!inf) return { error: "No encontrado" };

  await prisma.influencer.update({
    where: { id: influencerId },
    data: { active: !inf.active },
  });

  revalidatePath("/admin/influencers");
  return { success: true };
}

export async function toggleInfluencerFeatured(influencerId: string) {
  await requireAdmin();

  const inf = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { featured: true } });
  if (!inf) return { error: "No encontrado" };

  await prisma.influencer.update({
    where: { id: influencerId },
    data: { featured: !inf.featured },
  });

  revalidatePath("/admin/influencers");
  return { success: true };
}

// ─── Ban / Unban ─────────────────────────────────────────────

export async function banUser(userId: string, reason: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: true,
      bannedReason: reason,
      bannedAt: new Date(),
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function unbanUser(userId: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: false,
      bannedReason: null,
      bannedAt: null,
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

// ─── Moderación ──────────────────────────────────────────────

export async function getModerationData() {
  await requireAdmin();

  const [tournaments, deletedTournaments, prodes, deletedProdes, recentMessages] = await Promise.all([
    prisma.tournament.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        status: true,
        format: true,
        createdAt: true,
        createdBy: { select: { username: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.tournament.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        status: true,
        format: true,
        deletedAt: true,
        createdBy: { select: { username: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.prode.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        createdAt: true,
        createdBy: { select: { username: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.prode.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        deletedAt: true,
        createdBy: { select: { username: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.lobbyMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
  ]);

  // Fetch recent casual matches (duels)
  const duels = await prisma.casualMatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      challenger: { select: { id: true, username: true, avatarUrl: true, psnUsername: true, xboxUsername: true, pcUsername: true } },
      challenged: { select: { id: true, username: true, avatarUrl: true, psnUsername: true, xboxUsername: true, pcUsername: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, username: true } } },
      },
    },
  });

  return { tournaments, deletedTournaments, prodes, deletedProdes, recentMessages, duels };
}

export async function deleteTournament(tournamentId: string) {
  await requireAdmin();

  // Delete related data in order (respecting FK constraints)
  await prisma.matchMessage.deleteMany({
    where: { tournamentMatch: { tournamentId } },
  });
  await prisma.tournamentDispute.deleteMany({ where: { tournamentId } });
  await prisma.tournamentMatch.deleteMany({ where: { tournamentId } });
  await prisma.leagueStanding.deleteMany({ where: { tournamentId } });
  await prisma.tournamentWaitlist.deleteMany({ where: { tournamentId } });
  await prisma.tournamentParticipant.deleteMany({ where: { tournamentId } });
  await prisma.tournamentAuditLog.deleteMany({ where: { tournamentId } });
  await prisma.tournament.delete({ where: { id: tournamentId } });

  revalidatePath("/admin/moderacion");
  revalidatePath("/torneos");
  return { success: true };
}

export async function deleteProde(prodeId: string) {
  await requireAdmin();

  // Delete related data
  await prisma.prodeGroupPrediction.deleteMany({ where: { prodeId } });
  await prisma.prodeAdvancePrediction.deleteMany({ where: { prodeId } });
  await prisma.prodePrediction.deleteMany({ where: { prodeId } });
  await prisma.prodeParticipant.deleteMany({ where: { prodeId } });
  await prisma.prode.delete({ where: { id: prodeId } });

  revalidatePath("/admin/moderacion");
  revalidatePath("/prode");
  return { success: true };
}

export async function deleteLobbyMessage(messageId: string) {
  await requireAdmin();

  await prisma.lobbyMessage.delete({ where: { id: messageId } });

  revalidatePath("/admin/moderacion");
  return { success: true };
}

export async function adminSendMatchMessage(casualMatchId: string, text: string) {
  const admin = await requireAdmin();

  await prisma.matchMessage.create({
    data: {
      casualMatchId,
      userId: admin.id,
      message: text,
    },
  });

  revalidatePath("/admin/moderacion");
  return { success: true };
}

export async function searchUsersForNotification(query: string) {
  await requireAdmin();
  if (!query || query.length < 2) return [];

  return prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
    },
    take: 10,
    select: { id: true, username: true, avatarUrl: true },
  });
}

// ─── Bracket propagation ─────────────────────────────────

export async function propagateBracket() {
  await requireAdmin();

  const weeks = await prisma.prodeWeek.findMany({
    where: {
      title: { in: ["16avos de Final", "Octavos de Final", "Cuartos de Final", "Semifinales", "Final"] },
    },
    include: { matches: { orderBy: { matchDate: "asc" } } },
  });

  const weekMap = new Map(weeks.map((w) => [w.title, w]));
  const r32 = weekMap.get("16avos de Final")?.matches ?? [];
  const r16 = weekMap.get("Octavos de Final")?.matches ?? [];
  const qf = weekMap.get("Cuartos de Final")?.matches ?? [];
  const sf = weekMap.get("Semifinales")?.matches ?? [];
  const finalWeek = weekMap.get("Final")?.matches ?? [];

  function getWinner(m: { homeTeam: string; awayTeam: string; homeScore: number | null; awayScore: number | null; winnerTeam: string | null; status: string }) {
    if (m.status !== "FINISHED") return null;
    if (m.winnerTeam) return m.winnerTeam;
    if (m.homeScore === null || m.awayScore === null) return null;
    if (m.homeScore > m.awayScore) return m.homeTeam;
    if (m.awayScore > m.homeScore) return m.awayTeam;
    return null;
  }

  function getLoser(m: Parameters<typeof getWinner>[0]) {
    const winner = getWinner(m);
    if (!winner) return null;
    return winner === m.homeTeam ? m.awayTeam : m.homeTeam;
  }

  function isPlaceholder(team: string) {
    return team.startsWith("G.") || team.startsWith("P.") || team.includes("Octavos") || team.includes("Cuartos") || team.includes("Semi");
  }

  let updates = 0;
  const log: string[] = [];

  async function propagateRound(source: typeof r32, target: typeof r16, label: string) {
    if (source.length === 0 || target.length === 0) return;
    const pairsCount = target.length;
    for (let i = 0; i < pairsCount; i++) {
      const m1 = source[i * 2];
      const m2 = source[i * 2 + 1];
      if (!m1 || !m2) continue;
      const t = target[i];
      const w1 = getWinner(m1);
      const w2 = getWinner(m2);
      if (w1 && isPlaceholder(t.homeTeam)) {
        await prisma.prodeMatch.update({ where: { id: t.id }, data: { homeTeam: w1 } });
        log.push(`${label} ${i + 1} home: ${w1}`);
        updates++;
      }
      if (w2 && isPlaceholder(t.awayTeam)) {
        await prisma.prodeMatch.update({ where: { id: t.id }, data: { awayTeam: w2 } });
        log.push(`${label} ${i + 1} away: ${w2}`);
        updates++;
      }
    }
  }

  await propagateRound(r32, r16, "Octavos");
  await propagateRound(r16, qf, "Cuartos");
  await propagateRound(qf, sf, "Semis");

  // Semis → Final + 3er puesto
  if (sf.length === 2 && finalWeek.length >= 2) {
    const final = finalWeek.find((m) => m.stage === "Final");
    const tercero = finalWeek.find((m) => m.stage === "Tercer Puesto");

    if (final) {
      const w1 = getWinner(sf[0]);
      const w2 = getWinner(sf[1]);
      if (w1 && isPlaceholder(final.homeTeam)) {
        await prisma.prodeMatch.update({ where: { id: final.id }, data: { homeTeam: w1 } });
        log.push(`Final home: ${w1}`);
        updates++;
      }
      if (w2 && isPlaceholder(final.awayTeam)) {
        await prisma.prodeMatch.update({ where: { id: final.id }, data: { awayTeam: w2 } });
        log.push(`Final away: ${w2}`);
        updates++;
      }
    }

    if (tercero) {
      const l1 = getLoser(sf[0]);
      const l2 = getLoser(sf[1]);
      if (l1 && isPlaceholder(tercero.homeTeam)) {
        await prisma.prodeMatch.update({ where: { id: tercero.id }, data: { homeTeam: l1 } });
        log.push(`3er puesto home: ${l1}`);
        updates++;
      }
      if (l2 && isPlaceholder(tercero.awayTeam)) {
        await prisma.prodeMatch.update({ where: { id: tercero.id }, data: { awayTeam: l2 } });
        log.push(`3er puesto away: ${l2}`);
        updates++;
      }
    }
  }

  revalidatePath("/admin/prode");
  revalidatePath("/prode");
  return { success: true, updates, log };
}

// ─── Group teams for scoring ─────────────────────────────

export async function getGroupsForScoring() {
  await requireAdmin();

  const matches = await prisma.prodeMatch.findMany({
    where: { group: { not: null } },
    select: { group: true, homeTeam: true, awayTeam: true },
  });

  const groups: Record<string, string[]> = {};
  for (const m of matches) {
    if (!m.group) continue;
    if (!groups[m.group]) groups[m.group] = [];
    if (!groups[m.group].includes(m.homeTeam)) groups[m.group].push(m.homeTeam);
    if (!groups[m.group].includes(m.awayTeam)) groups[m.group].push(m.awayTeam);
  }

  // Check which groups already scored
  const scored = await prisma.prodeGroupPrediction.findMany({
    where: { pointsEarned: { gt: 0 } },
    select: { groupName: true },
    distinct: ["groupName"],
  });
  const scoredGroups = new Set(scored.map((s) => s.groupName));

  return { groups, scoredGroups: Array.from(scoredGroups) };
}

export async function deleteLobbyMessagesBulk(messageIds: string[]) {
  await requireAdmin();

  await prisma.lobbyMessage.deleteMany({
    where: { id: { in: messageIds } },
  });

  revalidatePath("/admin/moderacion");
  return { success: true, deleted: messageIds.length };
}
