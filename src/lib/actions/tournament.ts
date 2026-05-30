"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TournamentFormat, TournamentStatus, Platform, TeamType, TournamentVisibility, KnockoutSeeding, DrawUntilStage } from "@prisma/client";

// ─── CREAR TORNEO ──────────────────────────────────────────

interface CreateTournamentInput {
  name: string;
  description?: string;
  rules?: string;
  format: TournamentFormat;
  leagueLegs?: number;
  maxPlayers: number;
  platforms: Platform[];
  teamType: TeamType;
  startDate?: string;
  registrationOpen?: string;
  registrationDeadline?: string;
  prize?: string;
  bannerUrl?: string;
  visibility: TournamentVisibility;
  requiresVerification: boolean;
  matchTime?: string;
  difficulty?: string;
  controls?: string;
  stadium?: string;
  groupCount?: number;
  qualifyPerGroup?: number;
  knockoutSeeding?: KnockoutSeeding;
  randomDrawUntil?: DrawUntilStage;
  hasLosersBracket?: boolean;
}

export async function createTournament(input: CreateTournamentInput) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Tenés que iniciar sesión para crear un torneo" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado en la base de datos" };
  }

  // Validaciones
  if (!input.name || input.name.trim().length < 3) {
    return { error: "El nombre del torneo debe tener al menos 3 caracteres" };
  }

  if (input.maxPlayers < 2) {
    return { error: "El torneo debe tener al menos 2 participantes" };
  }

  if (input.maxPlayers > 128) {
    return { error: "El torneo no puede tener más de 128 participantes" };
  }

  if (input.platforms.length === 0) {
    return { error: "Seleccioná al menos una plataforma" };
  }

  if (input.format === "GROUP_KNOCKOUT") {
    if (!input.groupCount || input.groupCount < 2) {
      return { error: "Necesitás al menos 2 grupos" };
    }
    if (!input.qualifyPerGroup || input.qualifyPerGroup < 1) {
      return { error: "Debe clasificar al menos 1 por grupo" };
    }
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        rules: input.rules?.trim() || null,
        format: input.format,
        leagueLegs: input.format === "LEAGUE" ? (input.leagueLegs ?? 1) : null,
        maxPlayers: input.maxPlayers,
        platforms: input.platforms,
        teamType: input.teamType,
        startDate: input.startDate ? new Date(input.startDate) : null,
        registrationOpen: input.registrationOpen ? new Date(input.registrationOpen) : null,
        registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : null,
        prize: input.prize?.trim() || null,
        bannerUrl: input.bannerUrl || null,
        visibility: input.visibility,
        requiresVerification: input.requiresVerification,
        matchTime: input.matchTime || null,
        difficulty: input.difficulty || null,
        controls: input.controls || null,
        stadium: input.stadium?.trim() || null,
        groupCount: input.format === "GROUP_KNOCKOUT" ? input.groupCount : null,
        qualifyPerGroup: input.format === "GROUP_KNOCKOUT" ? input.qualifyPerGroup : null,
        knockoutSeeding: input.knockoutSeeding ?? "RANDOM",
        randomDrawUntil: input.randomDrawUntil ?? "FINAL",
        hasLosersBracket: input.format === "DOUBLE_ELIMINATION" ? true : (input.hasLosersBracket ?? false),
        status: "REGISTRATION",
        createdById: dbUser.id,
      },
    });

    // Auto-inscribir al creador
    await prisma.tournamentParticipant.create({
      data: {
        tournamentId: tournament.id,
        userId: dbUser.id,
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // Audit log
    await prisma.tournamentAuditLog.create({
      data: {
        tournamentId: tournament.id,
        action: "TOURNAMENT_CREATED",
        performedById: dbUser.id,
        details: `Torneo "${tournament.name}" creado`,
      },
    });

    revalidatePath("/torneos");
    return { success: true, tournamentId: tournament.id };
  } catch (err) {
    console.error("Error creando torneo:", err);
    return { error: "Error al crear el torneo. Intentá de nuevo." };
  }
}

// ─── LISTAR TORNEOS ────────────────────────────────────────

interface ListTournamentsInput {
  status?: TournamentStatus;
  platform?: Platform;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listTournaments(input: ListTournamentsInput = {}) {
  const { status, platform, search, page = 1, limit = 12 } = input;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  } else {
    // Por defecto no mostrar DRAFT ni CANCELLED
    where.status = { in: ["REGISTRATION", "IN_PROGRESS", "FINISHED"] };
  }

  if (platform) {
    where.platforms = { has: platform };
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      include: {
        createdBy: {
          select: { username: true, avatarUrl: true },
        },
        _count: {
          select: { participants: { where: { status: { in: ["CONFIRMED", "PENDING"] } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tournament.count({ where }),
  ]);

  return {
    tournaments: tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      format: t.format,
      status: t.status,
      platforms: t.platforms,
      teamType: t.teamType,
      maxPlayers: t.maxPlayers,
      currentPlayers: t._count.participants,
      verificationLevel: t.verificationLevel,
      bannerUrl: t.bannerUrl,
      startDate: t.startDate,
      registrationDeadline: t.registrationDeadline,
      prize: t.prize,
      visibility: t.visibility,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

// ─── DETALLE TORNEO ────────────────────────────────────────

export async function getTournament(id: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, username: true, avatarUrl: true },
      },
      participants: {
        where: { status: { in: ["CONFIRMED", "PENDING"] } },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, rankingPoints: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      matches: {
        include: {
          player1: { select: { id: true, username: true, avatarUrl: true } },
          player2: { select: { id: true, username: true, avatarUrl: true } },
          winner: { select: { id: true, username: true } },
        },
        orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      },
      standings: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  return tournament;
}

// ─── INSCRIBIRSE ───────────────────────────────────────────

export async function joinTournament(tournamentId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Tenés que iniciar sesión" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      _count: {
        select: { participants: { where: { status: { in: ["CONFIRMED", "PENDING"] } } } },
      },
    },
  });

  if (!tournament) {
    return { error: "Torneo no encontrado" };
  }

  if (tournament.status !== "REGISTRATION") {
    return { error: "Las inscripciones no están abiertas" };
  }

  // Verificar deadline
  if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
    return { error: "El plazo de inscripción ya cerró" };
  }

  // Verificar si ya está inscripto
  const existing = await prisma.tournamentParticipant.findUnique({
    where: {
      tournamentId_userId: { tournamentId, userId: dbUser.id },
    },
  });

  if (existing) {
    return { error: "Ya estás inscripto en este torneo" };
  }

  // Verificar cupo
  const isFull = tournament._count.participants >= tournament.maxPlayers;

  if (isFull) {
    // Agregar a waitlist
    const waitlistCount = await prisma.tournamentWaitlist.count({
      where: { tournamentId },
    });

    await prisma.tournamentWaitlist.create({
      data: {
        tournamentId,
        userId: dbUser.id,
        position: waitlistCount + 1,
      },
    });

    return { success: true, waitlisted: true };
  }

  // Inscribir
  const status = tournament.requiresVerification ? "PENDING" : "CONFIRMED";
  await prisma.tournamentParticipant.create({
    data: {
      tournamentId,
      userId: dbUser.id,
      status,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true, status };
}

// ─── CANCELAR INSCRIPCIÓN ──────────────────────────────────

export async function leaveTournament(tournamentId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "No autenticado" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    return { error: "Torneo no encontrado" };
  }

  if (tournament.status !== "REGISTRATION") {
    return { error: "No se puede cancelar inscripción después de que empezó el torneo" };
  }

  // No puede salir el creador
  if (tournament.createdById === dbUser.id) {
    return { error: "El organizador no puede abandonar su propio torneo" };
  }

  await prisma.tournamentParticipant.delete({
    where: {
      tournamentId_userId: { tournamentId, userId: dbUser.id },
    },
  });

  // Verificar si hay alguien en waitlist para mover
  const nextInWaitlist = await prisma.tournamentWaitlist.findFirst({
    where: { tournamentId },
    orderBy: { position: "asc" },
  });

  if (nextInWaitlist) {
    await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: nextInWaitlist.userId,
        status: tournament.requiresVerification ? "PENDING" : "CONFIRMED",
        confirmedAt: tournament.requiresVerification ? null : new Date(),
      },
    });

    await prisma.tournamentWaitlist.delete({
      where: { id: nextInWaitlist.id },
    });
  }

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

