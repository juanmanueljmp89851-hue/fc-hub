"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { RANKING } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

// ─── Helpers ────────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  return dbUser?.id ?? null;
}

// ─── Desafiar ───────────────────────────────────────────────

export async function challengeUser(challengedId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };
  if (!rateLimit(`challenge:${userId}`, 10, 60_000).ok) {
    return { error: "Demasiados desafíos. Esperá un momento." };
  }
  if (userId === challengedId) return { error: "No podés desafiarte a vos mismo" };

  // Check no pending match between same players
  const existing = await prisma.casualMatch.findFirst({
    where: {
      OR: [
        { challengerId: userId, challengedId, status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "PENDING_CONFIRMATION"] } },
        { challengerId: challengedId, challengedId: userId, status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "PENDING_CONFIRMATION"] } },
      ],
    },
  });

  if (existing) return { error: "Ya tenés un desafío activo con este jugador" };

  const match = await prisma.casualMatch.create({
    data: {
      challengerId: userId,
      challengedId,
    },
  });

  // Notification
  const challenger = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  await prisma.notification.create({
    data: {
      userId: challengedId,
      type: "CASUAL_CHALLENGE",
      title: "Nuevo desafío",
      message: `${challenger?.username ?? "Alguien"} te desafió a un partido casual`,
      relatedId: match.id,
    },
  });

  revalidatePath("/casual");
  return { success: true, matchId: match.id };
}

// ─── Aceptar / Rechazar ─────────────────────────────────────

export async function acceptChallenge(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };
  if (match.challengedId !== userId) return { error: "No sos el desafiado" };
  if (match.status !== "PENDING") return { error: "El desafío ya no está pendiente" };

  await prisma.casualMatch.update({
    where: { id: matchId },
    data: { status: "IN_PROGRESS" },
  });

  // Get challenged user info with gamertags
  const challenged = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, psnUsername: true, xboxUsername: true, pcUsername: true },
  });

  // Build gamertag info for notification
  const tags: string[] = [];
  if (challenged?.psnUsername) tags.push(`PSN: ${challenged.psnUsername}`);
  if (challenged?.xboxUsername) tags.push(`Xbox: ${challenged.xboxUsername}`);
  if (challenged?.pcUsername) tags.push(`PC: ${challenged.pcUsername}`);
  const tagInfo = tags.length > 0 ? ` | ${tags.join(" · ")}` : "";

  await prisma.notification.create({
    data: {
      userId: match.challengerId,
      type: "CASUAL_CHALLENGE",
      title: "Desafío aceptado ✅",
      message: `${challenged?.username ?? "Tu rival"} aceptó el desafío. ¡A jugar!${tagInfo}`,
      relatedId: matchId,
    },
  });

  revalidatePath("/casual");
  revalidatePath(`/casual/${matchId}`);
  return { success: true };
}

export async function rejectChallenge(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };
  if (match.challengedId !== userId) return { error: "No sos el desafiado" };
  if (match.status !== "PENDING") return { error: "El desafío ya no está pendiente" };

  await prisma.casualMatch.update({
    where: { id: matchId },
    data: { status: "REJECTED" },
  });

  // Notify challenger about rejection
  const challenged = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  await prisma.notification.create({
    data: {
      userId: match.challengerId,
      type: "CASUAL_CHALLENGE",
      title: "Desafío rechazado ❌",
      message: `${challenged?.username ?? "Tu rival"} rechazó el desafío.`,
      relatedId: matchId,
    },
  });

  revalidatePath("/casual");
  return { success: true };
}

// ─── Cancelar (challenger cancela antes de que acepten) ─────

