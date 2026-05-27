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