// ─── INICIAR TORNEO (ORGANIZADOR) ──────────────────────────

export async function startTournament(tournamentId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) return { error: "Usuario no encontrado" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        where: { status: "CONFIRMED" },
        include: { user: true },
      },
    },
  });

  if (!tournament) return { error: "Torneo no encontrado" };
  if (tournament.createdById !== dbUser.id) return { error: "Solo el organizador puede iniciar el torneo" };
  if (tournament.status !== "REGISTRATION") return { error: "El torneo no está en fase de inscripción" };

  const confirmedPlayers = tournament.participants;
  if (confirmedPlayers.length < 2) {
    return { error: "Se necesitan al menos 2 participantes confirmados" };
  }

  // Generar bracket según formato
  const players = confirmedPlayers.map((p) => p.user);
  const withLosers = tournament.hasLosersBracket || tournament.format === "DOUBLE_ELIMINATION";

  if (tournament.format === "SINGLE_ELIMINATION") {
    if (withLosers) {
      await generateDoubleEliminationBracket(tournament.id, players);
    } else {
      await generateSingleEliminationBracket(tournament.id, players);
    }
  } else if (tournament.format === "DOUBLE_ELIMINATION") {
    await generateDoubleEliminationBracket(tournament.id, players);
  } else if (tournament.format === "GROUP_KNOCKOUT") {
    await generateGroupKnockoutBracket(
      tournament.id,
      players,
      tournament.groupCount ?? 4,
      tournament.qualifyPerGroup ?? 2,
      tournament.knockoutSeeding,
      withLosers,
    );
  } else if (tournament.format === "LEAGUE") {
    await generateLeagueMatches(tournament.id, players, tournament.leagueLegs ?? 1);
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "IN_PROGRESS" },
  });

  await prisma.tournamentAuditLog.create({
    data: {
      tournamentId,
      action: "TOURNAMENT_STARTED",
      performedById: dbUser.id,
      details: `Torneo iniciado con ${confirmedPlayers.length} jugadores`,
    },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

// ─── GENERAR BRACKETS ──────────────────────────────────────

interface PlayerInfo {
  id: string;
  username: string;
}

async function generateSingleEliminationBracket(
  tournamentId: string,
  players: PlayerInfo[]
) {
  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  // Calcular rondas
  const totalRounds = Math.ceil(Math.log2(shuffled.length));
  const bracketSize = Math.pow(2, totalRounds);

  // Crear matches primera ronda
  // Round names available for display: getRoundNames(totalRounds)

  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = shuffled[i * 2] ?? null;
    const p2 = shuffled[i * 2 + 1] ?? null;

    // Si alguno no existe (bye), el otro avanza
    const isBye = !p1 || !p2;
    const winner = isBye ? (p1 ?? p2) : null;

    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        player1Id: p1?.id ?? null,
        player2Id: p2?.id ?? null,
        round: `W-R1-${i + 1}`,
        bracket: "WINNERS",
        status: isBye ? "WALKOVER" : "SCHEDULED",
        winnerId: winner?.id ?? null,
      },
    });
  }

  // Create later rounds (empty, filled by advancement)
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          player1Id: null,
          player2Id: null,
          round: `W-R${r}-${i + 1}`,
          bracket: "WINNERS",
          status: "SCHEDULED",
        },
      });
    }
  }

  // Auto-advance byes
  const byeMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round: { startsWith: "W-R1-" }, status: "WALKOVER" },
  });
  for (const bye of byeMatches) {
    if (bye.winnerId && bye.round) {
      await advanceWinner(tournamentId, bye.round, bye.winnerId, "SINGLE_ELIMINATION");
    }
  }
}