export async function cancelChallenge(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };
  if (match.challengerId !== userId) return { error: "No sos el retador" };
  if (match.status !== "PENDING") return { error: "Solo podés cancelar desafíos pendientes" };

  await prisma.casualMatch.update({
    where: { id: matchId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/casual");
  return { success: true };
}

// ─── Cargar resultado ───────────────────────────────────────

export async function submitCasualResult(
  matchId: string,
  resultChallenger: number,
  resultChallenged: number,
  proofImageUrl: string,
) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  if (!proofImageUrl) {
    return { error: "La foto de prueba es obligatoria." };
  }

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "IN_PROGRESS") return { error: "El partido no está en curso" };
  if (match.challengerId !== userId && match.challengedId !== userId) {
    return { error: "No participás en este partido" };
  }

  if (resultChallenger < 0 || resultChallenged < 0) {
    return { error: "Los goles no pueden ser negativos" };
  }

  if (resultChallenger > 99 || resultChallenged > 99) {
    return { error: "Resultado inválido" };
  }

  await prisma.casualMatch.update({
    where: { id: matchId },
    data: {
      resultChallenger,
      resultChallenged,
      proofImageUrl,
      status: "PENDING_CONFIRMATION",
    },
  });

  // Notify other player
  const otherPlayerId = match.challengerId === userId ? match.challengedId : match.challengerId;
  const submitter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  await prisma.notification.create({
    data: {
      userId: otherPlayerId,
      type: "CASUAL_RESULT",
      title: "Resultado cargado",
      message: `${submitter?.username ?? "Tu rival"} cargó el resultado: ${resultChallenger}-${resultChallenged}. Confirmalo.`,
      relatedId: matchId,
    },
  });

  revalidatePath(`/casual/${matchId}`);
  revalidatePath("/casual");
  return { success: true };
}

// ─── Confirmar resultado ────────────────────────────────────

export async function confirmCasualResult(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "PENDING_CONFIRMATION") return { error: "No hay resultado para confirmar" };
  if (match.challengerId !== userId && match.challengedId !== userId) {
    return { error: "No participás en este partido" };
  }

  const resultChallenger = match.resultChallenger!;
  const resultChallenged = match.resultChallenged!;

  // Determine winner
  let winnerId: string | null = null;
  let challengerPoints: number;
  let challengedPoints: number;

  if (resultChallenger > resultChallenged) {
    winnerId = match.challengerId;
    challengerPoints = RANKING.WIN;
    challengedPoints = RANKING.LOSS;
  } else if (resultChallenged > resultChallenger) {
    winnerId = match.challengedId;
    challengerPoints = RANKING.LOSS;
    challengedPoints = RANKING.WIN;
  } else {
    challengerPoints = RANKING.DRAW;
    challengedPoints = RANKING.DRAW;
  }

  // Transaction: update match + rankings + user points
  await prisma.$transaction(async (tx) => {
    // Finish match
    await tx.casualMatch.update({
      where: { id: matchId },
      data: {
        status: "FINISHED",
        winnerId,
        pointsAwarded: RANKING.WIN,
        confirmedAt: new Date(),
      },
    });

    // Update challenger ranking
    await tx.user.update({
      where: { id: match.challengerId },
      data: { rankingPoints: { increment: challengerPoints } },
    });

    await tx.rankingHistory.create({
      data: {
        userId: match.challengerId,
        casualMatchId: matchId,
        pointsChange: challengerPoints,
        reason: challengerPoints === RANKING.WIN
          ? "Victoria casual"
          : challengerPoints === RANKING.DRAW
            ? "Empate casual"
            : "Derrota casual",
      },
    });

    // Update challenged ranking
    await tx.user.update({
      where: { id: match.challengedId },
      data: { rankingPoints: { increment: challengedPoints } },
    });

    await tx.rankingHistory.create({
      data: {
        userId: match.challengedId,
        casualMatchId: matchId,
        pointsChange: challengedPoints,
        reason: challengedPoints === RANKING.WIN
          ? "Victoria casual"
          : challengedPoints === RANKING.DRAW
            ? "Empate casual"
            : "Derrota casual",
      },
    });
  });

  revalidatePath(`/casual/${matchId}`);
  revalidatePath("/casual");
  revalidatePath("/ranking");
  return { success: true };
}

// ─── Disputar resultado ─────────────────────────────────────

