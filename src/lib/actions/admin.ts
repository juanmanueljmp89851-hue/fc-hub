"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/user";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/admin/prode");
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

export async function deleteLobbyMessagesBulk(messageIds: string[]) {
  await requireAdmin();

  await prisma.lobbyMessage.deleteMany({
    where: { id: { in: messageIds } },
  });

  revalidatePath("/admin/moderacion");
  return { success: true, deleted: messageIds.length };
}