async function generateLeagueMatches(
  tournamentId: string,
  players: PlayerInfo[],
  legs: number
) {
  // Crear standings para cada jugador
  for (const player of players) {
    await prisma.leagueStanding.create({
      data: {
        tournamentId,
        userId: player.id,
      },
    });
  }

  // Generar todos contra todos
  let matchday = 1;
  for (let leg = 1; leg <= legs; leg++) {
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const isHome = leg === 1;
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            player1Id: isHome ? players[i].id : players[j].id,
            player2Id: isHome ? players[j].id : players[i].id,
            round: `Jornada ${matchday}`,
            leg,
            matchday,
            status: "SCHEDULED",
          },
        });
      }
      matchday++;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRoundNames(totalRounds: number): string[] {
  const names: string[] = [];
  for (let i = totalRounds; i >= 1; i--) {
    if (i === 1) names.push("Final");
    else if (i === 2) names.push("Semifinal");
    else if (i === 3) names.push("Cuartos");
    else if (i === 4) names.push("Octavos");
    else if (i === 5) names.push("16avos");
    else if (i === 6) names.push("32avos");
    else names.push(`Ronda ${totalRounds - i + 1}`);
  }
  return names.reverse();
}

// ─── CARGAR RESULTADO (JUGADOR) ────────────────────────────