export async function disputeCasualResult(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "PENDING_CONFIRMATION") return { error: "No hay resultado para disputar" };
  if (match.challengerId !== userId && match.challengedId !== userId) {
    return { error: "No participás en este partido" };
  }

  await prisma.casualMatch.update({
    where: { id: matchId },
    data: {
      status: "DISPUTED",
      resultChallenger: null,
      resultChallenged: null,
    },
  });

  revalidatePath(`/casual/${matchId}`);
  revalidatePath("/casual");
  return { success: true, message: "Resultado disputado. El partido vuelve a estado pendiente de resultado." };
}

// ─── Queries ────────────────────────────────────────────────

export async function getMyMatches() {
  const userId = await getAuthUserId();
  if (!userId) return [];

  return prisma.casualMatch.findMany({
    where: {
      OR: [{ challengerId: userId }, { challengedId: userId }],
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
    include: {
      challenger: { select: { id: true, username: true, avatarUrl: true, rankingPoints: true } },
      challenged: { select: { id: true, username: true, avatarUrl: true, rankingPoints: true } },
      winner: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getCasualMatch(id: string) {
  return prisma.casualMatch.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, username: true, avatarUrl: true, rankingPoints: true } },
      challenged: { select: { id: true, username: true, avatarUrl: true, rankingPoints: true } },
      winner: { select: { id: true, username: true } },
    },
  });
}

export async function getChallengeDetail(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const match = await prisma.casualMatch.findUnique({
    where: { id: matchId },
    include: {
      challenger: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          rankingPoints: true,
          psnUsername: true,
          xboxUsername: true,
          pcUsername: true,
        },
      },
      challenged: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          rankingPoints: true,
          psnUsername: true,
          xboxUsername: true,
          pcUsername: true,
        },
      },
    },
  });

  if (!match) return null;
  if (match.challengerId !== userId && match.challengedId !== userId) return null;

  return match;
}

// ─── Chat del duelo ────────────────────────────────────────

export async function getMatchMessages(matchId: string) {
  return prisma.matchMessage.findMany({
    where: { casualMatchId: matchId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, role: true } },
    },
  });
}

export async function sendMatchMessage(matchId: string, text: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return { error: "Mensaje inválido" };

  const match = await prisma.casualMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };

  // Participants + admins can chat
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isParticipant = match.challengerId === userId || match.challengedId === userId;
  const isAdmin = user?.role === "ADMIN";
  if (!isParticipant && !isAdmin) return { error: "No participás en este partido" };

  await prisma.matchMessage.create({
    data: {
      casualMatchId: matchId,
      userId,
      message: trimmed,
    },
  });

  revalidatePath(`/casual/${matchId}`);
  return { success: true };
}

export async function invokeAdmin(matchId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const match = await prisma.casualMatch.findUnique({
    where: { id: matchId },
    include: {
      challenger: { select: { username: true } },
      challenged: { select: { username: true } },
    },
  });
  if (!match) return { error: "Partido no encontrado" };

  const isParticipant = match.challengerId === userId || match.challengedId === userId;
  if (!isParticipant) return { error: "No participás en este partido" };

  // Send notification to all admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return { error: "No hay admins disponibles" };

  const requester = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "ADMIN_MESSAGE" as const,
      title: "⚠️ Solicitud de intervención",
      message: `${requester?.username ?? "Un jugador"} solicita admin en duelo: ${match.challenger.username} vs ${match.challenged.username}`,
      relatedId: matchId,
      linkUrl: `/casual/${matchId}`,
    })),
  });

  revalidatePath(`/casual/${matchId}`);
  return { success: true, message: "Admin notificado. Pronto se sumará al chat." };
}

export async function searchPlayers(query: string) {
  if (!query || query.length < 2) return [];

  const userId = await getAuthUserId();

  return prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      ...(userId ? { id: { not: userId } } : {}),
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      rankingPoints: true,
      reputationPoints: true,
    },
    take: 10,
    orderBy: { rankingPoints: "desc" },
  });
}

// ─── Ranking queries ────────────────────────────────────────

interface RankingFilters {
  period?: "all" | "month" | "week";
  page?: number;
  limit?: number;
}

