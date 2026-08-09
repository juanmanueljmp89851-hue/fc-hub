"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/user";
import { revalidatePath } from "next/cache";
import type { BengalaReason } from "@prisma/client";

// ─── CONFIGURACIÓN (valores por defecto, override desde SystemConfig) ───

const DEFAULT_BENGALA_VALUES: Record<BengalaReason, number> = {
  REFERRAL_ACTIVE: 5,
  REFERRAL_TOURNAMENT: 10,
  REFERRAL_PRODE: 5,
  REFERRAL_ORGANIZED: 15,
};

const DEFAULT_ACTIVE_CONDITIONS = {
  minDuels: 5,
  tournamentParticipation: true,
  tournamentOrganized: true,
};

async function getBengalaValue(reason: BengalaReason): Promise<number> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: `bengala_${reason.toLowerCase()}` },
  });
  if (config?.value && typeof config.value === "object" && "amount" in (config.value as Record<string, unknown>)) {
    return (config.value as { amount: number }).amount;
  }
  return DEFAULT_BENGALA_VALUES[reason];
}

async function getActiveConditions() {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "active_conditions" },
  });
  if (config?.value && typeof config.value === "object") {
    return { ...DEFAULT_ACTIVE_CONDITIONS, ...(config.value as Record<string, unknown>) };
  }
  return DEFAULT_ACTIVE_CONDITIONS;
}

// ─── CÓDIGO DE REFERIDO ─────────────────────────────────────

export async function generateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  if (user.referralCode) return user.referralCode;

  const base = `FOSA-${user.username.toUpperCase()}`;
  let code = base;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { referralCode: code } })) {
    code = `${base}${counter}`;
    counter++;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });

  return code;
}

export async function getAmbassadorByCode(code: string) {
  return prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true, username: true, avatarUrl: true, referralCode: true },
  });
}

// ─── REGISTRO DE REFERIDO ───────────────────────────────────

export async function registerReferral(referredId: string, referralCode: string) {
  const ambassador = await prisma.user.findUnique({
    where: { referralCode: referralCode.toUpperCase() },
  });

  if (!ambassador) return { error: "Código de referido inválido" };
  if (ambassador.id === referredId) return { error: "No podés referirte a vos mismo" };

  const existing = await prisma.referral.findUnique({
    where: { referredId },
  });
  if (existing) return { error: "Ya tenés un embajador asignado" };

  await prisma.referral.create({
    data: {
      ambassadorId: ambassador.id,
      referredId,
      referralCode: referralCode.toUpperCase(),
    },
  });

  return { success: true };
}

// ─── CONFIGURACIÓN DE CONVERSIÓN ────────────────────────────

const DEFAULT_CONVERSION_CONFIG = {
  minDuels: 5,
  minUniqueOpponents: 3,
  minTournamentParticipants: 5,
  minTournamentMatches: 2,
  minProdeParticipants: 5,
  riskThreshold: 40,
};

async function getConversionConfig() {
  const activePeriod = await prisma.ambassadorPeriod.findFirst({
    where: { status: "ACTIVE" },
  });

  if (activePeriod) {
    const config = await prisma.conversionConfig.findUnique({
      where: { periodId: activePeriod.id },
    });
    if (config) {
      return {
        minDuels: config.minDuels,
        minUniqueOpponents: config.minUniqueOpponents,
        minTournamentParticipants: config.minTournamentParticipants,
        minTournamentMatches: config.minTournamentMatches,
        minProdeParticipants: config.minProdeParticipants,
        riskThreshold: config.riskThreshold,
      };
    }
  }

  const globalConfig = await prisma.conversionConfig.findFirst({
    where: { periodId: null },
  });
  if (globalConfig) {
    return {
      minDuels: globalConfig.minDuels,
      minUniqueOpponents: globalConfig.minUniqueOpponents,
      minTournamentParticipants: globalConfig.minTournamentParticipants,
      minTournamentMatches: globalConfig.minTournamentMatches,
      minProdeParticipants: globalConfig.minProdeParticipants,
      riskThreshold: globalConfig.riskThreshold,
    };
  }

  return DEFAULT_CONVERSION_CONFIG;
}

// ─── DETECCIÓN DE FRAUDE ────────────────────────────────────