export async function submitMatchResult(
  matchId: string,
  resultP1: number,
  resultP2: number
) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) return { error: "Usuario no encontrado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match) return { error: "Partido no encontrado" };

  // Solo jugadores del partido pueden cargar resultado
  if (match.player1Id !== dbUser.id && match.player2Id !== dbUser.id) {
    return { error: "No sos parte de este partido" };
  }

  if (match.status === "FINISHED") {
    return { error: "Este partido ya tiene resultado" };
  }

  // Determinar ganador
  let winnerId: string | null = null;
  if (resultP1 > resultP2) winnerId = match.player1Id;
  else if (resultP2 > resultP1) winnerId = match.player2Id;
  // Empate: winnerId null (para liga)

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      resultP1,
      resultP2,
      winnerId,
      status: "PENDING_CONFIRMATION",
    },
  });

  revalidatePath(`/torneos/${match.tournamentId}`);
  return { success: true };
}

// ─── CONFIRMAR RESULTADO ───────────────────────────────────

export async function confirmMatchResult(matchId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) return { error: "Usuario no encontrado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "PENDING_CONFIRMATION") return { error: "Partido no está pendiente de confirmación" };

  // Solo el otro jugador puede confirmar
  if (match.player1Id !== dbUser.id && match.player2Id !== dbUser.id) {
    return { error: "No sos parte de este partido" };
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status: "FINISHED",
      confirmedAt: new Date(),
    },
  });

  // Si es liga o grupo, actualizar standings
  if (
    (match.tournament.format === "LEAGUE" || match.tournament.format === "GROUP_KNOCKOUT") &&
    match.resultP1 !== null &&
    match.resultP2 !== null
  ) {
    await updateLeagueStandings(match.tournamentId, match.player1Id!, match.player2Id!, match.resultP1, match.resultP2);

    // If group knockout, check if all group matches done → advance to knockout
    if (match.tournament.format === "GROUP_KNOCKOUT" && match.groupName) {
      await checkGroupComplete(match.tournamentId, match.tournament.groupCount ?? 4, match.tournament.qualifyPerGroup ?? 2);
    }
  }

  // Si es eliminación, avanzar ganador
  if (
    (match.tournament.format === "SINGLE_ELIMINATION" || match.tournament.format === "DOUBLE_ELIMINATION") &&
    match.winnerId &&
    match.round
  ) {
    await advanceWinner(match.tournamentId, match.round, match.winnerId, match.tournament.format);
    if (match.tournament.format === "DOUBLE_ELIMINATION" && match.player1Id && match.player2Id) {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      await sendToLosers(match.tournamentId, match.round, loserId);
    }
  }

  // Check if tournament finished
  await checkTournamentComplete(match.tournamentId);

  revalidatePath(`/torneos/${match.tournamentId}`);
  return { success: true };
}

