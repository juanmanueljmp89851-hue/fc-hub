"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PRODE } from "@/lib/constants";

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

  await prisma.prodeParticipant.create({
    data: { prodeId: prode.id, userId },
  });

  revalidatePath(`/prode/${prode.id}`);
  return { success: true, prodeId: prode.id };
}

// ─── Queries ────────────────────────────────────────────────

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

// ─── Prode weeks (global, shared) ───────────────────────────

export async function getProdeWeeks() {
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

export async function savePredictions(
  prodeId: string,
  weekId: string,
  predictions: { matchId: string; predHomeScore: number; predAwayScore: number }[],
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

  // Determine if this is a group stage week
  const isGroupStage = week.title.toLowerCase().includes("fase de grupos");

  // For group stage: allow editing until each match starts (per-match lock)
  // For knockout: use traditional week status check
  if (!isGroupStage) {
    if (week.status !== "OPEN") return { error: "Las predicciones están cerradas para esta fecha" };
    if (new Date() > week.deadline) return { error: "Se pasó la fecha límite" };
  }

  // Validate scores
  for (const pred of predictions) {
    if (pred.predHomeScore < 0 || pred.predAwayScore < 0) return { error: "Goles negativos inválidos" };
    if (pred.predHomeScore > 20 || pred.predAwayScore > 20) return { error: "Resultado inválido" };
  }

  // Verify matches belong to week + per-match time check for group stage
  const weekMatches = await prisma.prodeMatch.findMany({
    where: { weekId },
    select: { id: true, matchDate: true, status: true },
  });
  const matchMap = new Map(weekMatches.map((m) => [m.id, m]));
  const now = new Date();

  for (const pred of predictions) {
    const match = matchMap.get(pred.matchId);
    if (!match) return { error: "Partido no pertenece a esta fecha" };

    // For group stage: block if match already started
    if (isGroupStage) {
      if (match.status === "FINISHED" || match.status === "IN_PROGRESS") {
        return { error: "No podés predecir partidos que ya empezaron" };
      }
      if (now >= match.matchDate) {
        return { error: "No podés predecir partidos que ya empezaron" };
      }
    }
  }

  // Upsert
  await prisma.$transaction(
    predictions.map((pred) =>
      prisma.prodePrediction.upsert({
        where: {
          prodeId_userId_matchId: { prodeId, userId, matchId: pred.matchId },
        },
        update: {
          predHomeScore: pred.predHomeScore,
          predAwayScore: pred.predAwayScore,
        },
        create: {
          prodeId,
          userId,
          matchId: pred.matchId,
          predHomeScore: pred.predHomeScore,
          predAwayScore: pred.predAwayScore,
        },
      }),
    ),
  );

  revalidatePath(`/prode/${prodeId}`);
  return { success: true };
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

  // Group predictions points
  const groupPoints = await prisma.prodeGroupPrediction.groupBy({
    by: ["userId"],
    where: { prodeId, userId: { in: userIds } },
    _sum: { pointsEarned: true },
  });
  const groupMap = new Map(groupPoints.map((g) => [g.userId, g._sum.pointsEarned ?? 0]));

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
    const gp = groupMap.get(p.userId) ?? 0;
    const ap = advanceMap.get(p.userId) ?? 0;
    const total = (mp?.sum ?? 0) + gp + ap;

    return {
      userId: p.userId,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl,
      totalPoints: total,
      matchPoints: mp?.sum ?? 0,
      groupPoints: gp,
      advancePoints: ap,
      predictions: mp?.count ?? 0,
      exactResults: exactMap.get(p.userId) ?? 0,
    };
  });

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  return leaderboard;
}

// ─── Admin/Creator: Score week ──────────────────────────────

export async function scoreProdeWeek(weekId: string, results: { matchId: string; homeScore: number; awayScore: number }[]) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "No autenticado" };

  // Only admins can score (for now)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return { error: "Solo admins pueden puntuar" };

  await prisma.$transaction(async (tx) => {
    for (const result of results) {
      await tx.prodeMatch.update({
        where: { id: result.matchId },
        data: { homeScore: result.homeScore, awayScore: result.awayScore, status: "FINISHED" },
      });

      // Score all predictions for this match (across all prodes)
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
  await prisma.prodeWeek.update({ where: { id: weekId }, data: { status: "OPEN" } });
  revalidatePath("/prode");
  return { success: true };
}

export async function closeProdeWeek(weekId: string) {
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