async function calculateRiskScore(
  userId: string,
  ambassadorId: string,
): Promise<{ score: number; flags: string[] }> {
  const flags: string[] = [];
  let score = 0;

  const referred = await prisma.user.findUnique({
    where: { id: userId },
    select: { psnUsername: true, xboxUsername: true, pcUsername: true, createdAt: true },
  });
  if (!referred) return { score: 0, flags: [] };

  const otherReferrals = await prisma.referral.findMany({
    where: { ambassadorId, referredId: { not: userId }, invalidated: false },
    select: { referredId: true },
  });
  const siblingIds = otherReferrals.map((r) => r.referredId);

  if (siblingIds.length > 0) {
    const siblings = await prisma.user.findMany({
      where: { id: { in: siblingIds } },
      select: { psnUsername: true, xboxUsername: true, pcUsername: true, createdAt: true },
    });

    for (const sib of siblings) {
      if (referred.psnUsername && sib.psnUsername && referred.psnUsername === sib.psnUsername) {
        flags.push("SAME_PSN_AS_SIBLING");
        score += 30;
      }
      if (referred.xboxUsername && sib.xboxUsername && referred.xboxUsername === sib.xboxUsername) {
        flags.push("SAME_XBOX_AS_SIBLING");
        score += 30;
      }
      if (referred.pcUsername && sib.pcUsername && referred.pcUsername === sib.pcUsername) {
        flags.push("SAME_PC_AS_SIBLING");
        score += 30;
      }

      const timeDiff = Math.abs(referred.createdAt.getTime() - sib.createdAt.getTime());
      if (timeDiff < 5 * 60 * 1000) {
        flags.push("CREATED_NEAR_SIBLING");
        score += 15;
      }
    }

    const duels = await prisma.casualMatch.findMany({
      where: {
        status: "FINISHED",
        OR: [{ challengerId: userId }, { challengedId: userId }],
      },
      select: { challengerId: true, challengedId: true },
    });
    if (duels.length > 0) {
      const opponents = duels.map((d) =>
        d.challengerId === userId ? d.challengedId : d.challengerId,
      );
      const uniqueOpponents = [...new Set(opponents)];
      const onlySiblings = uniqueOpponents.every((opp) => siblingIds.includes(opp));
      if (onlySiblings && uniqueOpponents.length > 0) {
        flags.push("DUELS_ONLY_WITH_SIBLINGS");
        score += 25;
      }
    }
  }

  const ambassador = await prisma.user.findUnique({
    where: { id: ambassadorId },
    select: { psnUsername: true, xboxUsername: true, pcUsername: true },
  });
  if (ambassador) {
    if (referred.psnUsername && ambassador.psnUsername && referred.psnUsername === ambassador.psnUsername) {
      flags.push("SAME_PSN_AS_AMBASSADOR");
      score += 30;
    }
    if (referred.xboxUsername && ambassador.xboxUsername && referred.xboxUsername === ambassador.xboxUsername) {
      flags.push("SAME_XBOX_AS_AMBASSADOR");
      score += 30;
    }
    if (referred.pcUsername && ambassador.pcUsername && referred.pcUsername === ambassador.pcUsername) {
      flags.push("SAME_PC_AS_AMBASSADOR");
      score += 30;
    }
  }

  const now = new Date();
  const accountAge = now.getTime() - referred.createdAt.getTime();
  if (accountAge < 24 * 60 * 60 * 1000) {
    flags.push("ACCOUNT_UNDER_24H");
    score += 10;
  }

  return { score: Math.min(score, 100), flags };
}

// ─── EVALUACIÓN DE CONVERSIÓN ───────────────────────────────

type ConversionRuleType =
  | "DUELS_5_USERS_3"
  | "TOURNAMENT_PARTICIPATION"
  | "TOURNAMENT_CREATOR_5P_2M"
  | "PRODE_CREATOR_5P";