async function updateLeagueStandings(
  tournamentId: string,
  player1Id: string,
  player2Id: string,
  resultP1: number,
  resultP2: number
) {
  const p1Won = resultP1 > resultP2;
  const p2Won = resultP2 > resultP1;
  const draw = resultP1 === resultP2;

  // Update P1
  await prisma.leagueStanding.update({
    where: { tournamentId_userId: { tournamentId, userId: player1Id } },
    data: {
      played: { increment: 1 },
      won: p1Won ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: p2Won ? { increment: 1 } : undefined,
      goalsFor: { increment: resultP1 },
      goalsAgainst: { increment: resultP2 },
      points: { increment: p1Won ? 3 : draw ? 1 : 0 },
    },
  });

  // Update P2
  await prisma.leagueStanding.update({
    where: { tournamentId_userId: { tournamentId, userId: player2Id } },
    data: {
      played: { increment: 1 },
      won: p2Won ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: p1Won ? { increment: 1 } : undefined,
      goalsFor: { increment: resultP2 },
      goalsAgainst: { increment: resultP1 },
      points: { increment: p2Won ? 3 : draw ? 1 : 0 },
    },
  });
}

// ─── DOBLE ELIMINACIÓN ────────────────────────────────────────

async function generateDoubleEliminationBracket(
  tournamentId: string,
  players: PlayerInfo[],
) {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const totalRounds = Math.ceil(Math.log2(shuffled.length));
  const bracketSize = Math.pow(2, totalRounds);

  // Winners bracket R1
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = shuffled[i * 2] ?? null;
    const p2 = shuffled[i * 2 + 1] ?? null;
    const isBye = !p1 || !p2;
    const winner = isBye ? (p1 ?? p2) : null;

    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        player1Id: p1?.id ?? null,
        player2Id: p2?.id ?? null,
        round: `W-R1-${i + 1}`,
        bracket: "WINNERS",
        status: isBye ? "WALKOVER" : "SCHEDULED",
        winnerId: winner?.id ?? null,
      },
    });
  }

  // Winners bracket rounds 2..N
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          player1Id: null,
          player2Id: null,
          round: `W-R${r}-${i + 1}`,
          bracket: "WINNERS",
          status: "SCHEDULED",
        },
      });
    }
  }

  // Losers bracket: 2*(totalRounds-1) rounds
  const losersRounds = 2 * (totalRounds - 1);
  for (let r = 1; r <= losersRounds; r++) {
    const matchCount = Math.max(1, bracketSize / Math.pow(2, Math.ceil(r / 2) + 1));
    for (let i = 0; i < matchCount; i++) {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          player1Id: null,
          player2Id: null,
          round: `L-R${r}-${i + 1}`,
          bracket: "LOSERS",
          status: "SCHEDULED",
        },
      });
    }
  }

  // Grand Final
  await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      player1Id: null,
      player2Id: null,
      round: "GF-1",
      bracket: "GRAND_FINAL",
      status: "SCHEDULED",
    },
  });

  // Auto-advance byes in winners R1
  const byeMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round: { startsWith: "W-R1-" }, status: "WALKOVER" },
  });

  for (const bye of byeMatches) {
    if (bye.winnerId && bye.round) {
      await advanceWinner(tournamentId, bye.round, bye.winnerId, "DOUBLE_ELIMINATION");
    }
  }
}

// ─── GRUPOS + ELIMINACIÓN ─────────────────────────────────────