export async function getRanking({ period = "all", page = 1, limit = 50 }: RankingFilters = {}) {
  if (period === "all") {
    // Global ranking from user.rankingPoints
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        rankingPoints: true,
        reputationPoints: true,
      },
      where: {
        rankingPoints: { gt: 0 },
      },
      orderBy: { rankingPoints: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Get match stats for each user
    const enriched = await Promise.all(
      users.map(async (user) => {
        const [stats] = await prisma.$queryRaw<
          { played: number; won: number; drawn: number; lost: number; gf: number; gc: number }[]
        >`
          SELECT
            COALESCE(c.played, 0) + COALESCE(t.played, 0) as played,
            COALESCE(c.won, 0) + COALESCE(t.won, 0) as won,
            COALESCE(c.drawn, 0) + COALESCE(t.drawn, 0) as drawn,
            COALESCE(c.lost, 0) + COALESCE(t.lost, 0) as lost,
            COALESCE(c.gf, 0) + COALESCE(t.gf, 0) as gf,
            COALESCE(c.gc, 0) + COALESCE(t.gc, 0) as gc
          FROM (
            SELECT
              COUNT(*)::int as played,
              COUNT(*) FILTER (WHERE winner_id = ${user.id})::int as won,
              COUNT(*) FILTER (WHERE winner_id IS NULL AND status = 'FINISHED')::int as drawn,
              COUNT(*) FILTER (WHERE winner_id IS NOT NULL AND winner_id != ${user.id} AND status = 'FINISHED')::int as lost,
              COALESCE(SUM(CASE WHEN challenger_id = ${user.id} THEN result_challenger ELSE result_challenged END), 0)::int as gf,
              COALESCE(SUM(CASE WHEN challenger_id = ${user.id} THEN result_challenged ELSE result_challenger END), 0)::int as gc
            FROM casual_matches
            WHERE (challenger_id = ${user.id} OR challenged_id = ${user.id})
              AND status = 'FINISHED'
          ) c,
          (
            SELECT
              COUNT(*)::int as played,
              COUNT(*) FILTER (WHERE winner_id = ${user.id})::int as won,
              COUNT(*) FILTER (WHERE winner_id IS NULL AND status = 'FINISHED')::int as drawn,
              COUNT(*) FILTER (WHERE winner_id IS NOT NULL AND winner_id != ${user.id} AND status = 'FINISHED')::int as lost,
              COALESCE(SUM(CASE WHEN player1_id = ${user.id} THEN result_p1 ELSE result_p2 END), 0)::int as gf,
              COALESCE(SUM(CASE WHEN player1_id = ${user.id} THEN result_p2 ELSE result_p1 END), 0)::int as gc
            FROM tournament_matches
            WHERE (player1_id = ${user.id} OR player2_id = ${user.id})
              AND status = 'FINISHED'
          ) t
        `;

        return {
          ...user,
          played: stats?.played ?? 0,
          won: stats?.won ?? 0,
          drawn: stats?.drawn ?? 0,
          lost: stats?.lost ?? 0,
          goalsFor: stats?.gf ?? 0,
          goalsAgainst: stats?.gc ?? 0,
        };
      }),
    );

    return enriched;
  }

  // Period-based: aggregate from RankingHistory
  const dateFrom = new Date();
  if (period === "month") {
    dateFrom.setMonth(dateFrom.getMonth() - 1);
  } else {
    dateFrom.setDate(dateFrom.getDate() - 7);
  }

  const periodRanking = await prisma.rankingHistory.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: dateFrom },
    },
    _sum: {
      pointsChange: true,
    },
    orderBy: {
      _sum: { pointsChange: "desc" },
    },
    take: limit,
    skip: (page - 1) * limit,
  });

  const userIds = periodRanking.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      rankingPoints: true,
      reputationPoints: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return periodRanking
    .map((r) => {
      const user = userMap.get(r.userId);
      if (!user) return null;
      return {
        ...user,
        periodPoints: r._sum.pointsChange ?? 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };
    })
    .filter(Boolean);
}