export async function evaluateConversion(userId: string) {
  const referral = await prisma.referral.findUnique({
    where: { referredId: userId },
  });

  if (!referral || referral.invalidated) return;
  if (referral.conversionStatus !== "PENDING") return;

  const config = await getConversionConfig();
  let matchedRule: ConversionRuleType | null = null;

  // Rule 1: 5 duels against 3+ distinct opponents
  if (!matchedRule) {
    const duels = await prisma.casualMatch.findMany({
      where: {
        status: "FINISHED",
        OR: [{ challengerId: userId }, { challengedId: userId }],
      },
      select: { challengerId: true, challengedId: true },
    });

    if (duels.length >= config.minDuels) {
      const opponents = duels.map((d) =>
        d.challengerId === userId ? d.challengedId : d.challengerId,
      );
      const uniqueOpponents = new Set(opponents);
      if (uniqueOpponents.size >= config.minUniqueOpponents) {
        matchedRule = "DUELS_5_USERS_3";
      }
    }
  }

  // Rule 2: Tournament participation + at least 1 match played
  if (!matchedRule) {
    const participations = await prisma.tournamentParticipant.findMany({
      where: { userId, status: "CONFIRMED" },
      select: { tournamentId: true },
    });

    if (participations.length > 0) {
      const tournamentIds = participations.map((p) => p.tournamentId);
      const matchInAny = await prisma.tournamentMatch.count({
        where: {
          tournamentId: { in: tournamentIds },
          status: "FINISHED",
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
      });
      if (matchInAny >= 1) {
        matchedRule = "TOURNAMENT_PARTICIPATION";
      }
    }
  }

  // Rule 3: Created tournament + 5 participants + 2 matches
  if (!matchedRule) {
    const createdTournaments = await prisma.tournament.findMany({
      where: { createdById: userId },
      select: { id: true },
    });

    if (createdTournaments.length > 0) {
      const tIds = createdTournaments.map((t) => t.id);
      const [participantCounts, matchCounts] = await Promise.all([
        prisma.tournamentParticipant.groupBy({
          by: ["tournamentId"],
          where: { tournamentId: { in: tIds }, status: "CONFIRMED" },
          _count: true,
        }),
        prisma.tournamentMatch.groupBy({
          by: ["tournamentId"],
          where: { tournamentId: { in: tIds }, status: "FINISHED" },
          _count: true,
        }),
      ]);

      for (const t of tIds) {
        const pCount = participantCounts.find((p) => p.tournamentId === t)?._count ?? 0;
        const mCount = matchCounts.find((m) => m.tournamentId === t)?._count ?? 0;
        if (
          pCount >= config.minTournamentParticipants &&
          mCount >= config.minTournamentMatches
        ) {
          matchedRule = "TOURNAMENT_CREATOR_5P_2M";
          break;
        }
      }
    }
  }

  // Rule 4: Created prode + 5 participants
  if (!matchedRule) {
    const createdProdes = await prisma.prode.findMany({
      where: { createdById: userId },
      select: { id: true },
    });

    if (createdProdes.length > 0) {
      const prodeIds = createdProdes.map((p) => p.id);
      const prodeCounts = await prisma.prodeParticipant.groupBy({
        by: ["prodeId"],
        where: { prodeId: { in: prodeIds } },
        _count: true,
      });
      const qualifying = prodeCounts.find((c) => c._count >= config.minProdeParticipants);
      if (qualifying) {
        matchedRule = "PRODE_CREATOR_5P";
      }
    }
  }

  if (!matchedRule) return;

  const { score, flags } = await calculateRiskScore(userId, referral.ambassadorId);
  const now = new Date();

  if (score >= config.riskThreshold) {
    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data: {
          conversionStatus: "UNDER_REVIEW",
          conversionRule: matchedRule,
          riskScore: score,
          riskFlags: flags,
        },
      }),
      prisma.conversionLog.create({
        data: {
          referralId: referral.id,
          previousStatus: "PENDING",
          newStatus: "UNDER_REVIEW",
          rule: matchedRule,
          changedBy: "SYSTEM",
          reason: `Risk score ${score} >= threshold ${config.riskThreshold}`,
          metadata: JSON.parse(JSON.stringify({ flags, score })),
        },
      }),
      prisma.notification.create({
        data: {
          userId: referral.ambassadorId,
          type: "CONVERSION_REVIEW",
          title: "Referido en revisión",
          message: "Un referido fue marcado para revisión manual por nuestro sistema anti-fraude.",
          linkUrl: "/perfil#embajador",
        },
      }),
    ]);
    return;
  }

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: {
        isActive: true,
        activatedAt: now,
        conversionStatus: "VALIDATED",
        conversionRule: matchedRule,
        convertedAt: now,
        riskScore: score,
        riskFlags: flags.length > 0 ? flags : undefined,
      },
    }),
    prisma.conversionLog.create({
      data: {
        referralId: referral.id,
        previousStatus: "PENDING",
        newStatus: "VALIDATED",
        rule: matchedRule,
        changedBy: "SYSTEM",
        reason: `Auto-validated: rule ${matchedRule}, risk ${score}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: referral.ambassadorId,
        type: "REFERRAL_VALIDATED",
        title: "Referido validado",
        message: "Tu referido completó actividad real y fue validado. ¡Ganaste bengalas!",
        linkUrl: "/perfil#embajador",
      },
    }),
  ]);

  await awardBengala(referral.ambassadorId, "REFERRAL_ACTIVE", referral.id);
}

// ─── COMPATIBILIDAD — wrapper para hooks existentes ─────────

export async function checkAndActivateReferral(userId: string) {
  await evaluateConversion(userId);
}

// ─── OTORGAR BENGALAS ───────────────────────────────────────

export async function awardBengala(
  ambassadorId: string,
  reason: BengalaReason,
  referralId: string,
  metadata?: Record<string, string | number | boolean>,
) {
  const existing = await prisma.bengala.findFirst({
    where: { userId: ambassadorId, reason, referralId, invalidated: false },
  });
  if (existing) return;

  const amount = await getBengalaValue(reason);

  await prisma.bengala.create({
    data: {
      userId: ambassadorId,
      amount,
      reason,
      referralId,
      metadata: metadata ? (metadata as Record<string, string | number | boolean>) : undefined,
    },
  });
}

export async function checkAndAwardBengala(
  userId: string,
  reason: BengalaReason,
  metadata?: Record<string, string | number | boolean>,
) {
  const referral = await prisma.referral.findUnique({
    where: { referredId: userId },
  });

  if (!referral || referral.invalidated) return;

  if (referral.conversionStatus === "PENDING") {
    await evaluateConversion(userId);
    const refreshed = await prisma.referral.findUnique({
      where: { referredId: userId },
    });
    if (refreshed?.conversionStatus !== "VALIDATED") return;
  } else if (referral.conversionStatus !== "VALIDATED") {
    return;
  }

  await awardBengala(referral.ambassadorId, reason, referral.id, metadata);
}

// ─── PERFIL EMBAJADOR ───────────────────────────────────────

export async function getMyAmbassadorProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!user.referralCode) {
    await generateReferralCode(user.id);
  }

  const activePeriod = await prisma.ambassadorPeriod.findFirst({
    where: { status: "ACTIVE" },
  });

  const [
    totalReferrals,
    activeReferrals,
    bengalas,
    totalBengalas,
    rankPosition,
    titlesWon,
    periodActiveRefs,
  ] = await Promise.all([
    prisma.referral.count({
      where: { ambassadorId: user.id, invalidated: false },
    }),
    prisma.referral.count({
      where: { ambassadorId: user.id, conversionStatus: "VALIDATED", invalidated: false },
    }),
    prisma.bengala.findMany({
      where: { userId: user.id, invalidated: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        referral: {
          include: { referred: { select: { username: true } } },
        },
      },
    }),
    prisma.bengala.aggregate({
      where: { userId: user.id, invalidated: false },
      _sum: { amount: true },
    }),
    getAmbassadorRankPosition(user.id),
    prisma.periodWinner.findMany({
      where: { userId: user.id, position: 1 },
      include: { period: { select: { name: true } } },
    }),
    activePeriod
      ? prisma.referral.count({
          where: {
            ambassadorId: user.id,
            conversionStatus: "VALIDATED",
            invalidated: false,
            convertedAt: { gte: activePeriod.startDate, lt: activePeriod.endDate },
          },
        })
      : Promise.resolve(0),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { referralCode: true },
  });

  return {
    referralCode: updatedUser?.referralCode ?? "",
    totalReferrals,
    activeReferrals,
    totalBengalas: totalBengalas._sum.amount ?? 0,
    rankPosition,
    titlesWon: titlesWon.map((t) => t.period.name),
    periodActiveRefs,
    activePeriodName: activePeriod?.name ?? null,
    bengalas: bengalas.map((b) => ({
      id: b.id,
      amount: b.amount,
      reason: b.reason,
      referredUsername: b.referral?.referred?.username ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

async function getAmbassadorRankPosition(userId: string): Promise<number> {
  const userBengalas = await prisma.bengala.aggregate({
    where: { userId, invalidated: false },
    _sum: { amount: true },
  });
  const userActiveRefs = await prisma.referral.count({
    where: { ambassadorId: userId, conversionStatus: "VALIDATED", invalidated: false },
  });

  const allAmbassadors = await prisma.referral.groupBy({
    by: ["ambassadorId"],
    where: { conversionStatus: "VALIDATED", invalidated: false },
    _count: { id: true },
  });

  let position = 1;
  for (const amb of allAmbassadors) {
    if (amb.ambassadorId === userId) continue;
    if (amb._count.id > userActiveRefs) {
      position++;
    } else if (amb._count.id === userActiveRefs) {
      const theirBengalas = await prisma.bengala.aggregate({
        where: { userId: amb.ambassadorId, invalidated: false },
        _sum: { amount: true },
      });
      if ((theirBengalas._sum.amount ?? 0) > (userBengalas._sum.amount ?? 0)) {
        position++;
      }
    }
  }

  return position;
}

// ─── RANKING PÚBLICO ────────────────────────────────────────

export async function getAmbassadorRanking(limit = 50) {
  const ambassadors = await prisma.referral.groupBy({
    by: ["ambassadorId"],
    where: { conversionStatus: "VALIDATED", invalidated: false },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const results = await Promise.all(
    ambassadors.map(async (amb) => {
      const [user, bengalas, totalRefs] = await Promise.all([
        prisma.user.findUnique({
          where: { id: amb.ambassadorId },
          select: { id: true, username: true, avatarUrl: true },
        }),
        prisma.bengala.aggregate({
          where: { userId: amb.ambassadorId, invalidated: false },
          _sum: { amount: true },
        }),
        prisma.referral.count({
          where: { ambassadorId: amb.ambassadorId, invalidated: false },
        }),
      ]);

      return {
        user,
        activeReferrals: amb._count.id,
        totalReferrals: totalRefs,
        totalBengalas: bengalas._sum.amount ?? 0,
      };
    }),
  );

  return results.sort((a, b) => {
    if (b.activeReferrals !== a.activeReferrals) return b.activeReferrals - a.activeReferrals;
    return b.totalBengalas - a.totalBengalas;
  });
}

// ─── EMBAJADOR DEL MES: PERÍODOS ──────────────────────────

export async function getActivePeriod() {
  const period = await prisma.ambassadorPeriod.findFirst({
    where: { status: "ACTIVE" },
    include: {
      prizes: { orderBy: { position: "asc" } },
      winners: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!period) return null;

  return {
    ...period,
    startDate: period.startDate.toISOString(),
    endDate: period.endDate.toISOString(),
    finalizedAt: period.finalizedAt?.toISOString() ?? null,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };
}

export async function getPeriods() {
  const periods = await prisma.ambassadorPeriod.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      prizes: { orderBy: { position: "asc" } },
      winners: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  return periods.map((p) => ({
    ...p,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    finalizedAt: p.finalizedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function getPeriod(id: string) {
  const period = await prisma.ambassadorPeriod.findUnique({
    where: { id },
    include: {
      prizes: { orderBy: { position: "asc" } },
      winners: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!period) return null;

  return {
    ...period,
    startDate: period.startDate.toISOString(),
    endDate: period.endDate.toISOString(),
    finalizedAt: period.finalizedAt?.toISOString() ?? null,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };
}

export async function getPeriodRanking(periodId: string, limit = 50) {
  const period = await prisma.ambassadorPeriod.findUnique({ where: { id: periodId } });
  if (!period) return [];

  const referrals = await prisma.referral.findMany({
    where: {
      conversionStatus: "VALIDATED",
      invalidated: false,
      convertedAt: {
        gte: period.startDate,
        lt: period.endDate,
      },
    },
    select: { ambassadorId: true, id: true },
  });

  const countMap = new Map<string, number>();
  for (const r of referrals) {
    countMap.set(r.ambassadorId, (countMap.get(r.ambassadorId) ?? 0) + 1);
  }

  const sorted = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const userIds = sorted.map(([id]) => id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });

  const bengalaMap = new Map<string, number>();
  const bengalas = await prisma.bengala.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      invalidated: false,
      createdAt: { gte: period.startDate, lt: period.endDate },
    },
    _sum: { amount: true },
  });
  for (const b of bengalas) {
    bengalaMap.set(b.userId, b._sum.amount ?? 0);
  }

  const userMap = new Map(users.map((u) => [u.id, u]));

  return sorted.map(([userId, activeCount], idx) => ({
    position: idx + 1,
    user: userMap.get(userId) ?? null,
    activeReferrals: activeCount,
    bengalas: bengalaMap.get(userId) ?? 0,
  }));
}

export async function getMyPeriodStats(periodId?: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  let period;
  if (periodId) {
    period = await prisma.ambassadorPeriod.findUnique({ where: { id: periodId } });
  } else {
    period = await prisma.ambassadorPeriod.findFirst({ where: { status: "ACTIVE" } });
  }
  if (!period) return null;

  const myActiveRefs = await prisma.referral.count({
    where: {
      ambassadorId: user.id,
      conversionStatus: "VALIDATED",
      invalidated: false,
      convertedAt: { gte: period.startDate, lt: period.endDate },
    },
  });

  const allRefs = await prisma.referral.findMany({
    where: {
      conversionStatus: "VALIDATED",
      invalidated: false,
      convertedAt: { gte: period.startDate, lt: period.endDate },
    },
    select: { ambassadorId: true },
  });

  const countMap = new Map<string, number>();
  for (const r of allRefs) {
    countMap.set(r.ambassadorId, (countMap.get(r.ambassadorId) ?? 0) + 1);
  }

  let position = 1;
  let firstPlace = 0;
  for (const [ambId, count] of countMap) {
    if (count > firstPlace) firstPlace = count;
    if (ambId !== user.id && count > myActiveRefs) position++;
  }

  const myBengalas = await prisma.bengala.aggregate({
    where: {
      userId: user.id,
      invalidated: false,
      createdAt: { gte: period.startDate, lt: period.endDate },
    },
    _sum: { amount: true },
  });

  const titles = await prisma.periodWinner.count({
    where: { userId: user.id, position: 1 },
  });

  return {
    periodId: period.id,
    periodName: period.name,
    position,
    myActiveReferrals: myActiveRefs,
    firstPlace,
    difference: firstPlace - myActiveRefs,
    bengalas: myBengalas._sum.amount ?? 0,
    titlesWon: titles,
    endDate: period.endDate.toISOString(),
  };
}

export async function getPeriodHistory() {
  const periods = await prisma.ambassadorPeriod.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      prizes: { orderBy: { position: "asc" } },
      winners: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  return periods.map((p) => ({
    id: p.id,
    name: p.name,
    month: p.month,
    year: p.year,
    endDate: p.endDate.toISOString(),
    finalizedAt: p.finalizedAt?.toISOString() ?? null,
    prizes: p.prizes.map((pr) => ({
      position: pr.position,
      name: pr.name,
      description: pr.description,
      imageUrl: pr.imageUrl,
    })),
    winners: p.winners.map((w) => ({
      position: w.position,
      user: w.user,
      activeReferrals: w.activeReferrals,
      bengalasEarned: w.bengalasEarned,
    })),
  }));
}

// ─── ADMIN ──────────────────────────────────────────────────

export async function getAmbassadorDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;

  const activePeriod = await prisma.ambassadorPeriod.findFirst({
    where: { status: "ACTIVE" },
  });

  const [
    totalAmbassadors,
    totalReferrals,
    activeReferrals,
    totalBengalas,
    recentActivity,
    topAmbassadors,
    periodsCount,
  ] = await Promise.all([
    prisma.user.count({ where: { referralCode: { not: null } } }),
    prisma.referral.count({ where: { invalidated: false } }),
    prisma.referral.count({ where: { isActive: true, invalidated: false } }),
    prisma.bengala.aggregate({
      where: { invalidated: false },
      _sum: { amount: true },
    }),
    prisma.bengala.findMany({
      where: { invalidated: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { username: true } },
        referral: {
          include: { referred: { select: { username: true } } },
        },
      },
    }),
    getAmbassadorRanking(10),
    prisma.ambassadorPeriod.count(),
  ]);

  return {
    totalAmbassadors,
    totalReferrals,
    activeReferrals,
    totalBengalas: totalBengalas._sum.amount ?? 0,
    periodsCount,
    activePeriodId: activePeriod?.id ?? null,
    activePeriodName: activePeriod?.name ?? null,
    recentActivity: recentActivity.map((b) => ({
      id: b.id,
      username: b.user.username,
      amount: b.amount,
      reason: b.reason,
      referredUsername: b.referral?.referred?.username ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
    topAmbassadors,
  };
}

export async function createPeriod(data: {
  name: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  const existing = await prisma.ambassadorPeriod.findUnique({
    where: { month_year: { month: data.month, year: data.year } },
  });
  if (existing) return { error: `Ya existe un período para ${data.month}/${data.year}` };

  const period = await prisma.ambassadorPeriod.create({
    data: {
      name: data.name,
      month: data.month,
      year: data.year,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: "SCHEDULED",
      createdById: user.id,
    },
  });

  revalidatePath("/admin/embajadores");
  revalidatePath("/embajadores");
  return { success: true, id: period.id };
}

export async function updatePeriod(
  id: string,
  data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    status?: "SCHEDULED" | "ACTIVE" | "CANCELLED";
  },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  const period = await prisma.ambassadorPeriod.findUnique({ where: { id } });
  if (!period) return { error: "Período no encontrado" };
  if (period.status === "COMPLETED") return { error: "Período ya finalizado" };

  if (data.status === "ACTIVE") {
    const otherActive = await prisma.ambassadorPeriod.findFirst({
      where: { status: "ACTIVE", id: { not: id } },
    });
    if (otherActive) return { error: `Ya hay un período activo: ${otherActive.name}` };
  }

  await prisma.ambassadorPeriod.update({
    where: { id },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status,
    },
  });

  revalidatePath("/admin/embajadores");
  revalidatePath("/embajadores");
  return { success: true };
}

export async function finalizePeriod(periodId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  const period = await prisma.ambassadorPeriod.findUnique({ where: { id: periodId } });
  if (!period) return { error: "Período no encontrado" };
  if (period.status !== "ACTIVE") return { error: "Período no está activo" };

  const ranking = await getPeriodRanking(periodId, 3);

  const winnerOps = ranking.map((entry) =>
    prisma.periodWinner.create({
      data: {
        periodId,
        userId: entry.user!.id,
        position: entry.position,
        activeReferrals: entry.activeReferrals,
        bengalasEarned: entry.bengalas,
      },
    }),
  );

  const notifOps = ranking
    .filter((e) => e.position === 1)
    .map((entry) =>
      prisma.notification.create({
        data: {
          userId: entry.user!.id,
          type: "AMBASSADOR_WON",
          title: `🏆 ¡Embajador ${period.name}!`,
          message: `¡Felicitaciones! Sos el Embajador ${period.name} con ${entry.activeReferrals} referidos activos.`,
          linkUrl: `/embajadores/periodo/${periodId}`,
        },
      }),
    );

  await prisma.$transaction([
    prisma.ambassadorPeriod.update({
      where: { id: periodId },
      data: { status: "COMPLETED", finalizedAt: new Date() },
    }),
    ...winnerOps,
    ...notifOps,
  ]);

  revalidatePath("/embajadores");
  revalidatePath(`/embajadores/periodo/${periodId}`);
  revalidatePath("/admin/embajadores");
  return { success: true, winners: ranking };
}

export async function createPeriodPrize(periodId: string, data: {
  position: number;
  name: string;
  description?: string;
  imageUrl?: string;
  value?: string;
  conditions?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  await prisma.periodPrize.create({
    data: {
      periodId,
      position: data.position,
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      value: data.value ?? null,
      conditions: data.conditions ?? null,
    },
  });

  revalidatePath("/admin/embajadores");
  revalidatePath("/embajadores");
  return { success: true };
}

export async function updatePeriodPrize(prizeId: string, data: {
  name?: string;
  description?: string;
  imageUrl?: string;
  value?: string;
  conditions?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  await prisma.periodPrize.update({
    where: { id: prizeId },
    data,
  });

  revalidatePath("/admin/embajadores");
  return { success: true };
}

export async function getAllPeriodsAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return [];

  const periods = await prisma.ambassadorPeriod.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      prizes: { orderBy: { position: "asc" } },
      winners: {
        include: { user: { select: { username: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  return periods.map((p) => ({
    id: p.id,
    name: p.name,
    month: p.month,
    year: p.year,
    status: p.status,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    finalizedAt: p.finalizedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    prizes: p.prizes.map((pr) => ({
      id: pr.id,
      position: pr.position,
      name: pr.name,
      description: pr.description,
      imageUrl: pr.imageUrl,
      value: pr.value,
    })),
    winners: p.winners.map((w) => ({
      position: w.position,
      username: w.user.username,
      avatarUrl: w.user.avatarUrl,
      activeReferrals: w.activeReferrals,
      bengalasEarned: w.bengalasEarned,
    })),
  }));
}

export async function invalidateBengala(bengalaId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  await prisma.bengala.update({
    where: { id: bengalaId },
    data: {
      invalidated: true,
      invalidatedBy: user.id,
      invalidatedAt: new Date(),
    },
  });

  revalidatePath("/admin/embajadores");
  return { success: true };
}

export async function invalidateReferral(referralId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  const referral = await prisma.referral.findUnique({ where: { id: referralId } });
  if (!referral) return { error: "Referido no encontrado" };

  const previousStatus = referral.conversionStatus;

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referralId },
      data: {
        invalidated: true,
        isActive: false,
        conversionStatus: "INVALIDATED",
        invalidatedBy: user.id,
        invalidatedAt: new Date(),
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNote: reason ?? "Invalidado por admin",
      },
    }),
    prisma.bengala.updateMany({
      where: { referralId, invalidated: false },
      data: {
        invalidated: true,
        invalidatedBy: user.id,
        invalidatedAt: new Date(),
      },
    }),
    prisma.conversionLog.create({
      data: {
        referralId,
        previousStatus,
        newStatus: "INVALIDATED",
        changedBy: user.id,
        reason: reason ?? "Invalidado por admin",
      },
    }),
  ]);

  revalidatePath("/admin/embajadores");
  return { success: true };
}

export async function adminReviewConversion(
  referralId: string,
  action: "VALIDATE" | "INVALIDATE",
  note?: string,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  const referral = await prisma.referral.findUnique({ where: { id: referralId } });
  if (!referral) return { error: "Referido no encontrado" };

  const previousStatus = referral.conversionStatus;
  const now = new Date();

  if (action === "VALIDATE") {
    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referralId },
        data: {
          isActive: true,
          activatedAt: now,
          conversionStatus: "VALIDATED",
          convertedAt: now,
          reviewedBy: user.id,
          reviewedAt: now,
          reviewNote: note ?? "Aprobado manualmente por admin",
        },
      }),
      prisma.conversionLog.create({
        data: {
          referralId,
          previousStatus,
          newStatus: "VALIDATED",
          changedBy: user.id,
          reason: note ?? "Aprobado manualmente por admin",
        },
      }),
    ]);

    await awardBengala(referral.ambassadorId, "REFERRAL_ACTIVE", referral.id);
  } else {
    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referralId },
        data: {
          conversionStatus: "INVALIDATED",
          invalidated: true,
          invalidatedBy: user.id,
          invalidatedAt: now,
          reviewedBy: user.id,
          reviewedAt: now,
          reviewNote: note ?? "Rechazado por admin",
        },
      }),
      prisma.bengala.updateMany({
        where: { referralId, invalidated: false },
        data: { invalidated: true, invalidatedBy: user.id, invalidatedAt: now },
      }),
      prisma.conversionLog.create({
        data: {
          referralId,
          previousStatus,
          newStatus: "INVALIDATED",
          changedBy: user.id,
          reason: note ?? "Rechazado por admin",
        },
      }),
    ]);
  }

  revalidatePath("/admin/embajadores");
  return { success: true };
}

export async function getConversionsAdmin(filters?: {
  status?: string;
  rule?: string;
  periodId?: string;
  ambassadorId?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return [];

  const where: Record<string, unknown> = { invalidated: false };
  if (filters?.status) where.conversionStatus = filters.status;
  if (filters?.rule) where.conversionRule = filters.rule;
  if (filters?.ambassadorId) where.ambassadorId = filters.ambassadorId;

  if (filters?.periodId) {
    const period = await prisma.ambassadorPeriod.findUnique({ where: { id: filters.periodId } });
    if (period) {
      where.createdAt = { gte: period.startDate, lt: period.endDate };
    }
  }

  const referrals = await prisma.referral.findMany({
    where,
    include: {
      ambassador: { select: { id: true, username: true } },
      referred: {
        select: {
          id: true,
          username: true,
          psnUsername: true,
          xboxUsername: true,
          pcUsername: true,
          createdAt: true,
        },
      },
      conversionLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return referrals.map((r) => ({
    id: r.id,
    ambassador: r.ambassador,
    referred: r.referred,
    referralCode: r.referralCode,
    conversionStatus: r.conversionStatus,
    conversionRule: r.conversionRule,
    convertedAt: r.convertedAt?.toISOString() ?? null,
    riskScore: r.riskScore,
    riskFlags: r.riskFlags as string[] | null,
    reviewedBy: r.reviewedBy,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt.toISOString(),
    logs: r.conversionLogs.map((l) => ({
      id: l.id,
      previousStatus: l.previousStatus,
      newStatus: l.newStatus,
      rule: l.rule,
      changedBy: l.changedBy,
      reason: l.reason,
      createdAt: l.createdAt.toISOString(),
    })),
  }));
}

export async function updateBengalaConfig(key: string, value: Record<string, number>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "No autorizado" };

  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value: value as unknown as Record<string, number> },
    update: { value: value as unknown as Record<string, number> },
  });

  return { success: true };
}

export async function getAmbassadorActivity(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;

  const [ambassador, referrals, bengalas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarUrl: true, referralCode: true },
    }),
    prisma.referral.findMany({
      where: { ambassadorId: userId },
      include: {
        referred: { select: { username: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bengala.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        referral: {
          include: { referred: { select: { username: true } } },
        },
      },
    }),
  ]);

  return {
    ambassador,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredUsername: r.referred.username,
      referredEmail: r.referred.email,
      isActive: r.isActive,
      invalidated: r.invalidated,
      activatedAt: r.activatedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    bengalas: bengalas.map((b) => ({
      id: b.id,
      amount: b.amount,
      reason: b.reason,
      invalidated: b.invalidated,
      referredUsername: b.referral?.referred?.username ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