async function generateGroupKnockoutBracket(
  tournamentId: string,
  players: PlayerInfo[],
  groupCount: number,
  qualifyPerGroup: number,
  seeding: KnockoutSeeding = "RANDOM",
  withLosers: boolean = false,
) {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const groupLabels = "ABCDEFGHIJKLMNOP";

  // Distribute players into groups (round-robin)
  const groups: PlayerInfo[][] = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((p, i) => {
    groups[i % groupCount].push(p);
  });

  // Group stage matches (round-robin within each group)
  let matchday = 1;
  for (let g = 0; g < groupCount; g++) {
    const group = groups[g];
    const label = groupLabels[g];

    // Create standings
    for (const player of group) {
      await prisma.leagueStanding.create({
        data: { tournamentId, userId: player.id },
      });
    }

    // Round-robin
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            player1Id: group[i].id,
            player2Id: group[j].id,
            round: `Grupo ${label}`,
            bracket: "WINNERS",
            groupName: label,
            matchday: matchday++,
            status: "SCHEDULED",
          },
        });
      }
    }
  }

  // Store seeding mode in tournament for use when groups finish
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { knockoutSeeding: seeding, hasLosersBracket: withLosers },
  });

  // Knockout stage placeholders (winners bracket)
  const knockoutPlayers = groupCount * qualifyPerGroup;
  const knockoutSize = Math.pow(2, Math.ceil(Math.log2(knockoutPlayers)));
  const knockoutRounds = Math.ceil(Math.log2(knockoutSize));

  for (let r = 1; r <= knockoutRounds; r++) {
    const matchCount = knockoutSize / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          player1Id: null,
          player2Id: null,
          round: `W-R${r}-${i + 1}`,
          bracket: "WINNERS",
          status: "SCHEDULED",
        },
      });
    }
  }

  // Losers bracket if enabled
  if (withLosers) {
    const losersRounds = 2 * (knockoutRounds - 1);
    for (let r = 1; r <= losersRounds; r++) {
      const matchCount = Math.max(1, knockoutSize / Math.pow(2, Math.ceil(r / 2) + 1));
      for (let i = 0; i < matchCount; i++) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            player1Id: null,
            player2Id: null,
            round: `L-R${r}-${i + 1}`,
            bracket: "LOSERS",
            status: "SCHEDULED",
          },
        });
      }
    }

    // Grand Final
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        player1Id: null,
        player2Id: null,
        round: "GF-1",
        bracket: "GRAND_FINAL",
        status: "SCHEDULED",
      },
    });
  }
}

// ─── BRACKET ADVANCEMENT ─────────────────────────────────��────

function shouldRedraw(drawUntil: DrawUntilStage, nextRoundNum: number, totalRounds: number): boolean {
  if (drawUntil === "INITIAL_ONLY") return false;
  if (drawUntil === "FINAL") return true;

  const stageFromEnd = totalRounds - nextRoundNum + 1;
  if (drawUntil === "SEMIFINALS" && stageFromEnd > 2) return true;
  if (drawUntil === "QUARTERFINALS" && stageFromEnd > 3) return true;
  return false;
}

