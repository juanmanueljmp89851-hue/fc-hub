"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PRODE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/actions/user";

// ─── Auth helper ────────────────────────────────────────────

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

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Crear Prode ────────────────────────────────────────────

interface CreateProdeInput {
  name: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  prizeGeneral?: string;
  prizePerWeek?: string;
  prizeGroupOrder?: string;
  prizeRounds?: string;
}

export async function createProde(input: CreateProdeInput) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  if (!input.name || input.name.length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres" };
  }

  // Generate unique share code
  let shareCode = generateShareCode();
  let attempts = 0;
  while (await prisma.prode.findUnique({ where: { shareCode } })) {
    shareCode = generateShareCode();
    attempts++;
    if (attempts > 10) return { error: "Error generando código. Intentá de nuevo." };
  }

  const prode = await prisma.prode.create({
    data: {
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      bannerUrl: input.bannerUrl,
      visibility: input.visibility ?? "PUBLIC",
      createdById: userId,
      shareCode,
      prizeGeneral: input.prizeGeneral,
      prizePerWeek: input.prizePerWeek,
      prizeGroupOrder: input.prizeGroupOrder,
      prizeRounds: input.prizeRounds,
    },
  });

  // Auto-join creator
  await prisma.prodeParticipant.create({
    data: { prodeId: prode.id, userId },
  });

  revalidatePath("/prode");
  return { success: true, prode };
}

// ─── Unirse via share code ──────────────────────────────────

export async function joinProdeByCode(shareCode: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const prode = await prisma.prode.findUnique({
    where: { shareCode },
  });

  if (!prode) return { error: "Prode no encontrado. Verificá el código." };
  if (prode.status === "FINISHED") return { error: "Este prode ya finalizó" };

  // Check if already joined
  const existing = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId: prode.id, userId } },
  });

  if (existing) return { error: "Ya estás participando en este prode", prodeId: prode.id };

  // Private prode → create join request instead of direct join
  if (prode.visibility === "PRIVATE") {
    const existingRequest = await prisma.prodeJoinRequest.findUnique({
      where: { prodeId_userId: { prodeId: prode.id, userId } },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return { error: "Ya tenés una solicitud pendiente para este prode", pending: true };
      }
      if (existingRequest.status === "REJECTED") {
        return { error: "Tu solicitud fue rechazada" };
      }
    }

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    await prisma.prodeJoinRequest.create({
      data: { prodeId: prode.id, userId },
    });

    // Notify prode creator about new join request
    await prisma.notification.create({
      data: {
        userId: prode.createdById,
        type: "PRODE_JOIN_REQUEST",
        title: "Nueva solicitud de unión",
        message: `${requester?.username ?? "Un usuario"} quiere unirse a tu prode "${prode.name}".`,
        relatedId: prode.id,
        linkUrl: `/prode/${prode.id}`,
      },
    });

    revalidatePath(`/prode/${prode.id}`);
    return { success: true, pending: true, prodeName: prode.name };
  }

  // Public prode → direct join
  await prisma.prodeParticipant.create({
    data: { prodeId: prode.id, userId },
  });

  revalidatePath(`/prode/${prode.id}`);
  return { success: true, prodeId: prode.id };
}

// ─── Inscribirse desde listado ──────────────────────────────

export async function requestJoinProde(prodeId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado", requireAuth: true };

  const prode = await prisma.prode.findUnique({
    where: { id: prodeId },
    select: { id: true, name: true, status: true, visibility: true, createdById: true, shareCode: true },
  });

  if (!prode) return { error: "Prode no encontrado" };
  if (prode.status === "FINISHED") return { error: "Este prode ya finalizó" };

  // Already joined?
  const existing = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (existing) return { error: "Ya estás participando en este prode", alreadyJoined: true };

  if (prode.visibility === "PRIVATE") {
    // Check existing request
    const existingRequest = await prisma.prodeJoinRequest.findUnique({
      where: { prodeId_userId: { prodeId, userId } },
    });
    if (existingRequest?.status === "PENDING") return { error: "Ya tenés una solicitud pendiente", pending: true };
    if (existingRequest?.status === "REJECTED") return { error: "Tu solicitud fue rechazada" };

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    await prisma.prodeJoinRequest.create({
      data: { prodeId, userId },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: prode.createdById,
        type: "PRODE_JOIN_REQUEST",
        title: "Nueva solicitud de unión",
        message: `${requester?.username ?? "Un usuario"} quiere unirse a tu prode "${prode.name}".`,
        relatedId: prodeId,
        linkUrl: `/prode/${prodeId}`,
      },
    });

    revalidatePath(`/prode/${prodeId}`);
    revalidatePath("/prode");
    return { success: true, pending: true, prodeName: prode.name };
  }

  // PUBLIC → direct join
  await prisma.prodeParticipant.create({
    data: { prodeId, userId },
  });

  revalidatePath(`/prode/${prodeId}`);
  revalidatePath("/prode");
  return { success: true, prodeId };
}

// ─── Queries ────────────────────────────────────────────────