async function advanceWinner(
  tournamentId: string,
  roundCode: string,
  winnerId: string,
  format: string,
) {
  const parts = roundCode.split("-");
  if (parts.length < 3) return;

  const bracket = parts[0];
  const roundNum = parseInt(parts[1].replace("R", ""));
  const position = parseInt(parts[2]);

  // Get tournament settings for draw mode
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
  });

  // Count total winners rounds
  const totalWinnersRounds = await prisma.tournamentMatch.findMany({
    where: { tournamentId, bracket: "WINNERS", round: { startsWith: "W-" } },
    select: { round: true },
    distinct: ["round"],
  });
  const totalRounds = totalWinnersRounds.length;

  const nextRound = roundNum + 1;

  // Check if this round should use re-draw
  const useRedraw =
    bracket === "W" &&
    tournament.knockoutSeeding === "RANDOM" &&
    shouldRedraw(tournament.randomDrawUntil, nextRound, totalRounds);

  if (useRedraw) {
    // Don't advance to fixed slot — instead check if entire current round is done
    await tryRedrawRound(tournamentId, roundNum, nextRound);
    return;
  }

  // Standard fixed-bracket advancement
  if (bracket === "W" || (bracket === "L" && format === "SINGLE_ELIMINATION")) {
    const nextPosition = Math.ceil(position / 2);
    const nextRoundCode = `${bracket}-R${nextRound}-${nextPosition}`;
    const isSlot1 = position % 2 === 1;

    const nextMatch = await prisma.tournamentMatch.findFirst({
      where: { tournamentId, round: nextRoundCode },
    });

    if (nextMatch) {
      await prisma.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: isSlot1 ? { player1Id: winnerId } : { player2Id: winnerId },
      });
    } else if (format === "DOUBLE_ELIMINATION" && bracket === "W") {
      const gf = await prisma.tournamentMatch.findFirst({
        where: { tournamentId, round: "GF-1" },
      });
      if (gf) {
        await prisma.tournamentMatch.update({
          where: { id: gf.id },
          data: { player1Id: winnerId },
        });
      }
    }
  }

  if (bracket === "L" && format === "DOUBLE_ELIMINATION") {
    const nextPosition = Math.ceil(position / 2);
    const nextRoundCode = `L-R${nextRound}-${nextPosition}`;
    const isSlot1 = position % 2 === 1;

    const nextMatch = await prisma.tournamentMatch.findFirst({
      where: { tournamentId, round: nextRoundCode },
    });

    if (nextMatch) {
      await prisma.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: isSlot1 ? { player1Id: winnerId } : { player2Id: winnerId },
      });
    } else {
      // Losers final winner → Grand Final slot 2
      const gf = await prisma.tournamentMatch.findFirst({
        where: { tournamentId, round: "GF-1" },
      });
      if (gf) {
        await prisma.tournamentMatch.update({
          where: { id: gf.id },
          data: { player2Id: winnerId },
        });
      }
    }
  }
}

async function tryRedrawRound(
  tournamentId: string,
  currentRoundNum: number,
  nextRoundNum: number,
) {
  // Check if all matches in current winners round are finished
  const currentRoundPrefix = `W-R${currentRoundNum}-`;
  const pendingInRound = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      round: { startsWith: currentRoundPrefix },
      status: { notIn: ["FINISHED", "WALKOVER", "CANCELLED"] },
    },
  });

  if (pendingInRound > 0) return;

  // All matches in this round done — collect winners
  const finishedMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      round: { startsWith: currentRoundPrefix },
      status: { in: ["FINISHED", "WALKOVER"] },
    },
  });

  const winners = finishedMatches
    .map((m) => m.winnerId)
    .filter((id): id is string => id !== null);

  // Shuffle winners for new draw
  const shuffled = [...winners].sort(() => Math.random() - 0.5);

  // Get next round matches
  const nextRoundPrefix = `W-R${nextRoundNum}-`;
  const nextMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round: { startsWith: nextRoundPrefix } },
    orderBy: { round: "asc" },
  });

  // Fill next round with shuffled pairs
  for (let i = 0; i < nextMatches.length; i++) {
    const p1 = shuffled[i * 2] ?? null;
    const p2 = shuffled[i * 2 + 1] ?? null;
    await prisma.tournamentMatch.update({
      where: { id: nextMatches[i].id },
      data: { player1Id: p1, player2Id: p2 },
    });
  }
}

async function sendToLosers(
  tournamentId: string,
  roundCode: string,
  loserId: string,
) {
  const parts = roundCode.split("-");
  if (parts.length < 3 || parts[0] !== "W") return;

  const roundNum = parseInt(parts[1].replace("R", ""));
  const position = parseInt(parts[2]);

  // Losers R1 receives losers from Winners R1
  // Losers R2 receives losers from Winners R2, etc.
  const losersRound = (roundNum - 1) * 2 + 1;
  const losersPosition = Math.ceil(position / 2);
  const losersRoundCode = `L-R${losersRound}-${losersPosition}`;
  const isSlot1 = position % 2 === 1;

  const losersMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId, round: losersRoundCode },
  });

  if (losersMatch) {
    await prisma.tournamentMatch.update({
      where: { id: losersMatch.id },
      data: isSlot1 ? { player1Id: loserId } : { player2Id: loserId },
    });
  }
}

async function checkGroupComplete(
  tournamentId: string,
  groupCount: number,
  qualifyPerGroup: number,
) {
  // Check if all group matches finished
  const pendingGroupMatches = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      round: { startsWith: "Grupo " },
      status: { not: "FINISHED" },
    },
  });

  if (pendingGroupMatches > 0) return;

  // Get tournament seeding setting
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
  });

  // All groups done — get standings sorted, advance top N per group to knockout
  const standings = await prisma.leagueStanding.findMany({
    where: { tournamentId },
    orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
  });

  // Get all group matches to determine which group each player belongs to
  const groupMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, groupName: { not: null } },
    select: { player1Id: true, player2Id: true, groupName: true },
  });

  // Build player → group map
  const playerGroup = new Map<string, string>();
  for (const m of groupMatches) {
    if (m.player1Id && m.groupName) playerGroup.set(m.player1Id, m.groupName);
    if (m.player2Id && m.groupName) playerGroup.set(m.player2Id, m.groupName);
  }

  // Group standings by group label, get qualified per group
  const groupLabels = "ABCDEFGHIJKLMNOP";
  const qualifiedByGroup: string[][] = [];

  for (let g = 0; g < groupCount; g++) {
    const label = groupLabels[g];
    const groupStandings = standings.filter((s) => playerGroup.get(s.userId) === label);
    qualifiedByGroup.push(groupStandings.slice(0, qualifyPerGroup).map((s) => s.userId));
  }

  // Build knockout seeding based on mode
  let seededPlayers: string[];

  if (tournament.knockoutSeeding === "TRADITIONAL") {
    // Traditional: 1ro A vs 2do B, 1ro B vs 2do A, 1ro C vs 2do D, etc.
    // Interleave: [1A, 2B, 1C, 2D, 1B, 2A, 1D, 2C, ...]
    seededPlayers = [];
    for (let pos = 0; pos < qualifyPerGroup; pos++) {
      for (let g = 0; g < groupCount; g++) {
        seededPlayers.push(qualifiedByGroup[g][pos]);
      }
    }
    // Re-arrange for traditional bracket: 1A vs last qualifier, etc.
    // Standard: pair 1st of group with 2nd of opposite group
    const paired: string[] = [];
    const firsts = qualifiedByGroup.map((g) => g[0]);
    const seconds = qualifiedByGroup.map((g) => g[1]).reverse();
    for (let i = 0; i < firsts.length; i++) {
      paired.push(firsts[i]);
      paired.push(seconds[i] ?? firsts[i]);
    }
    // Add remaining qualifiers if qualifyPerGroup > 2
    for (let pos = 2; pos < qualifyPerGroup; pos++) {
      for (let g = 0; g < groupCount; g++) {
        if (qualifiedByGroup[g][pos]) paired.push(qualifiedByGroup[g][pos]);
      }
    }
    seededPlayers = paired;
  } else {
    // RANDOM: shuffle all qualified players
    seededPlayers = qualifiedByGroup.flat().sort(() => Math.random() - 0.5);
  }

  // Fill knockout bracket first round
  const knockoutMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      round: { startsWith: "W-R1-" },
      bracket: "WINNERS",
    },
    orderBy: { round: "asc" },
  });

  for (let i = 0; i < knockoutMatches.length; i++) {
    const p1 = seededPlayers[i * 2] ?? null;
    const p2 = seededPlayers[i * 2 + 1] ?? null;
    if (p1 || p2) {
      await prisma.tournamentMatch.update({
        where: { id: knockoutMatches[i].id },
        data: { player1Id: p1, player2Id: p2 },
      });
    }
  }
}

async function checkTournamentComplete(tournamentId: string) {
  const unfinished = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      status: { in: ["SCHEDULED", "PENDING_CONFIRMATION", "DISPUTED"] },
      OR: [{ player1Id: { not: null } }, { player2Id: { not: null } }],
    },
  });

  if (unfinished === 0) {
    const matchCount = await prisma.tournamentMatch.count({
      where: { tournamentId, status: "FINISHED" },
    });
    if (matchCount > 0) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "FINISHED" },
      });
    }
  }
}