/** All non-deleted prodes (for public listing) */
export async function getAllProdes() {
  const userId = await getAuthUserId();

  const prodes = await prisma.prode.findMany({
    where: { deletedAt: null },
    include: {
      createdBy: { select: { id: true, username: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Mark which prodes the current user already joined or has pending request
  if (!userId) return prodes.map((p) => ({ ...p, userStatus: "guest" as const }));

  const myParticipations = await prisma.prodeParticipant.findMany({
    where: { userId, prodeId: { in: prodes.map((p) => p.id) } },
    select: { prodeId: true },
  });
  const joinedSet = new Set(myParticipations.map((p) => p.prodeId));

  const myRequests = await prisma.prodeJoinRequest.findMany({
    where: { userId, prodeId: { in: prodes.map((p) => p.id) } },
    select: { prodeId: true, status: true },
  });
  const requestMap = new Map(myRequests.map((r) => [r.prodeId, r.status]));

  return prodes.map((p) => {
    let userStatus: "joined" | "pending" | "rejected" | "available" | "guest";
    if (joinedSet.has(p.id)) userStatus = "joined";
    else if (requestMap.get(p.id) === "PENDING") userStatus = "pending";
    else if (requestMap.get(p.id) === "REJECTED") userStatus = "rejected";
    else userStatus = "available";
    return { ...p, userStatus };
  });
}

export async function getMyProdes() {
  const userId = await getAuthUserId();
  if (!userId) return [];

  return prisma.prode.findMany({
    where: {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      createdBy: { select: { id: true, username: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProde(id: string) {
  return prisma.prode.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, username: true, avatarUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { joinRequests: true } },
    },
  });
}

// ─── EDITAR PRODE ──────────────────────────────────────────

export async function getProdeForEdit(prodeId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;

  const prode = await prisma.prode.findUnique({ where: { id: prodeId } });
  if (!prode) return null;

  if (prode.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return null;
  }

  return prode;
}

interface UpdateProdeInput {
  prodeId: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  visibility?: "PUBLIC" | "PRIVATE";
  prizeGeneral?: string;
  prizePerWeek?: string;
  prizeGroupOrder?: string;
  prizeRounds?: string;
}

export async function updateProde(input: UpdateProdeInput) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const prode = await prisma.prode.findUnique({
    where: { id: input.prodeId },
    select: { createdById: true },
  });
  if (!prode) return { error: "Prode no encontrado" };

  if (prode.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permisos para editar este prode" };
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl || null;
  if (input.bannerUrl !== undefined) data.bannerUrl = input.bannerUrl || null;
  if (input.prizeGeneral !== undefined) data.prizeGeneral = input.prizeGeneral?.trim() || null;
  if (input.prizePerWeek !== undefined) data.prizePerWeek = input.prizePerWeek?.trim() || null;
  if (input.prizeGroupOrder !== undefined) data.prizeGroupOrder = input.prizeGroupOrder?.trim() || null;
  if (input.prizeRounds !== undefined) data.prizeRounds = input.prizeRounds?.trim() || null;
  if (input.visibility !== undefined) data.visibility = input.visibility;

  await prisma.prode.update({
    where: { id: input.prodeId },
    data,
  });

  return { success: true };
}

export async function getProdeByShareCode(code: string) {
  return prisma.prode.findUnique({
    where: { shareCode: code },
    include: {
      createdBy: { select: { id: true, username: true } },
      _count: { select: { participants: true } },
    },
  });
}

// ─── Auto-transition week statuses ─────────────────────────

async function autoTransitionWeekStatuses() {
  const now = new Date();

  const weeks = await prisma.prodeWeek.findMany({
    where: { status: { in: ["UPCOMING", "OPEN"] } },
    include: { matches: { select: { matchDate: true, status: true }, orderBy: { matchDate: "asc" } } },
  });

  for (const week of weeks) {
    if (week.matches.length === 0) continue;

    const firstMatch = week.matches[0].matchDate;
    const allStarted = week.matches.every(
      (m) => now >= m.matchDate || m.status === "FINISHED" || m.status === "IN_PROGRESS",
    );

    if (week.status === "UPCOMING") {
      const openThreshold = new Date(firstMatch.getTime() - 48 * 60 * 60_000);
      if (now >= openThreshold) {
        await prisma.prodeWeek.update({ where: { id: week.id }, data: { status: "OPEN" } });
      }
    } else if (week.status === "OPEN" && allStarted) {
      await prisma.prodeWeek.update({ where: { id: week.id }, data: { status: "CLOSED" } });
    }
  }
}

// ─── Prode weeks (global, shared) ───────────────────────────

export async function getProdeWeeks() {
  await autoTransitionWeekStatuses();
  return prisma.prodeWeek.findMany({
    orderBy: { deadline: "asc" },
    include: {
      _count: { select: { matches: true } },
    },
  });
}

export async function getProdeWeek(weekId: string) {
  return prisma.prodeWeek.findUnique({
    where: { id: weekId },
    include: {
      matches: {
        orderBy: { matchDate: "asc" },
      },
    },
  });
}

export async function getActiveWeek() {
  await autoTransitionWeekStatuses();
  let week = await prisma.prodeWeek.findFirst({
    where: { status: "OPEN" },
    orderBy: { deadline: "asc" },
    include: { _count: { select: { matches: true } } },
  });

  if (!week) {
    week = await prisma.prodeWeek.findFirst({
      where: { status: "UPCOMING" },
      orderBy: { deadline: "asc" },
      include: { _count: { select: { matches: true } } },
    });
  }

  if (!week) {
    week = await prisma.prodeWeek.findFirst({
      where: { status: "SCORED" },
      orderBy: { deadline: "desc" },
      include: { _count: { select: { matches: true } } },
    });
  }

  return week;
}

// ─── Predictions per prode ──────────────────────────────────

export async function getUserPredictions(prodeId: string, weekId: string) {
  const userId = await getAuthUserId();
  if (!userId) return [];

  return prisma.prodePrediction.findMany({
    where: {
      prodeId,
      userId,
      match: { weekId },
    },
    include: {
      match: true,
    },
  });
}

export async function getAllPredictionsForWeek(prodeId: string, weekId: string) {
  const userId = await getAuthUserId();
  if (!userId) return [];

  // Verify caller is participant
  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return [];

  return prisma.prodePrediction.findMany({
    where: {
      prodeId,
      match: { weekId },
    },
    select: {
      matchId: true,
      predHomeScore: true,
      predAwayScore: true,
      predExtraTime: true,
      predPenalties: true,
      predWinner: true,
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
}

export async function savePredictions(
  prodeId: string,
  weekId: string,
  predictions: {
    matchId: string;
    predHomeScore: number;
    predAwayScore: number;
    predExtraTime?: boolean;
    predPenalties?: boolean;
    predWinner?: string;
  }[],
) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  // Verify participant
  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return { error: "No participás en este prode" };

  // Fetch week + matches for validation
  const week = await prisma.prodeWeek.findUnique({
    where: { id: weekId },
    select: { status: true, deadline: true, title: true },
  });
  if (!week) return { error: "Fecha no encontrada" };

  // Allow editing until each match starts (per-match lock for all weeks)
  // Only block if week is fully scored
  if (week.status === "SCORED") {
    return { error: "Las predicciones están cerradas para esta fecha" };
  }

  // Validate scores
  for (const pred of predictions) {
    if (pred.predHomeScore < 0 || pred.predAwayScore < 0) return { error: "Goles negativos inválidos" };
    if (pred.predHomeScore > 20 || pred.predAwayScore > 20) return { error: "Resultado inválido" };
  }

  // Verify matches belong to week + filter out locked matches
  const weekMatches = await prisma.prodeMatch.findMany({
    where: { weekId },
    select: { id: true, matchDate: true, status: true },
  });
  const matchMap = new Map(weekMatches.map((m) => [m.id, m]));
  const now = new Date();

  const validPredictions = predictions.filter((pred) => {
    const match = matchMap.get(pred.matchId);
    if (!match) return false;
    if (match.status === "FINISHED" || match.status === "IN_PROGRESS") return false;
    const cutoff = new Date(match.matchDate.getTime() - 60_000);
    if (now >= cutoff) return false;
    return true;
  });

  if (validPredictions.length === 0) {
    return { error: "Todos los partidos ya empezaron o están cerrados" };
  }

  // Upsert only valid predictions
  await prisma.$transaction(
    validPredictions.map((pred) =>
      prisma.prodePrediction.upsert({
        where: {
          prodeId_userId_matchId: { prodeId, userId, matchId: pred.matchId },
        },
        update: {
          predHomeScore: pred.predHomeScore,
          predAwayScore: pred.predAwayScore,
          predExtraTime: pred.predExtraTime ?? null,
          predPenalties: pred.predPenalties ?? null,
          predWinner: pred.predWinner ?? null,
        },
        create: {
          prodeId,
          userId,
          matchId: pred.matchId,
          predHomeScore: pred.predHomeScore,
          predAwayScore: pred.predAwayScore,
          predExtraTime: pred.predExtraTime ?? null,
          predPenalties: pred.predPenalties ?? null,
          predWinner: pred.predWinner ?? null,
        },
      }),
    ),
  );

  const skipped = predictions.length - validPredictions.length;

  revalidatePath(`/prode/${prodeId}`);
  return { success: true, saved: validPredictions.length, skipped };
}

// ─── Group predictions ──────────────────────────────────────

interface GroupPredInput {
  groupName: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
}

export async function saveGroupPredictions(prodeId: string, groups: GroupPredInput[]) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return { error: "No participás en este prode" };

  await prisma.$transaction(
    groups.map((g) =>
      prisma.prodeGroupPrediction.upsert({
        where: {
          prodeId_userId_groupName: { prodeId, userId, groupName: g.groupName },
        },
        update: {
          first: g.first,
          second: g.second,
          third: g.third,
          fourth: g.fourth,
        },
        create: {
          prodeId,
          userId,
          groupName: g.groupName,
          first: g.first,
          second: g.second,
          third: g.third,
          fourth: g.fourth,
        },
      }),
    ),
  );

  revalidatePath(`/prode/${prodeId}`);
  return { success: true };
}

export async function getUserGroupPredictions(prodeId: string) {
  const userId = await getAuthUserId();
  if (!userId) return [];

  return prisma.prodeGroupPrediction.findMany({
    where: { prodeId, userId },
    orderBy: { groupName: "asc" },
  });
}

export async function getAllGroupPredictionsForProde(prodeId: string) {
  const [predictions, participants, matchPredictions] = await Promise.all([
    prisma.prodeGroupPrediction.findMany({
      where: { prodeId },
      include: {
        user: { select: { username: true, avatarUrl: true } },
      },
      orderBy: [{ groupName: "asc" }, { pointsEarned: "desc" }],
    }),
    prisma.prodeParticipant.findMany({
      where: { prodeId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    }),
    prisma.prodePrediction.findMany({
      where: { prodeId, match: { group: { not: null } } },
      include: {
        match: { select: { homeTeam: true, awayTeam: true, group: true } },
      },
    }),
  ]);

  type Entry = {
    userId: string;
    username: string;
    avatarUrl: string | null;
    first: string | null;
    second: string | null;
    third: string | null;
    fourth: string | null;
    pointsEarned: number;
    simulated?: boolean;
  };

  // Build simulated group order per user from match predictions
  function simulateForUser(userId: string) {
    const userPreds = matchPredictions.filter((p) => p.userId === userId);
    if (userPreds.length === 0) return null;

    const groups: Record<string, Record<string, { pts: number; gd: number; gf: number }>> = {};
    for (const pred of userPreds) {
      const g = pred.match.group!;
      if (!groups[g]) groups[g] = {};
      const home = pred.match.homeTeam;
      const away = pred.match.awayTeam;
      if (!groups[g][home]) groups[g][home] = { pts: 0, gd: 0, gf: 0 };
      if (!groups[g][away]) groups[g][away] = { pts: 0, gd: 0, gf: 0 };

      const h = pred.predHomeScore;
      const a = pred.predAwayScore;
      groups[g][home].gf += h;
      groups[g][home].gd += h - a;
      groups[g][away].gf += a;
      groups[g][away].gd += a - h;

      if (h > a) groups[g][home].pts += 3;
      else if (h < a) groups[g][away].pts += 3;
      else { groups[g][home].pts += 1; groups[g][away].pts += 1; }
    }

    const result: Record<string, { first: string; second: string; third: string; fourth: string }> = {};
    for (const [g, teams] of Object.entries(groups)) {
      const sorted = Object.entries(teams)
        .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
        .map(([name]) => name);
      if (sorted.length >= 4) {
        result[g] = { first: sorted[0], second: sorted[1], third: sorted[2], fourth: sorted[3] };
      }
    }
    return result;
  }

  const byGroup: Record<string, Entry[]> = {};

  const groupNames = new Set(predictions.map((p) => p.groupName));

  for (const g of groupNames) {
    const groupPreds = predictions.filter((p) => p.groupName === g);
    const predUserIds = new Set(groupPreds.map((p) => p.userId));

    const entries: Entry[] = [];

    for (const p of groupPreds) {
      entries.push({
        userId: p.userId,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl,
        first: p.first,
        second: p.second,
        third: p.third,
        fourth: p.fourth,
        pointsEarned: p.pointsEarned,
      });
    }

    for (const part of participants) {
      if (!predUserIds.has(part.user.id)) {
        const simulated = simulateForUser(part.user.id);
        const sim = simulated?.[g];
        entries.push({
          userId: part.user.id,
          username: part.user.username,
          avatarUrl: part.user.avatarUrl,
          first: sim?.first ?? null,
          second: sim?.second ?? null,
          third: sim?.third ?? null,
          fourth: sim?.fourth ?? null,
          pointsEarned: 0,
          simulated: !!sim,
        });
      }
    }

    byGroup[g] = entries;
  }

  return byGroup;
}

export async function getRealGroupStandings() {
  const weeks = await prisma.prodeWeek.findMany({
    where: { title: { contains: "Fase de Grupos" } },
    include: {
      matches: {
        where: { status: "FINISHED", group: { not: null } },
        select: { homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, group: true },
      },
    },
  });

  const standings: Record<string, Record<string, { pts: number; gd: number; gf: number }>> = {};
  for (const w of weeks) {
    for (const m of w.matches) {
      if (m.homeScore === null || m.awayScore === null || !m.group) continue;
      if (!standings[m.group]) standings[m.group] = {};
      const s = standings[m.group];
      if (!s[m.homeTeam]) s[m.homeTeam] = { pts: 0, gd: 0, gf: 0 };
      if (!s[m.awayTeam]) s[m.awayTeam] = { pts: 0, gd: 0, gf: 0 };

      s[m.homeTeam].gf += m.homeScore;
      s[m.homeTeam].gd += m.homeScore - m.awayScore;
      s[m.awayTeam].gf += m.awayScore;
      s[m.awayTeam].gd += m.awayScore - m.homeScore;

      if (m.homeScore > m.awayScore) {
        s[m.homeTeam].pts += 3;
      } else if (m.homeScore < m.awayScore) {
        s[m.awayTeam].pts += 3;
      } else {
        s[m.homeTeam].pts += 1;
        s[m.awayTeam].pts += 1;
      }
    }
  }

  const result: Record<string, { first: string; second: string; third: string; fourth: string }> = {};
  for (const [g, teams] of Object.entries(standings)) {
    const sorted = Object.entries(teams)
      .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map(([name]) => name);
    if (sorted.length >= 4) {
      result[g] = { first: sorted[0], second: sorted[1], third: sorted[2], fourth: sorted[3] };
    }
  }

  return result;
}

export async function getSimulatedGroupOrder(prodeId: string) {
  const userId = await getAuthUserId();
  if (!userId) return null;

  // Get user's match predictions for group stage
  const preds = await prisma.prodePrediction.findMany({
    where: {
      prodeId,
      userId,
      match: { group: { not: null } },
    },
    include: {
      match: { select: { homeTeam: true, awayTeam: true, group: true } },
    },
  });

  if (preds.length === 0) return null;

  // Build simulated standings per group
  const groups: Record<string, Record<string, { pts: number; gf: number; ga: number; gd: number }>> = {};

  for (const pred of preds) {
    const g = pred.match.group!;
    if (!groups[g]) groups[g] = {};

    const home = pred.match.homeTeam;
    const away = pred.match.awayTeam;
    if (!groups[g][home]) groups[g][home] = { pts: 0, gf: 0, ga: 0, gd: 0 };
    if (!groups[g][away]) groups[g][away] = { pts: 0, gf: 0, ga: 0, gd: 0 };

    const h = pred.predHomeScore;
    const a = pred.predAwayScore;
    groups[g][home].gf += h;
    groups[g][home].ga += a;
    groups[g][home].gd += h - a;
    groups[g][away].gf += a;
    groups[g][away].ga += h;
    groups[g][away].gd += a - h;

    if (h > a) {
      groups[g][home].pts += 3;
    } else if (h < a) {
      groups[g][away].pts += 3;
    } else {
      groups[g][home].pts += 1;
      groups[g][away].pts += 1;
    }
  }

  // Sort each group: pts desc, gd desc, gf desc
  const result: Record<string, { first: string; second: string; third: string; fourth: string }> = {};
  for (const [g, teams] of Object.entries(groups)) {
    const sorted = Object.entries(teams)
      .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map(([name]) => name);
    if (sorted.length >= 4) {
      result[g] = { first: sorted[0], second: sorted[1], third: sorted[2], fourth: sorted[3] };
    }
  }

  return result;
}

// ─── Advance predictions ────────────────────────────────────

interface AdvancePredInput {
  round: string;
  teams: string[];
}

// Round unlock logic: which weeks must be SCORED for each round to open
const ROUND_UNLOCK_MAP: Record<string, { requiredWeekPattern: string; prevRound?: string }> = {
  ROUND_32: { requiredWeekPattern: "" },  // Always open
  ROUND_16: { requiredWeekPattern: "fase de grupos", prevRound: "ROUND_32" },
  QUARTERS: { requiredWeekPattern: "octavos", prevRound: "ROUND_16" },
  SEMIS:    { requiredWeekPattern: "cuartos", prevRound: "QUARTERS" },
  FINAL:    { requiredWeekPattern: "semifinales", prevRound: "SEMIS" },
  CHAMPION: { requiredWeekPattern: "semifinales", prevRound: "FINAL" },
};

/** Get which rounds are open for advance predictions */
export async function getAdvanceRoundStatus(): Promise<Record<string, boolean>> {
  const weeks = await prisma.prodeWeek.findMany({
    select: { title: true, status: true },
  });

  function allWeeksScored(pattern: string): boolean {
    if (!pattern) return true;
    const matching = weeks.filter((w) => w.title.toLowerCase().includes(pattern));
    return matching.length > 0 && matching.every((w) => w.status === "SCORED");
  }

  const status: Record<string, boolean> = {};
  for (const [round, config] of Object.entries(ROUND_UNLOCK_MAP)) {
    status[round] = allWeeksScored(config.requiredWeekPattern);
  }
  return status;
}

/** Get actual teams that advanced (from finished matches) */
export async function getAdvancedTeams(): Promise<Record<string, string[]>> {
  const weeks = await prisma.prodeWeek.findMany({
    include: {
      matches: {
        where: { status: "FINISHED" },
        select: { homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, group: true },
      },
    },
  });

  const result: Record<string, string[]> = {};

  // Group stage results → teams that qualified (top 2 per group)
  const groupWeeks = weeks.filter((w) => w.title.toLowerCase().includes("fase de grupos"));
  if (groupWeeks.every((w) => w.matches.length > 0)) {
    // Tally group standings from finished matches
    const standings: Record<string, Record<string, { pts: number; gd: number }>> = {};
    for (const w of groupWeeks) {
      for (const m of w.matches) {
        if (!m.group || m.homeScore === null || m.awayScore === null) continue;
        if (!standings[m.group]) standings[m.group] = {};
        const s = standings[m.group];
        if (!s[m.homeTeam]) s[m.homeTeam] = { pts: 0, gd: 0 };
        if (!s[m.awayTeam]) s[m.awayTeam] = { pts: 0, gd: 0 };

        if (m.homeScore > m.awayScore) {
          s[m.homeTeam].pts += 3;
        } else if (m.homeScore < m.awayScore) {
          s[m.awayTeam].pts += 3;
        } else {
          s[m.homeTeam].pts += 1;
          s[m.awayTeam].pts += 1;
        }
        s[m.homeTeam].gd += m.homeScore - m.awayScore;
        s[m.awayTeam].gd += m.awayScore - m.homeScore;
      }
    }

    // Top 2 per group
    const qualified: string[] = [];
    for (const [, teams] of Object.entries(standings)) {
      const sorted = Object.entries(teams)
        .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd)
        .slice(0, 2)
        .map(([name]) => name);
      qualified.push(...sorted);
    }
    if (qualified.length > 0) result.ROUND_32 = qualified;
  }

  // Knockout stage results
  const knockoutMap: Record<string, string> = {
    "octavos": "ROUND_16",
    "cuartos": "QUARTERS",
    "semifinales": "SEMIS",
    "final": "CHAMPION",
  };

  for (const [pattern, roundKey] of Object.entries(knockoutMap)) {
    const matchingWeeks = weeks.filter((w) => w.title.toLowerCase().includes(pattern));
    const winners: string[] = [];
    for (const w of matchingWeeks) {
      for (const m of w.matches) {
        if (m.homeScore === null || m.awayScore === null) continue;
        winners.push(m.homeScore > m.awayScore ? m.homeTeam : m.awayTeam);
      }
    }
    if (winners.length > 0) result[roundKey] = winners;
  }

  return result;
}

export async function saveAdvancePredictions(prodeId: string, rounds: AdvancePredInput[]) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return { error: "No participás en este prode" };

  // Validate: only save rounds that are currently open
  const roundStatus = await getAdvanceRoundStatus();
  for (const r of rounds) {
    if (!roundStatus[r.round]) {
      return { error: `La ronda "${r.round}" aún no está habilitada` };
    }
  }

  await prisma.$transaction(
    rounds.map((r) =>
      prisma.prodeAdvancePrediction.upsert({
        where: {
          prodeId_userId_round: { prodeId, userId, round: r.round },
        },
        update: { teams: r.teams },
        create: {
          prodeId,
          userId,
          round: r.round,
          teams: r.teams,
        },
      }),
    ),
  );

  revalidatePath(`/prode/${prodeId}`);
  return { success: true };
}

export async function getUserAdvancePredictions(prodeId: string) {
  const userId = await getAuthUserId();
  if (!userId) return [];

  return prisma.prodeAdvancePrediction.findMany({
    where: { prodeId, userId },
    orderBy: { round: "asc" },
  });
}

// ─── Leaderboard per prode ──────────────────────────────────

export async function getProdeLeaderboard(prodeId: string) {
  // Sum points from all 3 prediction types
  const participants = await prisma.prodeParticipant.findMany({
    where: { prodeId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  const userIds = participants.map((p) => p.userId);

  // Match predictions points
  const matchPoints = await prisma.prodePrediction.groupBy({
    by: ["userId"],
    where: { prodeId, userId: { in: userIds } },
    _sum: { pointsEarned: true },
    _count: { id: true },
  });
  const matchMap = new Map(matchPoints.map((m) => [m.userId, { sum: m._sum.pointsEarned ?? 0, count: m._count.id }]));

  // Advance predictions points
  const advancePoints = await prisma.prodeAdvancePrediction.groupBy({
    by: ["userId"],
    where: { prodeId, userId: { in: userIds } },
    _sum: { pointsEarned: true },
  });
  const advanceMap = new Map(advancePoints.map((a) => [a.userId, a._sum.pointsEarned ?? 0]));

  // Count exact predictions
  const exactCounts = await prisma.prodePrediction.groupBy({
    by: ["userId"],
    where: { prodeId, userId: { in: userIds }, pointsEarned: PRODE.EXACT_RESULT },
    _count: { id: true },
  });
  const exactMap = new Map(exactCounts.map((e) => [e.userId, e._count.id]));

  const leaderboard = participants.map((p) => {
    const mp = matchMap.get(p.userId);
    const ap = advanceMap.get(p.userId) ?? 0;
    const total = (mp?.sum ?? 0) + ap;

    return {
      userId: p.userId,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl,
      totalPoints: total,
      matchPoints: mp?.sum ?? 0,
      groupPoints: 0,
      advancePoints: ap,
      predictions: mp?.count ?? 0,
      exactResults: exactMap.get(p.userId) ?? 0,
    };
  });

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  return leaderboard;
}

// ─── Admin/Creator: Score week ──────────────────────────────

export async function scoreProdeWeek(
  weekId: string,
  results: {
    matchId: string;
    homeScore: number;
    awayScore: number;
    extraTime?: boolean;
    penalties?: boolean;
    winnerTeam?: string;
  }[],
) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return { error: "Solo admins pueden puntuar" };

  await prisma.$transaction(async (tx) => {
    for (const result of results) {
      const match = await tx.prodeMatch.findUnique({
        where: { id: result.matchId },
        select: { group: true },
      });
      const isKnockout = !match?.group;

      await tx.prodeMatch.update({
        where: { id: result.matchId },
        data: {
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "FINISHED",
          ...(isKnockout && {
            extraTime: result.extraTime ?? false,
            penalties: result.penalties ?? false,
            winnerTeam: result.winnerTeam ?? null,
          }),
        },
      });

      const predictions = await tx.prodePrediction.findMany({
        where: { matchId: result.matchId },
      });

      for (const pred of predictions) {
        let points: number = PRODE.INCORRECT;

        if (pred.predHomeScore === result.homeScore && pred.predAwayScore === result.awayScore) {
          points = PRODE.EXACT_RESULT;
        } else {
          const realOutcome = result.homeScore > result.awayScore ? "H" : result.homeScore < result.awayScore ? "A" : "D";
          const predOutcome = pred.predHomeScore > pred.predAwayScore ? "H" : pred.predHomeScore < pred.predAwayScore ? "A" : "D";
          if (realOutcome === predOutcome) points = PRODE.CORRECT_WINNER;
        }

        if (isKnockout) {
          if (pred.predExtraTime !== null && pred.predExtraTime === (result.extraTime ?? false)) {
            points += PRODE.KNOCKOUT_EXTRA_TIME;
          }
          if (pred.predPenalties !== null && pred.predPenalties === (result.penalties ?? false)) {
            points += PRODE.KNOCKOUT_PENALTIES;
          }
          if (pred.predWinner && result.winnerTeam && pred.predWinner === result.winnerTeam) {
            points += PRODE.KNOCKOUT_WINNER;
          }
        }

        await tx.prodePrediction.update({
          where: { id: pred.id },
          data: { pointsEarned: points },
        });
      }
    }

    await tx.prodeWeek.update({
      where: { id: weekId },
      data: { status: "SCORED" },
    });
  });

  revalidatePath("/prode");
  return { success: true };
}

// ─── Admin: Score group predictions ─────────────────────────

export async function scoreGroupPredictions(
  groupName: string,
  realOrder: { first: string; second: string; third: string; fourth: string },
) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return { error: "Solo admins pueden puntuar" };

  const predictions = await prisma.prodeGroupPrediction.findMany({
    where: { groupName },
  });

  await prisma.$transaction(
    predictions.map((pred) => {
      let correct = 0;
      if (pred.first === realOrder.first) correct++;
      if (pred.second === realOrder.second) correct++;
      if (pred.third === realOrder.third) correct++;
      if (pred.fourth === realOrder.fourth) correct++;

      let points = 0;
      if (correct === 4) points = PRODE.GROUP_ALL_4_CORRECT;
      else if (correct === 3) points = PRODE.GROUP_3_CORRECT;
      else if (correct === 2) points = PRODE.GROUP_2_CORRECT;
      else if (correct === 1) points = PRODE.GROUP_1_CORRECT;

      return prisma.prodeGroupPrediction.update({
        where: { id: pred.id },
        data: { pointsEarned: points },
      });
    }),
  );

  revalidatePath("/prode");
  return { success: true };
}

// ─── Admin: Open/Close weeks ────────────────────────────────

export async function openProdeWeek(weekId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  await prisma.prodeWeek.update({ where: { id: weekId }, data: { status: "OPEN" } });
  revalidatePath("/prode");
  return { success: true };
}

export async function closeProdeWeek(weekId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  await prisma.prodeWeek.update({ where: { id: weekId }, data: { status: "CLOSED" } });
  revalidatePath("/prode");
  return { success: true };
}

// ─── SOFT DELETE / RESTORE ─────────────────────────────────

export async function softDeleteProde(prodeId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("No autenticado");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser) throw new Error("No autenticado");

  const prode = await prisma.prode.findUnique({
    where: { id: prodeId },
    select: { createdById: true, deletedAt: true },
  });
  if (!prode) throw new Error("Prode no encontrado");
  if (prode.deletedAt) throw new Error("Ya está eliminado");
  if (prode.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  await prisma.prode.update({
    where: { id: prodeId },
    data: { deletedAt: new Date(), deletedById: dbUser.id },
  });

  revalidatePath("/prode");
  revalidatePath(`/prode/${prodeId}`);
  return { success: true };
}

export async function restoreProde(prodeId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("No autenticado");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Solo admin puede restaurar");

  await prisma.prode.update({
    where: { id: prodeId },
    data: { deletedAt: null, deletedById: null },
  });

  revalidatePath("/prode");
  revalidatePath("/admin/moderacion");
  return { success: true };
}

// ─── JOIN REQUESTS (Private prodes) ───────────────────────

export async function getJoinRequests(prodeId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return [];

  const prode = await prisma.prode.findUnique({
    where: { id: prodeId },
    select: { createdById: true },
  });
  if (!prode) return [];

  // Only creator or ADMIN can see requests
  if (prode.createdById !== dbUser.id && dbUser.role !== "ADMIN") return [];

  return prisma.prodeJoinRequest.findMany({
    where: { prodeId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      resolvedBy: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveJoinRequest(
  requestId: string,
  action: "ACCEPTED" | "REJECTED",
) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const request = await prisma.prodeJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      prode: { select: { createdById: true, id: true, name: true, createdBy: { select: { username: true } } } },
    },
  });
  if (!request) return { error: "Solicitud no encontrada" };

  // Only creator, prode ADMIN, or site ADMIN
  const isProdeAdmin = await prisma.prodeParticipant.findFirst({
    where: { prodeId: request.prodeId, userId: dbUser.id, role: "ADMIN" },
  });
  if (request.prode.createdById !== dbUser.id && !isProdeAdmin && dbUser.role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  if (request.status !== "PENDING") {
    return { error: "Solicitud ya fue resuelta" };
  }

  await prisma.prodeJoinRequest.update({
    where: { id: requestId },
    data: {
      status: action,
      resolvedAt: new Date(),
      resolvedById: dbUser.id,
    },
  });

  // If accepted, add as participant
  if (action === "ACCEPTED") {
    await prisma.prodeParticipant.upsert({
      where: { prodeId_userId: { prodeId: request.prodeId, userId: request.userId } },
      update: {},
      create: { prodeId: request.prodeId, userId: request.userId },
    });
  }

  // Notify the requester about the decision
  const prodeName = request.prode.name;
  const creatorUsername = request.prode.createdBy?.username ?? "el creador";
  const notifType = action === "ACCEPTED" ? "PRODE_JOIN_ACCEPTED" : "PRODE_JOIN_REJECTED";
  const notifTitle = action === "ACCEPTED"
    ? "¡Te aceptaron en un prode!"
    : "Solicitud rechazada";
  const notifMessage = action === "ACCEPTED"
    ? `Se aceptó tu solicitud al prode "${prodeName}". ¡Ya podés participar!`
    : `Se rechazó tu solicitud al prode "${prodeName}". Si tenés dudas, contactá a ${creatorUsername}.`;

  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: notifType as import("@prisma/client").NotificationType,
      title: notifTitle,
      message: notifMessage,
      relatedId: request.prodeId,
      linkUrl: action === "ACCEPTED" ? `/prode/${request.prodeId}` : "/prode",
    },
  });

  revalidatePath(`/prode/${request.prodeId}`);
  return { success: true };
}

// ─── PRODE CHAT ───────────────────────────────────────────

export async function getProdeMessages(prodeId: string, cursor?: string) {
  const userId = await getAuthUserId();
  if (!userId) return { messages: [], hasMore: false };

  // Verify participant
  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return { messages: [], hasMore: false };

  const take = 50;
  const messages = await prisma.prodeMessage.findMany({
    where: {
      prodeId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
  });

  const hasMore = messages.length > take;
  if (hasMore) messages.pop();

  return { messages: messages.reverse(), hasMore };
}

export async function getNewProdeMessages(prodeId: string, after: string) {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return [];

  return prisma.prodeMessage.findMany({
    where: {
      prodeId,
      createdAt: { gt: new Date(after) },
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function sendProdeMessage(prodeId: string, text: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return { error: "Mensaje inválido" };

  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) return { error: "No participás en este prode" };

  const msg = await prisma.prodeMessage.create({
    data: { prodeId, userId, text: trimmed },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return { success: true, message: msg };
}

// ─── DETAILED LEADERBOARD (per-week breakdown) ────────────

export async function getProdeLeaderboardDetailed(prodeId: string) {
  const participants = await prisma.prodeParticipant.findMany({
    where: { prodeId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  const userIds = participants.map((p) => p.userId);

  // Get all scored weeks
  const weeks = await prisma.prodeWeek.findMany({
    where: { status: "SCORED" },
    orderBy: { deadline: "asc" },
    select: { id: true, title: true },
  });

  // Match predictions per week per user
  const allPredictions = await prisma.prodePrediction.findMany({
    where: { prodeId, userId: { in: userIds } },
    include: { match: { select: { weekId: true } } },
  });

  // Build per-user per-week points
  const weeklyPoints: Record<string, Record<string, number>> = {};
  for (const pred of allPredictions) {
    const uid = pred.userId;
    const wid = pred.match.weekId;
    if (!weeklyPoints[uid]) weeklyPoints[uid] = {};
    weeklyPoints[uid][wid] = (weeklyPoints[uid][wid] ?? 0) + pred.pointsEarned;
  }

  // Advance totals
  const advancePoints = await prisma.prodeAdvancePrediction.groupBy({
    by: ["userId"],
    where: { prodeId, userId: { in: userIds } },
    _sum: { pointsEarned: true },
  });
  const advanceMap = new Map(advancePoints.map((a) => [a.userId, a._sum.pointsEarned ?? 0]));

  // Exact counts
  const exactCounts = await prisma.prodePrediction.groupBy({
    by: ["userId"],
    where: { prodeId, userId: { in: userIds }, pointsEarned: PRODE.EXACT_RESULT },
    _count: { id: true },
  });
  const exactMap = new Map(exactCounts.map((e) => [e.userId, e._count.id]));

  const leaderboard = participants.map((p) => {
    const wp = weeklyPoints[p.userId] ?? {};
    const matchTotal = Object.values(wp).reduce((a, b) => a + b, 0);
    const ap = advanceMap.get(p.userId) ?? 0;

    return {
      userId: p.userId,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl,
      totalPoints: matchTotal + ap,
      matchPoints: matchTotal,
      groupPoints: 0,
      advancePoints: ap,
      exactResults: exactMap.get(p.userId) ?? 0,
      weeklyPoints: wp,
    };
  });

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  return { leaderboard, weeks };
}

// ─── PRODE ADMIN ROLE ─────────────────────────────────────

export async function setParticipantRole(
  prodeId: string,
  targetUserId: string,
  role: "ADMIN" | "MEMBER",
) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return { error: "Usuario no encontrado" };

  // Only prode creator or site ADMIN can promote/demote
  const prode = await prisma.prode.findUnique({
    where: { id: prodeId },
    select: { createdById: true },
  });
  if (!prode) return { error: "Prode no encontrado" };

  if (dbUser.id !== prode.createdById && dbUser.role !== "ADMIN") {
    return { error: "Solo el creador puede cambiar roles" };
  }

  // Can't change own role or creator's role
  if (targetUserId === prode.createdById) {
    return { error: "No se puede cambiar el rol del creador" };
  }

  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId: targetUserId } },
  });
  if (!participant) return { error: "No es participante" };

  await prisma.prodeParticipant.update({
    where: { id: participant.id },
    data: { role },
  });

  return { success: true };
}
