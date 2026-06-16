"use server";

import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TournamentFormat, TournamentStatus, Platform, TeamType, TournamentVisibility, KnockoutSeeding, DrawUntilStage, PlayoffRule, KnockoutFormat } from "@prisma/client";
import { randomUUID } from "crypto";
import { RANKING } from "@/lib/constants";

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
  logoUrl?: string;
  bannerUrl?: string;
  visibility: TournamentVisibility;
  requiresVerification: boolean;
  matchTime?: string;
  difficulty?: string;
  controls?: string;
  gameMode?: string;
  stadium?: string;
  groupCount?: number;
  qualifyPerGroup?: number;
  knockoutSeeding?: KnockoutSeeding;
  randomDrawUntil?: DrawUntilStage;
  hasLosersBracket?: boolean;
  thirdPlaceMatch?: boolean;
  playoffRule?: PlayoffRule;
  knockoutFormat?: KnockoutFormat;
  requireProof?: boolean;
  requiresRoster?: boolean;
  relegationCount?: number;
  cup1Name?: string;
  cup1Spots?: number;
  cup2Name?: string;
  cup2Spots?: number;
  scheduleDays?: string[];
  scheduleTimeMode?: string;
  scheduleTime?: string;
  waitTimeMinutes?: number;
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
        logoUrl: input.logoUrl || null,
        bannerUrl: input.bannerUrl || null,
        visibility: input.visibility,
        requiresVerification: input.requiresVerification,
        matchTime: input.matchTime || null,
        difficulty: input.difficulty || null,
        controls: input.controls || null,
        gameMode: input.gameMode || null,
        stadium: input.stadium?.trim() || null,
        groupCount: input.format === "GROUP_KNOCKOUT" ? input.groupCount : null,
        qualifyPerGroup: input.format === "GROUP_KNOCKOUT" ? input.qualifyPerGroup : null,
        knockoutSeeding: input.knockoutSeeding ?? "RANDOM",
        randomDrawUntil: input.randomDrawUntil ?? "FINAL",
        hasLosersBracket: input.format === "DOUBLE_ELIMINATION" ? true : (input.hasLosersBracket ?? false),
        thirdPlaceMatch: input.thirdPlaceMatch ?? false,
        playoffRule: input.playoffRule ?? "PENALTIES",
        knockoutFormat: input.knockoutFormat ?? "SINGLE_MATCH",
        requireProof: input.requireProof ?? false,
        requiresRoster: input.requiresRoster ?? true,
        relegationCount: input.relegationCount ?? null,
        cup1Name: input.cup1Name ?? null,
        cup1Spots: input.cup1Spots ?? null,
        cup2Name: input.cup2Name ?? null,
        cup2Spots: input.cup2Spots ?? null,
        scheduleDays: input.scheduleDays ?? [],
        scheduleTimeMode: input.scheduleTimeMode ?? null,
        scheduleTime: input.scheduleTime ?? null,
        waitTimeMinutes: input.waitTimeMinutes ?? null,
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

    // Notify all users about new tournament
    const allUsers = await prisma.user.findMany({
      where: { id: { not: dbUser.id } },
      select: { id: true },
    });
    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          type: "NEW_TOURNAMENT",
          title: `Nuevo torneo: ${tournament.name}`,
          message: `${dbUser.username} creó un nuevo torneo. ¡Inscribite!`,
          relatedId: tournament.id,
          linkUrl: `/torneos/${tournament.id}`,
        })),
      });
    }

    revalidatePath("/torneos");
    return { success: true, tournamentId: tournament.id };
  } catch (err) {
    console.error("Error creando torneo:", err);
    return { error: "Error al crear el torneo. Intentá de nuevo." };
  }
}

// ─── EDITAR TORNEO ────────────────────────────────────────

interface UpdateTournamentInput {
  tournamentId: string;
  name?: string;
  description?: string;
  rules?: string;
  prize?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  maxPlayers?: number;
  platforms?: Platform[];
  teamType?: TeamType;
  visibility?: TournamentVisibility;
  requiresVerification?: boolean;
  registrationOpen?: string | null;
  registrationDeadline?: string | null;
  startDate?: string | null;
  matchTime?: string;
  difficulty?: string;
  controls?: string;
  gameMode?: string;
  stadium?: string;
  status?: TournamentStatus;
}

export async function updateTournament(input: UpdateTournamentInput) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "No autenticado" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
    select: { createdById: true },
  });

  if (!tournament) {
    return { error: "Torneo no encontrado" };
  }

  // Check: must be creator or admin
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permisos para editar este torneo" };
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.rules !== undefined) data.rules = input.rules?.trim() || null;
  if (input.prize !== undefined) data.prize = input.prize?.trim() || null;
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl || null;
  if (input.bannerUrl !== undefined) data.bannerUrl = input.bannerUrl || null;
  if (input.maxPlayers !== undefined) data.maxPlayers = input.maxPlayers;
  if (input.platforms !== undefined) data.platforms = input.platforms;
  if (input.teamType !== undefined) data.teamType = input.teamType;
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.requiresVerification !== undefined) data.requiresVerification = input.requiresVerification;
  if (input.registrationOpen !== undefined) data.registrationOpen = input.registrationOpen ? new Date(input.registrationOpen) : null;
  if (input.registrationDeadline !== undefined) data.registrationDeadline = input.registrationDeadline ? new Date(input.registrationDeadline) : null;
  if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.matchTime !== undefined) data.matchTime = input.matchTime || null;
  if (input.difficulty !== undefined) data.difficulty = input.difficulty || null;
  if (input.controls !== undefined) data.controls = input.controls || null;
  if (input.gameMode !== undefined) data.gameMode = input.gameMode || null;
  if (input.stadium !== undefined) data.stadium = input.stadium?.trim() || null;
  if (input.status !== undefined) data.status = input.status;

  try {
    await prisma.tournament.update({
      where: { id: input.tournamentId },
      data,
    });

    revalidatePath(`/torneos/${input.tournamentId}`);
    revalidatePath("/torneos");
    return { success: true };
  } catch (err) {
    console.error("Error actualizando torneo:", err);
    return { error: "Error al actualizar el torneo" };
  }
}

// ─── OBTENER TORNEO PARA EDICIÓN ─────────────────────────────

export async function getTournamentForEdit(tournamentId: string) {
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) return null;

  // Check permissions
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return null;
  }

  return tournament;
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

  const where: Record<string, unknown> = { deletedAt: null };

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
      logoUrl: t.logoUrl,
      bannerUrl: t.bannerUrl,
      gameMode: t.gameMode,
      startDate: t.startDate,
      registrationDeadline: t.registrationDeadline,
      prize: t.prize,
      visibility: t.visibility,
      createdBy: t.createdBy,
      createdById: t.createdById,
      requiresVerification: t.requiresVerification,
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
          team: {
            select: { id: true, name: true, tag: true, logoUrl: true, rankingPoints: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      matches: {
        include: {
          player1: { select: { id: true, username: true, avatarUrl: true } },
          player2: { select: { id: true, username: true, avatarUrl: true } },
          winner: { select: { id: true, username: true } },
          team1: { select: { id: true, name: true, tag: true, logoUrl: true } },
          team2: { select: { id: true, name: true, tag: true, logoUrl: true } },
          winnerTeam: { select: { id: true, name: true } },
        },
        orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      },
      standings: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
      chatMessages: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
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

  // Notificar al creador del torneo
  if (tournament.createdById !== dbUser.id) {
    await prisma.notification.create({
      data: {
        userId: tournament.createdById,
        type: status === "PENDING" ? "TOURNAMENT_JOIN_REQUEST" : "TOURNAMENT_INSCRIPTION",
        title: status === "PENDING"
          ? `Solicitud de inscripción en ${tournament.name}`
          : `Nuevo inscripto en ${tournament.name}`,
        message: `${dbUser.username} ${status === "PENDING" ? "solicita unirse a" : "se inscribió en"} tu torneo.`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      },
    });
  }

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true, status };
}

// ─── INSCRIBIR EQUIPO EN TORNEO ─────────────────────────────

export async function joinTournamentAsTeam(tournamentId: string, teamId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "Tenés que iniciar sesión" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      _count: { select: { participants: { where: { status: { in: ["CONFIRMED", "PENDING"] } } } } },
    },
  });
  if (!tournament) return { error: "Torneo no encontrado" };

  if (tournament.teamType !== "CLUBS_PRO" && tournament.teamType !== "RUSH") {
    return { error: "Este torneo no es de equipos" };
  }

  if (tournament.status !== "REGISTRATION") {
    return { error: "Las inscripciones no están abiertas" };
  }

  if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
    return { error: "El plazo de inscripción ya cerró" };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { members: true } } },
  });
  if (!team) return { error: "Equipo no encontrado" };

  if (team.managerId !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "Solo el DT puede inscribir al equipo" };
  }

  const expectedMode = tournament.teamType === "CLUBS_PRO" ? "CLUBS_PRO" : "RUSH";
  if (team.mode !== expectedMode) {
    return { error: `Este torneo es de ${expectedMode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}. Tu equipo es de ${team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}.` };
  }

  if (tournament.requiresRoster) {
    const minPlayers = team.mode === "CLUBS_PRO" ? 11 : 5;
    if (team._count.members < minPlayers) {
      return { error: `Necesitás al menos ${minPlayers} jugadores en la lista de buena fe` };
    }
  }

  const existing = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
  if (existing) return { error: "El equipo ya está inscripto" };

  const isFull = tournament._count.participants >= tournament.maxPlayers;
  if (isFull) return { error: "El torneo está lleno" };

  const status = tournament.requiresVerification ? "PENDING" : "CONFIRMED";
  await prisma.tournamentParticipant.create({
    data: {
      tournamentId,
      userId: dbUser.id,
      teamId,
      status,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  });

  if (tournament.createdById !== dbUser.id) {
    await prisma.notification.create({
      data: {
        userId: tournament.createdById,
        type: status === "PENDING" ? "TOURNAMENT_JOIN_REQUEST" : "TOURNAMENT_INSCRIPTION",
        title: status === "PENDING"
          ? `Solicitud de inscripción: ${team.name}`
          : `Nuevo equipo inscripto: ${team.name}`,
        message: `${team.name} (DT: ${dbUser.username}) ${status === "PENDING" ? "solicita unirse a" : "se inscribió en"} tu torneo.`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      },
    });
  }

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true, status };
}

// ─── ACEPTAR / RECHAZAR SOLICITUDES ───────────────────────

export async function acceptParticipant(tournamentId: string, participantUserId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return { error: "Torneo no encontrado" };

  // Solo creador o admin
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permisos para aceptar solicitudes" };
  }

  const participant = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: participantUserId } },
  });

  if (!participant || participant.status !== "PENDING") {
    return { error: "Solicitud no encontrada o ya procesada" };
  }

  await prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });

  // Notificar al usuario aceptado
  await prisma.notification.create({
    data: {
      userId: participantUserId,
      type: "TOURNAMENT_JOIN_ACCEPTED",
      title: `¡Inscripción aceptada!`,
      message: `Tu solicitud para ${tournament.name} fue aceptada. Ya estás inscripto.`,
      relatedId: tournamentId,
      linkUrl: `/torneos/${tournamentId}`,
    },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

export async function rejectParticipant(tournamentId: string, participantUserId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return { error: "Torneo no encontrado" };

  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permisos para rechazar solicitudes" };
  }

  const participant = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: participantUserId } },
  });

  if (!participant || participant.status !== "PENDING") {
    return { error: "Solicitud no encontrada o ya procesada" };
  }

  await prisma.tournamentParticipant.update({
    where: { id: participant.id },
    data: { status: "REJECTED" },
  });

  // Notificar al usuario rechazado
  await prisma.notification.create({
    data: {
      userId: participantUserId,
      type: "TOURNAMENT_JOIN_REJECTED",
      title: `Solicitud rechazada`,
      message: `Tu solicitud para ${tournament.name} fue rechazada.`,
      relatedId: tournamentId,
      linkUrl: `/torneos/${tournamentId}`,
    },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
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
        include: { user: true, team: true },
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

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "SETUP" },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true, redirectTo: `/torneos/${tournamentId}/sorteo` };
}

// ─── DATOS PARA SORTEO ──────────────────────────────────────

export async function getDrawData(tournamentId: string) {
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      teamType: true,
      groupCount: true,
      qualifyPerGroup: true,
      knockoutSeeding: true,
      hasLosersBracket: true,
      knockoutFormat: true,
      leagueLegs: true,
      createdById: true,
      participants: {
        where: { status: "CONFIRMED" },
        include: { user: { select: { id: true, username: true, avatarUrl: true } }, team: { select: { id: true, name: true, logoUrl: true } } },
      },
    },
  });

  if (!tournament) return null;
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") return null;

  const isTeamTournament = tournament.teamType === "CLUBS_PRO" || tournament.teamType === "RUSH";

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      groupCount: tournament.groupCount ?? 4,
      qualifyPerGroup: tournament.qualifyPerGroup ?? 2,
      hasLosersBracket: tournament.hasLosersBracket,
      knockoutFormat: tournament.knockoutFormat,
      leagueLegs: tournament.leagueLegs ?? 1,
      isTeamTournament,
    },
    participants: tournament.participants.map((p) => ({
      id: p.user.id,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl,
      teamId: p.teamId,
      teamName: p.team?.name ?? null,
      teamLogoUrl: p.team?.logoUrl ?? null,
      displayName: isTeamTournament && p.team ? p.team.name : p.user.username,
    })),
  };
}

// ─── CONFIRMAR SORTEO Y GENERAR PARTIDOS ────────────────────

interface DrawConfig {
  mode: "RANDOM" | "SEEDED" | "MANUAL" | "MATCHDAY";
  seeds?: string[];
  groups?: Record<string, string[]>;
  bracket?: string[];
  matchdays?: { matchday: number; matches: { p1: string; p2: string }[] }[];
}

export async function confirmDraw(tournamentId: string, config: DrawConfig) {
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
        include: { user: true, team: true },
      },
    },
  });

  if (!tournament) return { error: "Torneo no encontrado" };
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permiso" };
  }
  if (tournament.status !== "SETUP") return { error: "El torneo no está en fase de sorteo" };

  const isTeamTournament = tournament.teamType === "CLUBS_PRO" || tournament.teamType === "RUSH";
  const players: PlayerInfo[] = tournament.participants.map((p) => ({
    id: p.user.id,
    username: isTeamTournament && p.team ? p.team.name : p.user.username,
    teamId: p.teamId,
  }));

  const withLosers = tournament.hasLosersBracket || tournament.format === "DOUBLE_ELIMINATION";

  // Atomic: lock row first to prevent double-confirmDraw race condition
  try {
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent race
      const locked = await tx.tournament.update({
        where: { id: tournamentId, status: "SETUP" },
        data: { drawMode: config.mode, drawData: config as object },
      });
      if (!locked) throw new Error("RACE");
    });
  } catch {
    return { error: "El torneo ya no está en fase de sorteo" };
  }

  try {
    if (tournament.format === "GROUP_KNOCKOUT") {
      if (config.mode === "MANUAL" && config.groups) {
        await generateGroupKnockoutManual(
          tournament.id,
          players,
          config.groups,
          tournament.qualifyPerGroup ?? 2,
          tournament.knockoutSeeding,
          withLosers,
        );
      } else if (config.mode === "SEEDED" && config.seeds) {
        await generateGroupKnockoutSeeded(
          tournament.id,
          players,
          config.seeds,
          tournament.groupCount ?? 4,
          tournament.qualifyPerGroup ?? 2,
          tournament.knockoutSeeding,
          withLosers,
        );
      } else {
        await generateGroupKnockoutBracket(
          tournament.id,
          players,
          tournament.groupCount ?? 4,
          tournament.qualifyPerGroup ?? 2,
          tournament.knockoutSeeding,
          withLosers,
        );
      }
    } else if (tournament.format === "LEAGUE") {
      if (config.mode === "MATCHDAY" && config.matchdays) {
        await generateLeagueManual(tournament.id, players, config.matchdays, tournament.leagueLegs ?? 1);
      } else {
        await generateLeagueMatches(tournament.id, players, tournament.leagueLegs ?? 1);
      }
    } else if (tournament.format === "SINGLE_ELIMINATION" || tournament.format === "DOUBLE_ELIMINATION") {
      if (config.mode === "MANUAL" && config.bracket) {
        const ordered = orderPlayersByBracket(players, config.bracket);
        if (withLosers) {
          await generateDoubleEliminationBracket(tournament.id, ordered, tournament.knockoutFormat, true);
        } else {
          await generateSingleEliminationBracket(tournament.id, ordered, tournament.knockoutFormat, true);
        }
      } else if (config.mode === "SEEDED" && config.seeds) {
        const ordered = orderPlayersBySeeds(players, config.seeds);
        if (withLosers) {
          await generateDoubleEliminationBracket(tournament.id, ordered, tournament.knockoutFormat, true);
        } else {
          await generateSingleEliminationBracket(tournament.id, ordered, tournament.knockoutFormat, true);
        }
      } else {
        if (withLosers) {
          await generateDoubleEliminationBracket(tournament.id, players, tournament.knockoutFormat);
        } else {
          await generateSingleEliminationBracket(tournament.id, players, tournament.knockoutFormat);
        }
      }
    }
  } catch (err) {
    // Rollback: delete any partial matches created, reset to SETUP
    await prisma.leagueStanding.deleteMany({ where: { tournamentId } });
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId } });
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "SETUP", drawMode: "RANDOM", drawData: Prisma.DbNull },
    });
    return { error: `Error generando partidos: ${err instanceof Error ? err.message : "desconocido"}` };
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
      details: `Torneo iniciado con ${players.length} jugadores. Modo sorteo: ${config.mode}`,
    },
  });

  await prisma.notification.createMany({
    data: tournament.participants
      .filter((p) => p.userId !== dbUser.id)
      .map((p) => ({
        userId: p.userId,
        type: "TOURNAMENT_STARTING" as const,
        title: `¡${tournament.name} arrancó!`,
        message: `El torneo ya comenzó con ${players.length} jugadores. Revisá tus partidos.`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      })),
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

function orderPlayersByBracket(players: PlayerInfo[], bracketOrder: string[]): PlayerInfo[] {
  const map = new Map(players.map((p) => [p.id, p]));
  const ordered: PlayerInfo[] = [];
  for (const id of bracketOrder) {
    const p = map.get(id);
    if (p) ordered.push(p);
  }
  const remaining = players.filter((p) => !bracketOrder.includes(p.id));
  remaining.sort(() => Math.random() - 0.5);
  return [...ordered, ...remaining];
}

function orderPlayersBySeeds(players: PlayerInfo[], seeds: string[]): PlayerInfo[] {
  const seedSet = new Set(seeds);
  const seeded = seeds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as PlayerInfo[];
  const unseeded = players.filter((p) => !seedSet.has(p.id));
  unseeded.sort(() => Math.random() - 0.5);

  if (seeded.length === 0) return unseeded;

  const totalSlots = Math.pow(2, Math.ceil(Math.log2(players.length)));
  const result: PlayerInfo[] = new Array(totalSlots);
  const seedPositions = getSeedPositions(totalSlots, seeded.length);
  seeded.forEach((p, i) => {
    result[seedPositions[i]] = p;
  });
  let ui = 0;
  for (let i = 0; i < totalSlots; i++) {
    if (!result[i] && ui < unseeded.length) {
      result[i] = unseeded[ui++];
    }
  }
  return result.filter(Boolean);
}

function getSeedPositions(totalSlots: number, seedCount: number): number[] {
  const positions: number[] = [0, totalSlots - 1];
  if (seedCount <= 2) return positions.slice(0, seedCount);

  const mid = Math.floor(totalSlots / 2);
  positions.push(mid, mid - 1);
  if (seedCount <= 4) return positions.slice(0, seedCount);

  const q1 = Math.floor(totalSlots / 4);
  const q3 = Math.floor(3 * totalSlots / 4);
  positions.push(q1, q3 - 1, q3, q1 - 1);
  return positions.slice(0, seedCount);
}

async function generateGroupKnockoutSeeded(
  tournamentId: string,
  players: PlayerInfo[],
  seeds: string[],
  groupCount: number,
  qualifyPerGroup: number,
  seeding: KnockoutSeeding = "RANDOM",
  withLosers: boolean = false,
) {
  const seedSet = new Set(seeds);
  const seeded = seeds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as PlayerInfo[];
  const unseeded = players.filter((p) => !seedSet.has(p.id));
  unseeded.sort(() => Math.random() - 0.5);

  const groups: PlayerInfo[][] = Array.from({ length: groupCount }, () => []);
  seeded.forEach((p, i) => {
    groups[i % groupCount].push(p);
  });
  unseeded.forEach((p, i) => {
    groups[i % groupCount].push(p);
  });

  await createGroupMatches(tournamentId, groups, qualifyPerGroup, seeding, withLosers);
}

async function generateGroupKnockoutManual(
  tournamentId: string,
  players: PlayerInfo[],
  groupAssignments: Record<string, string[]>,
  qualifyPerGroup: number,
  seeding: KnockoutSeeding = "RANDOM",
  withLosers: boolean = false,
) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const groupLabels = Object.keys(groupAssignments).sort();
  const groups: PlayerInfo[][] = groupLabels.map((label) =>
    groupAssignments[label].map((id) => playerMap.get(id)).filter(Boolean) as PlayerInfo[]
  );

  await createGroupMatches(tournamentId, groups, qualifyPerGroup, seeding, withLosers);
}

async function createGroupMatches(
  tournamentId: string,
  groups: PlayerInfo[][],
  qualifyPerGroup: number,
  seeding: KnockoutSeeding,
  withLosers: boolean,
) {
  const groupLabels = "ABCDEFGHIJKLMNOP";
  const groupCount = groups.length;

  for (let g = 0; g < groupCount; g++) {
    const group = groups[g];
    const label = groupLabels[g];

    for (const player of group) {
      await prisma.leagueStanding.create({
        data: { tournamentId, userId: player.id },
      });
    }

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            player1Id: group[i].id,
            player2Id: group[j].id,
            team1Id: group[i].teamId ?? null,
            team2Id: group[j].teamId ?? null,
            round: `Grupo ${label}`,
            groupName: label,
            status: "SCHEDULED",
          },
        });
      }
    }
  }

  const knockoutPlayers = groupCount * qualifyPerGroup;
  const totalRounds = Math.ceil(Math.log2(knockoutPlayers));
  const roundNames = getRoundNames(totalRounds);
  let prevRoundMatches: string[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const matchesInRound = Math.pow(2, totalRounds - r - 1);
    const currentRoundMatches: string[] = [];

    for (let m = 0; m < matchesInRound; m++) {
      const match = await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          round: roundNames[r],
          bracket: "WINNERS",
          status: "SCHEDULED",
        },
      });
      currentRoundMatches.push(match.id);
    }
    prevRoundMatches = currentRoundMatches;
  }

  if (withLosers && prevRoundMatches.length > 0) {
    const losersRounds = 2 * (totalRounds - 1);
    for (let r = 0; r < losersRounds; r++) {
      const matchesInRound = Math.max(1, Math.pow(2, totalRounds - Math.ceil((r + 1) / 2) - 1));
      for (let m = 0; m < matchesInRound; m++) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round: `Losers R${r + 1}`,
            bracket: "LOSERS",
            status: "SCHEDULED",
          },
        });
      }
    }
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        round: "Gran Final",
        bracket: "WINNERS",
        status: "SCHEDULED",
      },
    });
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { knockoutSeeding: seeding, hasLosersBracket: withLosers },
  });
}

async function generateLeagueManual(
  tournamentId: string,
  players: PlayerInfo[],
  matchdays: { matchday: number; matches: { p1: string; p2: string }[] }[],
  legs: number,
) {
  for (const player of players) {
    await prisma.leagueStanding.create({
      data: { tournamentId, userId: player.id },
    });
  }

  const playerMap = new Map(players.map((p) => [p.id, p]));

  for (let leg = 1; leg <= legs; leg++) {
    for (const md of matchdays) {
      const dayNum = leg === 1 ? md.matchday : md.matchday + matchdays.length;
      for (const m of md.matches) {
        const home = leg === 1 ? playerMap.get(m.p1) : playerMap.get(m.p2);
        const away = leg === 1 ? playerMap.get(m.p2) : playerMap.get(m.p1);
        if (!home || !away) continue;
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            player1Id: home.id,
            player2Id: away.id,
            team1Id: home.teamId ?? null,
            team2Id: away.teamId ?? null,
            round: `Jornada ${dayNum}`,
            leg,
            matchday: dayNum,
            status: "SCHEDULED",
          },
        });
      }
    }
  }
}

// ─── GENERAR BRACKETS ──────────────────────────────────────

interface PlayerInfo {
  id: string;
  username: string;
  teamId?: string | null;
}

// ─── SERIES HELPERS (ida/vuelta, best-of-N) ──────────────

function getSeriesMatchCount(format: KnockoutFormat): number {
  switch (format) {
    case "TWO_LEG":
    case "TWO_LEG_PENALTIES":
    case "TWO_LEG_EXTRA_PENALTIES":
      return 2;
    case "BEST_OF_3":
      return 3;
    case "BEST_OF_5":
      return 5;
    default:
      return 1;
  }
}

async function createSeriesMatches(
  tournamentId: string,
  anchorMatchId: string,
  knockoutFormat: KnockoutFormat,
) {
  const count = getSeriesMatchCount(knockoutFormat);
  if (count <= 1) return;

  const anchor = await prisma.tournamentMatch.findUniqueOrThrow({
    where: { id: anchorMatchId },
  });

  if (!anchor.player1Id || !anchor.player2Id) return;

  const seriesId = randomUUID();
  const isTwoLeg = knockoutFormat.startsWith("TWO_LEG");

  await prisma.tournamentMatch.update({
    where: { id: anchorMatchId },
    data: { seriesId, leg: 1 },
  });

  for (let leg = 2; leg <= count; leg++) {
    const swapPlayers = isTwoLeg && leg === 2;
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        player1Id: swapPlayers ? anchor.player2Id : anchor.player1Id,
        player2Id: swapPlayers ? anchor.player1Id : anchor.player2Id,
        round: anchor.round,
        bracket: anchor.bracket,
        seriesId,
        leg,
        status: "SCHEDULED",
      },
    });
  }
}

async function checkSeriesResult(
  seriesId: string,
  knockoutFormat: KnockoutFormat,
): Promise<{ decided: boolean; winnerId: string | null; needsTiebreaker: boolean }> {
  const matches = await prisma.tournamentMatch.findMany({
    where: { seriesId },
    orderBy: { leg: "asc" },
  });

  const finished = matches.filter((m) => m.status === "FINISHED");

  if (
    knockoutFormat === "TWO_LEG" ||
    knockoutFormat === "TWO_LEG_PENALTIES" ||
    knockoutFormat === "TWO_LEG_EXTRA_PENALTIES"
  ) {
    const leg1 = matches.find((m) => m.leg === 1);
    const leg2 = matches.find((m) => m.leg === 2);
    if (!leg1 || !leg2) return { decided: false, winnerId: null, needsTiebreaker: false };

    if (leg1.status !== "FINISHED" || leg2.status !== "FINISHED") {
      return { decided: false, winnerId: null, needsTiebreaker: false };
    }

    const playerA = leg1.player1Id!;
    const playerB = leg1.player2Id!;

    let aggA = leg1.resultP1 ?? 0;
    let aggB = leg1.resultP2 ?? 0;

    if (leg2.player1Id === playerA) {
      aggA += leg2.resultP1 ?? 0;
      aggB += leg2.resultP2 ?? 0;
    } else {
      aggA += leg2.resultP2 ?? 0;
      aggB += leg2.resultP1 ?? 0;
    }

    if (aggA > aggB) return { decided: true, winnerId: playerA, needsTiebreaker: false };
    if (aggB > aggA) return { decided: true, winnerId: playerB, needsTiebreaker: false };

    // Aggregate tied — check for tiebreaker match (leg 3)
    const tiebreaker = matches.find((m) => m.leg === 3);
    if (tiebreaker?.status === "FINISHED" && tiebreaker.winnerId) {
      return { decided: true, winnerId: tiebreaker.winnerId, needsTiebreaker: false };
    }

    // Need tiebreaker
    return { decided: false, winnerId: null, needsTiebreaker: !tiebreaker };
  }

  // BEST_OF_3 or BEST_OF_5
  const winsNeeded = knockoutFormat === "BEST_OF_3" ? 2 : 3;
  const playerA = matches[0]?.player1Id;
  const playerB = matches[0]?.player2Id;
  if (!playerA || !playerB) return { decided: false, winnerId: null, needsTiebreaker: false };

  let winsA = 0;
  let winsB = 0;
  for (const m of finished) {
    if (m.winnerId === playerA) winsA++;
    else if (m.winnerId === playerB) winsB++;
  }

  if (winsA >= winsNeeded) return { decided: true, winnerId: playerA, needsTiebreaker: false };
  if (winsB >= winsNeeded) return { decided: true, winnerId: playerB, needsTiebreaker: false };

  return { decided: false, winnerId: null, needsTiebreaker: false };
}

async function cancelRemainingSeriesMatches(seriesId: string) {
  await prisma.tournamentMatch.updateMany({
    where: {
      seriesId,
      status: { in: ["SCHEDULED", "READY_P1", "READY_P2"] },
    },
    data: { status: "CANCELLED" },
  });
}

// ─── GENERAR BRACKETS ──────────────────────────────────────

async function generateSingleEliminationBracket(
  tournamentId: string,
  players: PlayerInfo[],
  knockoutFormat: KnockoutFormat = "SINGLE_MATCH",
  skipShuffle: boolean = false,
) {
  const shuffled = skipShuffle ? [...players] : [...players].sort(() => Math.random() - 0.5);

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
        team1Id: p1?.teamId ?? null,
        team2Id: p2?.teamId ?? null,
        round: `W-R1-${i + 1}`,
        bracket: "WINNERS",
        status: isBye ? "WALKOVER" : "SCHEDULED",
        winnerId: winner?.id ?? null,
        winnerTeamId: isBye ? (winner?.teamId ?? null) : null,
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
      await advanceWinner(tournamentId, bye.round, bye.winnerId, "SINGLE_ELIMINATION", bye.winnerTeamId);
    }
  }

  // Create series matches for R1 non-bye matches
  if (knockoutFormat !== "SINGLE_MATCH") {
    const r1Matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId, round: { startsWith: "W-R1-" }, status: "SCHEDULED" },
    });
    for (const m of r1Matches) {
      if (m.player1Id && m.player2Id) {
        await createSeriesMatches(tournamentId, m.id, knockoutFormat);
      }
    }
  }
}

async function generateLeagueMatches(
  tournamentId: string,
  players: PlayerInfo[],
  legs: number
) {
  for (const player of players) {
    await prisma.leagueStanding.create({
      data: {
        tournamentId,
        userId: player.id,
      },
    });
  }

  // Round-robin scheduling (circle method)
  const ids = players.map((_, i) => i);
  const isOdd = players.length % 2 !== 0;
  if (isOdd) ids.push(-1); // BYE slot
  const total = ids.length;
  const rounds = total - 1;
  const half = total / 2;
  for (let leg = 1; leg <= legs; leg++) {
    // Reset rotation for each leg
    const rot = [...ids];
    for (let r = 0; r < rounds; r++) {
      const dayNum = leg === 1 ? r + 1 : rounds + r + 1;
      for (let i = 0; i < half; i++) {
        const hIdx = rot[i];
        const aIdx = rot[total - 1 - i];
        if (hIdx === -1 || aIdx === -1) continue; // skip BYE
        const home = leg === 1 ? players[hIdx] : players[aIdx];
        const away = leg === 1 ? players[aIdx] : players[hIdx];
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            player1Id: home.id,
            player2Id: away.id,
            team1Id: home.teamId ?? null,
            team2Id: away.teamId ?? null,
            round: `Jornada ${dayNum}`,
            leg,
            matchday: dayNum,
            status: "SCHEDULED",
          },
        });
      }
      // Rotate: fix first element, rotate rest
      const last = rot.pop()!;
      rot.splice(1, 0, last);
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

  // Update ranking points
  if (match.player1Id && match.player2Id && match.resultP1 !== null && match.resultP2 !== null) {
    const winnerId = match.resultP1 > match.resultP2 ? match.player1Id : match.resultP2 > match.resultP1 ? match.player2Id : null;
    const p1Pts = winnerId === match.player1Id ? RANKING.WIN : winnerId === match.player2Id ? RANKING.LOSS : RANKING.DRAW;
    const p2Pts = winnerId === match.player2Id ? RANKING.WIN : winnerId === match.player1Id ? RANKING.LOSS : RANKING.DRAW;

    await prisma.user.update({ where: { id: match.player1Id }, data: { rankingPoints: { increment: p1Pts } } });
    await prisma.rankingHistory.create({ data: { userId: match.player1Id, tournamentMatchId: matchId, pointsChange: p1Pts, reason: p1Pts === RANKING.WIN ? "Victoria en torneo" : p1Pts === RANKING.DRAW ? "Empate en torneo" : "Derrota en torneo" } });
    await prisma.user.update({ where: { id: match.player2Id }, data: { rankingPoints: { increment: p2Pts } } });
    await prisma.rankingHistory.create({ data: { userId: match.player2Id, tournamentMatchId: matchId, pointsChange: p2Pts, reason: p2Pts === RANKING.WIN ? "Victoria en torneo" : p2Pts === RANKING.DRAW ? "Empate en torneo" : "Derrota en torneo" } });

    // Update team stats if team tournament
    if (match.team1Id && match.team2Id) {
      await updateTeamStats(match.team1Id, match.team2Id, match.resultP1, match.resultP2);
    }
  }

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
    const winTeamId = match.winnerId === match.player1Id ? match.team1Id : match.team2Id;
    await advanceWinner(match.tournamentId, match.round, match.winnerId, match.tournament.format, winTeamId);
    if (match.tournament.format === "DOUBLE_ELIMINATION" && match.player1Id && match.player2Id) {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      const loserTeamId = match.winnerId === match.player1Id ? match.team2Id : match.team1Id;
      await sendToLosers(match.tournamentId, match.round, loserId, loserTeamId);
    }
  }

  // Notify both players result confirmed
  if (match.player1Id && match.player2Id && match.resultP1 !== null && match.resultP2 !== null) {
    const p1 = await prisma.user.findUnique({ where: { id: match.player1Id }, select: { username: true } });
    const p2 = await prisma.user.findUnique({ where: { id: match.player2Id }, select: { username: true } });
    const scoreText = `${match.resultP1}-${match.resultP2}`;
    const winnerId = match.resultP1 > match.resultP2 ? match.player1Id : match.resultP2 > match.resultP1 ? match.player2Id : null;

    for (const playerId of [match.player1Id, match.player2Id]) {
      const isWinner = winnerId === playerId;
      const isDraw = !winnerId;
      const rivalName = playerId === match.player1Id ? p2?.username : p1?.username;
      await prisma.notification.create({
        data: {
          userId: playerId,
          type: "RESULT_CONFIRMED",
          title: isDraw ? `Empate ${scoreText}` : isWinner ? `¡Ganaste ${scoreText}!` : `Perdiste ${scoreText}`,
          message: `Resultado confirmado vs ${rivalName ?? "rival"} en ${match.tournament.name}.`,
          relatedId: match.tournamentId,
          linkUrl: `/torneos/${match.tournamentId}`,
        },
      });
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

// ─── ACTUALIZAR STATS DE EQUIPO ──────────────────────────────

async function updateTeamStats(
  team1Id: string,
  team2Id: string,
  resultP1: number,
  resultP2: number,
) {
  const t1Won = resultP1 > resultP2;
  const t2Won = resultP2 > resultP1;
  const draw = resultP1 === resultP2;

  await prisma.team.update({
    where: { id: team1Id },
    data: {
      won: t1Won ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: t2Won ? { increment: 1 } : undefined,
      goalsFor: { increment: resultP1 },
      goalsAgainst: { increment: resultP2 },
      rankingPoints: { increment: t1Won ? RANKING.WIN : draw ? RANKING.DRAW : RANKING.LOSS },
    },
  });

  await prisma.team.update({
    where: { id: team2Id },
    data: {
      won: t2Won ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: t1Won ? { increment: 1 } : undefined,
      goalsFor: { increment: resultP2 },
      goalsAgainst: { increment: resultP1 },
      rankingPoints: { increment: t2Won ? RANKING.WIN : draw ? RANKING.DRAW : RANKING.LOSS },
    },
  });
}

// ─── DOBLE ELIMINACIÓN ────────────────────────────────────────

async function generateDoubleEliminationBracket(
  tournamentId: string,
  players: PlayerInfo[],
  knockoutFormat: KnockoutFormat = "SINGLE_MATCH",
  skipShuffle: boolean = false,
) {
  const shuffled = skipShuffle ? [...players] : [...players].sort(() => Math.random() - 0.5);
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
        team1Id: p1?.teamId ?? null,
        team2Id: p2?.teamId ?? null,
        round: `W-R1-${i + 1}`,
        bracket: "WINNERS",
        status: isBye ? "WALKOVER" : "SCHEDULED",
        winnerId: winner?.id ?? null,
        winnerTeamId: isBye ? (winner?.teamId ?? null) : null,
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
      await advanceWinner(tournamentId, bye.round, bye.winnerId, "DOUBLE_ELIMINATION", bye.winnerTeamId);
    }
  }

  // Create series matches for R1 non-bye matches
  if (knockoutFormat !== "SINGLE_MATCH") {
    const r1Matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId, round: { startsWith: "W-R1-" }, status: "SCHEDULED" },
    });
    for (const m of r1Matches) {
      if (m.player1Id && m.player2Id) {
        await createSeriesMatches(tournamentId, m.id, knockoutFormat);
      }
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
            team1Id: group[i].teamId ?? null,
            team2Id: group[j].teamId ?? null,
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
  winnerTeamId?: string | null,
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
        data: isSlot1
          ? { player1Id: winnerId, team1Id: winnerTeamId ?? undefined }
          : { player2Id: winnerId, team2Id: winnerTeamId ?? undefined },
      });
      await notifyNextMatchReady(nextMatch.id, tournamentId);
    } else if (format === "DOUBLE_ELIMINATION" && bracket === "W") {
      const gf = await prisma.tournamentMatch.findFirst({
        where: { tournamentId, round: "GF-1" },
      });
      if (gf) {
        await prisma.tournamentMatch.update({
          where: { id: gf.id },
          data: { player1Id: winnerId, team1Id: winnerTeamId ?? undefined },
        });
        await notifyNextMatchReady(gf.id, tournamentId);
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
        data: isSlot1
          ? { player1Id: winnerId, team1Id: winnerTeamId ?? undefined }
          : { player2Id: winnerId, team2Id: winnerTeamId ?? undefined },
      });
      await notifyNextMatchReady(nextMatch.id, tournamentId);
    } else {
      // Losers final winner → Grand Final slot 2
      const gf = await prisma.tournamentMatch.findFirst({
        where: { tournamentId, round: "GF-1" },
      });
      if (gf) {
        await prisma.tournamentMatch.update({
          where: { id: gf.id },
          data: { player2Id: winnerId, team2Id: winnerTeamId ?? undefined },
        });
        await notifyNextMatchReady(gf.id, tournamentId);
      }
    }
  }
}

/** Notify both players (and team members for team tournaments) when their next match has both participants assigned */
async function notifyNextMatchReady(matchId: string, tournamentId: string) {
  const updatedMatch = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { player1Id: true, player2Id: true, team1Id: true, team2Id: true, seriesId: true },
  });
  if (!updatedMatch?.player1Id || !updatedMatch?.player2Id) return;

  // Both players assigned → create series matches if needed
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, knockoutFormat: true },
  });

  if (
    tournament?.knockoutFormat &&
    tournament.knockoutFormat !== "SINGLE_MATCH" &&
    !updatedMatch.seriesId
  ) {
    await createSeriesMatches(tournamentId, matchId, tournament.knockoutFormat);
  }

  // Collect all user IDs to notify (DTs + team members)
  const notifyUserIds = new Set([updatedMatch.player1Id, updatedMatch.player2Id]);

  const teamIds = [updatedMatch.team1Id, updatedMatch.team2Id].filter(Boolean) as string[];
  if (teamIds.length > 0) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true },
    });
    for (const tm of teamMembers) notifyUserIds.add(tm.userId);
  }

  await prisma.notification.createMany({
    data: Array.from(notifyUserIds).map((userId) => ({
      userId,
      type: "MATCH_ASSIGNED" as const,
      title: "Siguiente partido disponible 🏟️",
      message: `Tu próximo partido en ${tournament?.name ?? "el torneo"} está listo. ¡Entrá a jugar!`,
      relatedId: matchId,
      linkUrl: `/arena/${matchId}`,
    })),
  });
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

  // Collect unique winners (for series, same winnerId appears per leg — deduplicate by seriesId)
  const seenSeries = new Set<string>();
  const winners: { id: string; teamId: string | null }[] = [];
  for (const m of finishedMatches) {
    if (!m.winnerId) continue;
    if (m.seriesId) {
      if (seenSeries.has(m.seriesId)) continue;
      seenSeries.add(m.seriesId);
    }
    winners.push({ id: m.winnerId, teamId: m.winnerTeamId });
  }

  // Shuffle winners for new draw
  const shuffled = [...winners].sort(() => Math.random() - 0.5);

  // Get next round matches
  const nextRoundPrefix = `W-R${nextRoundNum}-`;
  const nextMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round: { startsWith: nextRoundPrefix } },
    orderBy: { round: "asc" },
  });

  // Fill next round with shuffled pairs and notify
  for (let i = 0; i < nextMatches.length; i++) {
    const p1 = shuffled[i * 2] ?? null;
    const p2 = shuffled[i * 2 + 1] ?? null;
    await prisma.tournamentMatch.update({
      where: { id: nextMatches[i].id },
      data: {
        player1Id: p1?.id ?? null,
        player2Id: p2?.id ?? null,
        team1Id: p1?.teamId ?? null,
        team2Id: p2?.teamId ?? null,
      },
    });
    if (p1 && p2) {
      await notifyNextMatchReady(nextMatches[i].id, tournamentId);
    }
  }
}

async function sendToLosers(
  tournamentId: string,
  roundCode: string,
  loserId: string,
  loserTeamId?: string | null,
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
      data: isSlot1
        ? { player1Id: loserId, team1Id: loserTeamId ?? undefined }
        : { player2Id: loserId, team2Id: loserTeamId ?? undefined },
    });
    await notifyNextMatchReady(losersMatch.id, tournamentId);
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
    select: { player1Id: true, player2Id: true, team1Id: true, team2Id: true, groupName: true },
  });

  // Build player → group map and player → teamId map
  const playerGroup = new Map<string, string>();
  const playerTeam = new Map<string, string | null>();
  for (const m of groupMatches) {
    if (m.player1Id && m.groupName) {
      playerGroup.set(m.player1Id, m.groupName);
      if (m.team1Id) playerTeam.set(m.player1Id, m.team1Id);
    }
    if (m.player2Id && m.groupName) {
      playerGroup.set(m.player2Id, m.groupName);
      if (m.team2Id) playerTeam.set(m.player2Id, m.team2Id);
    }
  }

  // Group standings by group label, get qualified per group
  const groupLabels = "ABCDEFGHIJKLMNOP";
  type QPlayer = { id: string; teamId: string | null };
  const qualifiedByGroup: QPlayer[][] = [];

  for (let g = 0; g < groupCount; g++) {
    const label = groupLabels[g];
    const groupStandings = standings.filter((s) => playerGroup.get(s.userId) === label);
    qualifiedByGroup.push(
      groupStandings.slice(0, qualifyPerGroup).map((s) => ({
        id: s.userId,
        teamId: playerTeam.get(s.userId) ?? null,
      }))
    );
  }

  // Build knockout seeding based on mode
  let seededPlayers: QPlayer[];

  if (tournament.knockoutSeeding === "TRADITIONAL") {
    seededPlayers = [];
    const paired: QPlayer[] = [];
    const firsts = qualifiedByGroup.map((g) => g[0]);
    const seconds = qualifiedByGroup.map((g) => g[1]).reverse();
    for (let i = 0; i < firsts.length; i++) {
      paired.push(firsts[i]);
      paired.push(seconds[i] ?? firsts[i]);
    }
    for (let pos = 2; pos < qualifyPerGroup; pos++) {
      for (let g = 0; g < groupCount; g++) {
        if (qualifiedByGroup[g][pos]) paired.push(qualifiedByGroup[g][pos]);
      }
    }
    seededPlayers = paired;
  } else {
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
        data: {
          player1Id: p1?.id ?? null,
          player2Id: p2?.id ?? null,
          team1Id: p1?.teamId ?? undefined,
          team2Id: p2?.teamId ?? undefined,
        },
      });
    }
  }
}

// ─── SOFT DELETE / RESTORE ─────────────────────────────────

export async function softDeleteTournament(tournamentId: string) {
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      createdById: true,
      deletedAt: true,
      name: true,
      participants: { select: { userId: true } },
    },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.deletedAt) throw new Error("Ya está eliminado");
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { deletedAt: new Date(), deletedById: dbUser.id },
  });

  const participantIds = tournament.participants
    .map((p) => p.userId)
    .filter((id) => id !== dbUser.id);

  if (participantIds.length > 0) {
    await prisma.notification.createMany({
      data: participantIds.map((userId) => ({
        userId,
        type: "TOURNAMENT_CANCELLED" as const,
        title: `Torneo cancelado: ${tournament.name}`,
        message: `El torneo "${tournament.name}" fue cancelado por el organizador.`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      })),
    });
  }

  revalidatePath("/torneos");
  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

export async function restoreTournament(tournamentId: string) {
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

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { deletedAt: null, deletedById: null },
  });

  revalidatePath("/torneos");
  revalidatePath("/admin/moderacion");
  return { success: true };
}

/** Check if both semifinal matches are done and create 3rd place match */
async function checkAndCreateThirdPlaceMatch(tournamentId: string, currentRound: string) {
  // Only trigger when a semifinal finishes
  // Semifinal = the round before the final (penultimate round in winners bracket)
  const parts = currentRound.split("-");
  if (parts.length < 3 || parts[0] !== "W") return;

  const currentRoundNum = parseInt(parts[1].replace("R", ""));

  // Get all winners rounds to find which is semifinal
  const allWinnersRounds = await prisma.tournamentMatch.findMany({
    where: { tournamentId, bracket: "WINNERS", round: { startsWith: "W-" } },
    select: { round: true },
    distinct: ["round"],
  });
  const totalRounds = allWinnersRounds.length;

  // Semifinal is round (totalRounds - 1). Final is totalRounds.
  const semifinalRoundNum = totalRounds - 1;
  if (currentRoundNum !== semifinalRoundNum) return;

  // Check if 3rd place match already exists
  const existing3rd = await prisma.tournamentMatch.findFirst({
    where: { tournamentId, round: "3RD-PLACE" },
  });
  if (existing3rd) return;

  // Check if both semifinal matches are finished
  const semiPrefix = `W-R${semifinalRoundNum}-`;
  const semiMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round: { startsWith: semiPrefix } },
  });

  const allDone = semiMatches.every((m) => m.status === "FINISHED" || m.status === "WALKOVER");
  if (!allDone) return;

  // Get losers from each semifinal
  const losers: string[] = [];
  for (const semi of semiMatches) {
    if (semi.winnerId && semi.player1Id && semi.player2Id) {
      const loser = semi.winnerId === semi.player1Id ? semi.player2Id : semi.player1Id;
      losers.push(loser);
    }
  }

  if (losers.length < 2) return;

  // Create 3rd place match
  const thirdPlace = await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      player1Id: losers[0],
      player2Id: losers[1],
      round: "3RD-PLACE",
      bracket: "WINNERS",
      status: "SCHEDULED",
    },
  });

  // Notify both players
  await notifyNextMatchReady(thirdPlace.id, tournamentId);
}

async function checkTournamentComplete(tournamentId: string) {
  const unfinished = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      status: { in: ["SCHEDULED", "READY_P1", "READY_P2", "IN_PROGRESS", "PENDING_CONFIRMATION", "DISPUTED"] },
      OR: [{ player1Id: { not: null } }, { player2Id: { not: null } }],
    },
  });

  if (unfinished === 0) {
    const matchCount = await prisma.tournamentMatch.count({
      where: { tournamentId, status: "FINISHED" },
    });
    if (matchCount > 0) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { status: true, format: true, name: true, relegationCount: true, cup1Name: true, cup1Spots: true, cup2Name: true, cup2Spots: true },
      });
      if (!tournament || tournament.status === "FINISHED") return;

      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "FINISHED" },
      });

      // League end-of-season notifications
      if (tournament.format === "LEAGUE") {
        const standings = await prisma.leagueStanding.findMany({
          where: { tournamentId },
          orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
          select: { userId: true },
        });

        if (standings.length === 0) return;
        const total = standings.length;
        const notifications: { userId: string; type: string; title: string; message: string; relatedId: string; linkUrl: string }[] = [];

        // Top 3
        if (standings[0]) {
          notifications.push({
            userId: standings[0].userId,
            type: "TOURNAMENT_FINISHED",
            title: "🏆 ¡Campeón!",
            message: `¡Felicidades! Saliste campeón de ${tournament.name}.`,
            relatedId: tournamentId,
            linkUrl: `/torneos/${tournamentId}`,
          });
        }
        if (standings[1]) {
          notifications.push({
            userId: standings[1].userId,
            type: "TOURNAMENT_FINISHED",
            title: "🥈 Subcampeón",
            message: `Terminaste segundo en ${tournament.name}. ¡Gran torneo!`,
            relatedId: tournamentId,
            linkUrl: `/torneos/${tournamentId}`,
          });
        }
        if (standings[2]) {
          notifications.push({
            userId: standings[2].userId,
            type: "TOURNAMENT_FINISHED",
            title: "🥉 Tercer puesto",
            message: `Terminaste tercero en ${tournament.name}. ¡Bien jugado!`,
            relatedId: tournamentId,
            linkUrl: `/torneos/${tournamentId}`,
          });
        }

        // Cup qualifications
        const cup1Spots = tournament.cup1Spots ?? 0;
        const cup2Spots = tournament.cup2Spots ?? 0;

        if (cup1Spots > 0 && tournament.cup1Name) {
          for (let i = 0; i < Math.min(cup1Spots, total); i++) {
            if (i >= 3 && standings[i]) {
              notifications.push({
                userId: standings[i].userId,
                type: "TOURNAMENT_FINISHED",
                title: `⭐ ¡Clasificaste a ${tournament.cup1Name}!`,
                message: `Terminaste puesto ${i + 1} en ${tournament.name} y clasificaste a ${tournament.cup1Name}.`,
                relatedId: tournamentId,
                linkUrl: `/torneos/${tournamentId}`,
              });
            }
          }
        }

        if (cup2Spots > 0 && tournament.cup2Name) {
          for (let i = cup1Spots; i < Math.min(cup1Spots + cup2Spots, total); i++) {
            if (standings[i]) {
              notifications.push({
                userId: standings[i].userId,
                type: "TOURNAMENT_FINISHED",
                title: `⭐ ¡Clasificaste a ${tournament.cup2Name}!`,
                message: `Terminaste puesto ${i + 1} en ${tournament.name} y clasificaste a ${tournament.cup2Name}.`,
                relatedId: tournamentId,
                linkUrl: `/torneos/${tournamentId}`,
              });
            }
          }
        }

        // Relegation
        const relegationCount = tournament.relegationCount ?? 0;
        if (relegationCount > 0) {
          for (let i = total - relegationCount; i < total; i++) {
            if (i >= 0 && standings[i]) {
              notifications.push({
                userId: standings[i].userId,
                type: "TOURNAMENT_FINISHED",
                title: "📉 Descendiste",
                message: `Terminaste puesto ${i + 1} en ${tournament.name}. Lo sentimos, descendiste.`,
                relatedId: tournamentId,
                linkUrl: `/torneos/${tournamentId}`,
              });
            }
          }
        }

        // Remaining players (no special zone)
        const notifiedIds = new Set(notifications.map((n) => n.userId));
        for (const s of standings) {
          if (!notifiedIds.has(s.userId)) {
            notifications.push({
              userId: s.userId,
              type: "TOURNAMENT_FINISHED",
              title: "Liga finalizada",
              message: `${tournament.name} ha terminado. Revisá la tabla final.`,
              relatedId: tournamentId,
              linkUrl: `/torneos/${tournamentId}`,
            });
          }
        }

        if (notifications.length > 0) {
          await prisma.notification.createMany({
            data: notifications.map((n) => ({
              ...n,
              type: n.type as "TOURNAMENT_FINISHED",
            })),
          });
        }
      }
    }
  }
}

// ─── ARENA — TOURNAMENT MATCH PAGE ──────────────────────────

export async function getTournamentMatchDetail(matchId: string) {
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

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { id: true, name: true, createdById: true, teamType: true, playoffRule: true, requireProof: true, leagueLegs: true, knockoutFormat: true, waitTimeMinutes: true, scheduleTime: true } },
      player1: { select: { id: true, username: true, avatarUrl: true, rankingPoints: true, psnUsername: true, xboxUsername: true, pcUsername: true } },
      player2: { select: { id: true, username: true, avatarUrl: true, rankingPoints: true, psnUsername: true, xboxUsername: true, pcUsername: true } },
      team1: { select: { id: true, name: true, tag: true, logoUrl: true } },
      team2: { select: { id: true, name: true, tag: true, logoUrl: true } },
      winner: { select: { id: true, username: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, username: true, avatarUrl: true, role: true } } },
      },
    },
  });

  if (!match) return null;

  // Only participants (or DTs for team tournaments), tournament creator, or admin can access
  let isPlayer = match.player1Id === dbUser.id || match.player2Id === dbUser.id;
  const isTeamTournament = match.tournament.teamType === "CLUBS_PRO" || match.tournament.teamType === "RUSH";

  if (!isPlayer && isTeamTournament && (match.team1Id || match.team2Id)) {
    const dtTeams = await prisma.teamMember.findMany({
      where: { userId: dbUser.id, role: "MANAGER", teamId: { in: [match.team1Id, match.team2Id].filter(Boolean) as string[] } },
      select: { teamId: true },
    });
    if (dtTeams.length > 0) isPlayer = true;
  }

  const isCreator = match.tournament.createdById === dbUser.id;
  const isAdmin = dbUser.role === "ADMIN";
  if (!isPlayer && !isCreator && !isAdmin) return null;

  // Fetch sibling matches (same players, different leg — for ida/vuelta)
  let siblingMatches: {
    id: string;
    leg: number | null;
    status: string;
    resultP1: number | null;
    resultP2: number | null;
    player1Id: string | null;
    player2Id: string | null;
    winnerId: string | null;
    disputeCountP1: number;
    disputeCountP2: number;
    proofImageUrl: string | null;
    proofImageUrls: string[];
  }[] = [];

  if (match.leg && match.player1Id && match.player2Id) {
    siblingMatches = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId: match.tournamentId,
        id: { not: match.id },
        OR: [
          { player1Id: match.player1Id, player2Id: match.player2Id },
          { player1Id: match.player2Id, player2Id: match.player1Id },
        ],
      },
      select: {
        id: true,
        leg: true,
        status: true,
        resultP1: true,
        resultP2: true,
        player1Id: true,
        player2Id: true,
        winnerId: true,
        disputeCountP1: true,
        disputeCountP2: true,
        proofImageUrl: true,
        proofImageUrls: true,
      },
      orderBy: { leg: "asc" },
    });
  }

  return { ...match, currentUserId: dbUser.id, isPlayer, isCreator, isAdmin, isTeamTournament, siblingMatches };
}

async function isDTOfMatchTeam(
  userId: string,
  team1Id: string | null,
  team2Id: string | null,
): Promise<{ isDT: boolean; side: "P1" | "P2" | null }> {
  const teamIds = [team1Id, team2Id].filter(Boolean) as string[];
  if (teamIds.length === 0) return { isDT: false, side: null };
  const membership = await prisma.teamMember.findFirst({
    where: { userId, role: "MANAGER", teamId: { in: teamIds } },
    select: { teamId: true },
  });
  if (!membership) return { isDT: false, side: null };
  const side = membership.teamId === team1Id ? "P1" : "P2";
  return { isDT: true, side };
}

export async function readyToPlay(matchId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado" };

  let isP1 = match.player1Id === dbUser.id;
  let isP2 = match.player2Id === dbUser.id;
  if (!isP1 && !isP2) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (!dt.isDT) return { error: "No participás en este partido" };
    if (dt.side === "P1") isP1 = true; else isP2 = true;
  }

  // Get tournament info for creator notification
  const tournament = await prisma.tournament.findUnique({
    where: { id: match.tournamentId },
    select: { id: true, name: true, createdById: true },
  });

  const currentPlayer = await prisma.user.findUnique({
    where: { id: dbUser.id },
    select: { username: true },
  });
  const rivalId = isP1 ? match.player2Id : match.player1Id;

  // Determine new status based on who clicked
  if (match.status === "SCHEDULED") {
    const newStatus = isP1 ? "READY_P1" : "READY_P2";
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: newStatus },
    });

    // Notify rival: your opponent is ready
    if (rivalId) {
      await prisma.notification.create({
        data: {
          userId: rivalId,
          type: "MATCH_ASSIGNED",
          title: "Tu rival está listo 🎮",
          message: `${currentPlayer?.username ?? "Tu rival"} te espera. Presioná "Jugar ahora" para comenzar.`,
          relatedId: matchId,
          linkUrl: `/arena/${matchId}`,
        },
      });
    }

    revalidatePath(`/arena/${matchId}`);
    return { success: true, message: "Esperando al rival..." };
  }

  if ((match.status === "READY_P1" && isP2) || (match.status === "READY_P2" && isP1)) {
    // Both ready → IN_PROGRESS
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: "IN_PROGRESS" },
    });

    // Notify tournament creator: match started
    if (tournament?.createdById) {
      const p1 = await prisma.user.findUnique({ where: { id: match.player1Id! }, select: { username: true } });
      const p2 = await prisma.user.findUnique({ where: { id: match.player2Id! }, select: { username: true } });
      await prisma.notification.create({
        data: {
          userId: tournament.createdById,
          type: "MATCH_ASSIGNED",
          title: "Partido en curso ⚽",
          message: `${p1?.username ?? "?"} vs ${p2?.username ?? "?"} están jugando en ${tournament.name}`,
          relatedId: matchId,
          linkUrl: `/arena/${matchId}`,
        },
      });
    }

    revalidatePath(`/arena/${matchId}`);
    return { success: true, message: "¡A jugar!" };
  }

  // Already ready
  return { success: true, message: "Ya estás listo. Esperando al rival..." };
}

export async function submitTournamentResult(
  matchId: string,
  resultP1: number,
  resultP2: number,
  proofImageUrl: string,
  proofImageUrls?: string[],
) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: { select: { requireProof: true } } },
  });
  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "IN_PROGRESS" && match.status !== "DISPUTED") {
    return { error: "El partido no está en curso" };
  }
  if (match.player1Id !== dbUser.id && match.player2Id !== dbUser.id) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (!dt.isDT) return { error: "No participás en este partido" };
  }

  // Validate proof images: max 3, required only if tournament config says so
  const urls = (proofImageUrls ?? (proofImageUrl ? [proofImageUrl] : [])).slice(0, 3);
  if (match.tournament.requireProof && urls.length === 0) {
    return { error: "La foto de prueba es obligatoria en este torneo." };
  }

  if (resultP1 < 0 || resultP2 < 0 || resultP1 > 99 || resultP2 > 99) {
    return { error: "Resultado inválido" };
  }

  // Optimistic locking
  const updated = await prisma.tournamentMatch.updateMany({
    where: { id: matchId, version: match.version },
    data: {
      resultP1,
      resultP2,
      proofImageUrl: urls[0] ?? null,
      proofImageUrls: urls,
      status: "PENDING_CONFIRMATION",
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    return { error: "El resultado ya fue cargado por otro jugador. Recargá la página." };
  }

  // Notify the other player
  const otherPlayerId = match.player1Id === dbUser.id ? match.player2Id : match.player1Id;
  if (otherPlayerId) {
    const submitter = await prisma.user.findUnique({ where: { id: dbUser.id }, select: { username: true } });
    await prisma.notification.create({
      data: {
        userId: otherPlayerId,
        type: "RESULT_LOADED",
        title: "Resultado cargado",
        message: `${submitter?.username ?? "Tu rival"} cargó el resultado: ${resultP1}-${resultP2}. Confirmalo.`,
        relatedId: matchId,
        linkUrl: `/arena/${matchId}`,
      },
    });
  }

  revalidatePath(`/arena/${matchId}`);
  return { success: true };
}

export async function submitSiblingResult(
  matchId: string,
  resultP1: number,
  resultP2: number,
  proofImageUrl: string,
  proofImageUrls?: string[],
) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: { select: { requireProof: true } } },
  });
  if (!match) return { error: "Partido no encontrado" };
  if (match.player1Id !== dbUser.id && match.player2Id !== dbUser.id) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (!dt.isDT) return { error: "No participás en este partido" };
  }

  if (match.status === "FINISHED" || match.status === "CANCELLED" || match.status === "WALKOVER") {
    return { error: "Este partido ya terminó" };
  }

  const urls = (proofImageUrls ?? (proofImageUrl ? [proofImageUrl] : [])).slice(0, 3);
  if (match.tournament.requireProof && urls.length === 0) {
    return { error: "La foto de prueba es obligatoria en este torneo." };
  }
  if (resultP1 < 0 || resultP2 < 0 || resultP1 > 99 || resultP2 > 99) {
    return { error: "Resultado inválido" };
  }

  // Auto-transition to IN_PROGRESS if needed (sibling loaded from main match arena)
  if (match.status === "SCHEDULED" || match.status === "READY_P1" || match.status === "READY_P2") {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: "IN_PROGRESS" },
    });
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      resultP1,
      resultP2,
      proofImageUrl: urls[0] ?? null,
      proofImageUrls: urls,
      status: "PENDING_CONFIRMATION",
    },
  });

  const otherPlayerId = match.player1Id === dbUser.id ? match.player2Id : match.player1Id;
  if (otherPlayerId) {
    const submitter = await prisma.user.findUnique({ where: { id: dbUser.id }, select: { username: true } });
    await prisma.notification.create({
      data: {
        userId: otherPlayerId,
        type: "RESULT_LOADED",
        title: "Resultado cargado",
        message: `${submitter?.username ?? "Tu rival"} cargó el resultado de la ${match.leg === 1 ? "ida" : "vuelta"}: ${resultP1}-${resultP2}. Confirmalo.`,
        relatedId: matchId,
        linkUrl: `/arena/${matchId}`,
      },
    });
  }

  revalidatePath(`/arena/${matchId}`);
  return { success: true };
}

export async function confirmTournamentResult(matchId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: { select: { id: true, name: true, format: true, hasLosersBracket: true, thirdPlaceMatch: true, groupCount: true, qualifyPerGroup: true, knockoutFormat: true } } },
  });
  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "PENDING_CONFIRMATION") return { error: "No hay resultado para confirmar" };
  if (match.player1Id !== dbUser.id && match.player2Id !== dbUser.id) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (!dt.isDT) return { error: "No participás en este partido" };
  }

  const resultP1 = match.resultP1!;
  const resultP2 = match.resultP2!;
  let matchWinnerId: string | null = null;
  let matchWinnerTeamId: string | null = null;

  if (resultP1 > resultP2) {
    matchWinnerId = match.player1Id;
    matchWinnerTeamId = match.team1Id;
  } else if (resultP2 > resultP1) {
    matchWinnerId = match.player2Id;
    matchWinnerTeamId = match.team2Id;
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status: "FINISHED",
      winnerId: matchWinnerId,
      winnerTeamId: matchWinnerTeamId,
      confirmedAt: new Date(),
    },
  });

  // Update league standings if league or group_knockout
  if (
    (match.tournament.format === "LEAGUE" || match.tournament.format === "GROUP_KNOCKOUT") &&
    match.player1Id &&
    match.player2Id
  ) {
    await updateLeagueStandings(match.tournamentId, match.player1Id, match.player2Id, resultP1, resultP2);

    if (match.tournament.format === "GROUP_KNOCKOUT" && match.groupName) {
      await checkGroupComplete(match.tournamentId, match.tournament.groupCount ?? 4, match.tournament.qualifyPerGroup ?? 2);
    }
  }

  // Update ranking points for both players
  if (match.player1Id && match.player2Id) {
    const p1Points = matchWinnerId === match.player1Id ? RANKING.WIN : matchWinnerId === match.player2Id ? RANKING.LOSS : RANKING.DRAW;
    const p2Points = matchWinnerId === match.player2Id ? RANKING.WIN : matchWinnerId === match.player1Id ? RANKING.LOSS : RANKING.DRAW;

    await prisma.user.update({
      where: { id: match.player1Id },
      data: { rankingPoints: { increment: p1Points } },
    });
    await prisma.rankingHistory.create({
      data: {
        userId: match.player1Id,
        tournamentMatchId: matchId,
        pointsChange: p1Points,
        reason: p1Points === RANKING.WIN ? "Victoria en torneo" : p1Points === RANKING.DRAW ? "Empate en torneo" : "Derrota en torneo",
      },
    });

    await prisma.user.update({
      where: { id: match.player2Id },
      data: { rankingPoints: { increment: p2Points } },
    });
    await prisma.rankingHistory.create({
      data: {
        userId: match.player2Id,
        tournamentMatchId: matchId,
        pointsChange: p2Points,
        reason: p2Points === RANKING.WIN ? "Victoria en torneo" : p2Points === RANKING.DRAW ? "Empate en torneo" : "Derrota en torneo",
      },
    });

    // Update team stats if team tournament
    if (match.team1Id && match.team2Id) {
      await updateTeamStats(match.team1Id, match.team2Id, resultP1, resultP2);
    }
  }

  const kf = match.tournament.knockoutFormat;
  const isSeriesMatch = match.seriesId && kf !== "SINGLE_MATCH";

  if (isSeriesMatch) {
    // ── Series logic ──
    const seriesResult = await checkSeriesResult(match.seriesId!, kf);

    if (seriesResult.needsTiebreaker) {
      // Create tiebreaker match (leg 3 for two-leg formats)
      const leg1 = await prisma.tournamentMatch.findFirst({
        where: { seriesId: match.seriesId!, leg: 1 },
      });
      if (leg1) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId: match.tournament.id,
            player1Id: leg1.player1Id,
            player2Id: leg1.player2Id,
            team1Id: leg1.team1Id,
            team2Id: leg1.team2Id,
            round: match.round,
            bracket: match.bracket,
            seriesId: match.seriesId,
            leg: 3,
            status: "SCHEDULED",
          },
        });
      }

      // Notify both players about tiebreaker
      if (match.player1Id && match.player2Id) {
        await prisma.notification.createMany({
          data: [match.player1Id, match.player2Id].map((uid) => ({
            userId: uid,
            type: "MATCH_ASSIGNED" as const,
            title: "¡Empate en el global! Desempate necesario ⚡",
            message: `La serie en ${match.tournament.name} quedó empatada en el global. Hay que jugar un partido de desempate.`,
            relatedId: match.tournament.id,
            linkUrl: `/torneos/${match.tournament.id}`,
          })),
        });
      }
    } else if (seriesResult.decided && seriesResult.winnerId) {
      // Series decided — cancel remaining matches, advance winner
      await cancelRemainingSeriesMatches(match.seriesId!);

      const seriesWinnerId = seriesResult.winnerId;
      const seriesLoserId = seriesWinnerId === match.player1Id ? match.player2Id : match.player1Id;
      const seriesWinnerTeamId = seriesWinnerId === match.player1Id ? match.team1Id : match.team2Id;
      const seriesLoserTeamId = seriesWinnerId === match.player1Id ? match.team2Id : match.team1Id;

      if (match.round) {
        await advanceWinner(match.tournament.id, match.round, seriesWinnerId, match.tournament.format, seriesWinnerTeamId);
        if (match.tournament.hasLosersBracket && match.bracket === "WINNERS" && seriesLoserId) {
          await sendToLosers(match.tournament.id, match.round, seriesLoserId, seriesLoserTeamId);
        }
      }

      // Notifications
      await prisma.notification.create({
        data: {
          userId: seriesWinnerId,
          type: "ADVANCED_ROUND",
          title: "¡Ganaste la serie! 🎉",
          message: `Avanzás en ${match.tournament.name}. Te avisaremos cuando tu siguiente partido esté disponible.`,
          relatedId: match.tournament.id,
          linkUrl: `/torneos/${match.tournament.id}`,
        },
      });

      if (seriesLoserId) {
        await prisma.notification.create({
          data: {
            userId: seriesLoserId,
            type: "ELIMINATED",
            title: "Eliminado de la serie 🙏",
            message: `Perdiste la serie en ${match.tournament.name}. ¡Seguí compitiendo!`,
            relatedId: match.tournament.id,
            linkUrl: `/torneos/${match.tournament.id}`,
          },
        });
      }

      if (match.tournament.thirdPlaceMatch && match.round) {
        await checkAndCreateThirdPlaceMatch(match.tournament.id, match.round);
      }
    }
    // else: series not decided yet, no advancement
  } else {
    // ── Single match logic (original) ──
    if (matchWinnerId && match.round) {
      const winTeamId = matchWinnerId === match.player1Id ? match.team1Id : match.team2Id;
      await advanceWinner(match.tournament.id, match.round, matchWinnerId, match.tournament.format, winTeamId);
      if (match.tournament.hasLosersBracket && match.bracket === "WINNERS") {
        const loserId = matchWinnerId === match.player1Id ? match.player2Id : match.player1Id;
        const loseTeamId = matchWinnerId === match.player1Id ? match.team2Id : match.team1Id;
        if (loserId) await sendToLosers(match.tournament.id, match.round, loserId, loseTeamId);
      }
    }

    const loserId = matchWinnerId
      ? (matchWinnerId === match.player1Id ? match.player2Id : match.player1Id)
      : null;

    if (matchWinnerId) {
      await prisma.notification.create({
        data: {
          userId: matchWinnerId,
          type: "ADVANCED_ROUND",
          title: "¡Felicidades por tu victoria! 🎉",
          message: `Ganaste ${resultP1}-${resultP2} en ${match.tournament.name}. Te avisaremos cuando tu siguiente partido esté disponible.`,
          relatedId: match.tournament.id,
          linkUrl: `/torneos/${match.tournament.id}`,
        },
      });
    }

    if (loserId) {
      await prisma.notification.create({
        data: {
          userId: loserId,
          type: "ELIMINATED",
          title: "Gracias por participar 🙏",
          message: `Resultado: ${resultP1}-${resultP2} en ${match.tournament.name}. ¡Seguí compitiendo!`,
          relatedId: match.tournament.id,
          linkUrl: `/torneos/${match.tournament.id}`,
        },
      });
    }

    if (!matchWinnerId && match.player1Id && match.player2Id) {
      await prisma.notification.createMany({
        data: [match.player1Id, match.player2Id].map((uid) => ({
          userId: uid,
          type: "TOURNAMENT_FINISHED" as const,
          title: "Partido finalizado — Empate",
          message: `Resultado: ${resultP1}-${resultP2} en ${match.tournament.name}.`,
          relatedId: match.tournament.id,
          linkUrl: `/torneos/${match.tournament.id}`,
        })),
      });
    }

    if (match.tournament.thirdPlaceMatch && match.round) {
      await checkAndCreateThirdPlaceMatch(match.tournament.id, match.round);
    }
  }

  // Check if tournament complete
  await checkTournamentComplete(match.tournament.id);

  revalidatePath(`/arena/${matchId}`);
  revalidatePath(`/torneos/${match.tournament.id}`);
  return { success: true };
}

export async function disputeTournamentResult(matchId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, username: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { id: true, name: true, createdById: true } },
      player1: { select: { username: true } },
      player2: { select: { username: true } },
    },
  });
  if (!match) return { error: "Partido no encontrado" };
  if (match.status !== "PENDING_CONFIRMATION") return { error: "No hay resultado para disputar" };
  let dtSide: "P1" | "P2" | null = null;
  if (match.player1Id !== dbUser.id && match.player2Id !== dbUser.id) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (!dt.isDT) return { error: "No participás en este partido" };
    dtSide = dt.side;
  }

  const isP1 = match.player1Id === dbUser.id || dtSide === "P1";
  const newCountP1 = match.disputeCountP1 + (isP1 ? 1 : 0);
  const newCountP2 = match.disputeCountP2 + (!isP1 ? 1 : 0);

  // Check if this player exceeded 2 disputes
  const myNewCount = isP1 ? newCountP1 : newCountP2;
  if (myNewCount > 2) {
    return { error: "Ya disputaste 2 veces. Se requiere intervención del admin." };
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status: "DISPUTED",
      resultP1: null,
      resultP2: null,
      proofImageUrl: null,
      disputeCountP1: newCountP1,
      disputeCountP2: newCountP2,
    },
  });

  // If both players have disputed 2 times each → auto-invoke admin + tournament creator
  if (newCountP1 >= 2 && newCountP2 >= 2) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const recipientIds = new Set(admins.map((a) => a.id));
    if (match.tournament.createdById) recipientIds.add(match.tournament.createdById);

    await prisma.notification.createMany({
      data: Array.from(recipientIds).map((userId) => ({
        userId,
        type: "ADMIN_MESSAGE" as const,
        title: "🚨 Conflicto sin resolver",
        message: `${match.player1?.username ?? "?"} y ${match.player2?.username ?? "?"} no se ponen de acuerdo en ${match.tournament.name}. Se requiere intervención.`,
        relatedId: matchId,
        linkUrl: `/arena/${matchId}`,
      })),
    });

    revalidatePath(`/arena/${matchId}`);
    return { success: true, message: "Conflicto escalado. Admin y organizador fueron notificados." };
  }

  revalidatePath(`/arena/${matchId}`);
  return { success: true, message: "Resultado disputado. Pueden volver a cargar resultado." };
}

export async function sendArenaMessage(matchId: string, text: string) {
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

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return { error: "Mensaje inválido" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: { select: { createdById: true } } },
  });
  if (!match) return { error: "Partido no encontrado" };

  let isPlayer = match.player1Id === dbUser.id || match.player2Id === dbUser.id;
  if (!isPlayer) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (dt.isDT) isPlayer = true;
  }
  const isCreator = match.tournament.createdById === dbUser.id;
  const isAdmin = dbUser.role === "ADMIN";
  if (!isPlayer && !isCreator && !isAdmin) return { error: "No tenés acceso a este chat" };

  await prisma.matchMessage.create({
    data: {
      tournamentMatchId: matchId,
      userId: dbUser.id,
      message: trimmed,
    },
  });

  revalidatePath(`/arena/${matchId}`);
  return { success: true };
}

export async function invokeArenaAdmin(matchId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, username: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { id: true, name: true, createdById: true } },
      player1: { select: { username: true } },
      player2: { select: { username: true } },
    },
  });
  if (!match) return { error: "Partido no encontrado" };

  let isPlayer = match.player1Id === dbUser.id || match.player2Id === dbUser.id;
  if (!isPlayer) {
    const dt = await isDTOfMatchTeam(dbUser.id, match.team1Id, match.team2Id);
    if (!dt.isDT) return { error: "No participás en este partido" };
    isPlayer = true;
  }

  // Notify tournament creator + all admins (dedup)
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const recipientIds = new Set(admins.map((a) => a.id));
  if (match.tournament.createdById) recipientIds.add(match.tournament.createdById);

  await prisma.notification.createMany({
    data: Array.from(recipientIds).map((userId) => ({
      userId,
      type: "ADMIN_MESSAGE" as const,
      title: "⚠️ Intervención solicitada",
      message: `${dbUser.username} pide ayuda en ${match.tournament.name}: ${match.player1?.username ?? "?"} vs ${match.player2?.username ?? "?"}`,
      relatedId: matchId,
      linkUrl: `/arena/${matchId}`,
    })),
  });

  revalidatePath(`/arena/${matchId}`);
  return { success: true, message: "Admin y organizador notificados." };
}

// ─── ADMIN: EDITAR RESULTADO ──────────────────────────────

export async function adminEditResult(
  matchId: string,
  newResultP1: number,
  newResultP2: number,
) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true, username: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { tournament: { select: { id: true, name: true, format: true, createdById: true } } },
  });
  if (!match) return { error: "Partido no encontrado" };

  const isCreator = match.tournament.createdById === dbUser.id;
  const isAdmin = dbUser.role === "ADMIN";
  if (!isCreator && !isAdmin) return { error: "Solo el creador del torneo o un admin pueden editar resultados" };

  if (!match.player1Id || !match.player2Id) return { error: "Partido sin jugadores asignados" };

  const oldResultP1 = match.resultP1;
  const oldResultP2 = match.resultP2;
  const wasFinished = match.status === "FINISHED";

  // Revert old ranking points if match was finished
  if (wasFinished && oldResultP1 !== null && oldResultP2 !== null) {
    const oldRankingRecords = await prisma.rankingHistory.findMany({
      where: { tournamentMatchId: matchId },
    });
    for (const record of oldRankingRecords) {
      await prisma.user.update({
        where: { id: record.userId },
        data: { rankingPoints: { decrement: record.pointsChange } },
      });
    }
    await prisma.rankingHistory.deleteMany({ where: { tournamentMatchId: matchId } });

    // Revert old league standings
    if (match.tournament.format === "LEAGUE" || match.tournament.format === "GROUP_KNOCKOUT") {
      await reverseLeagueStandings(match.tournament.id, match.player1Id, match.player2Id, oldResultP1, oldResultP2);
    }
  }

  // Apply new result
  const newWinnerId = newResultP1 > newResultP2 ? match.player1Id
    : newResultP2 > newResultP1 ? match.player2Id
    : null;

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      resultP1: newResultP1,
      resultP2: newResultP2,
      winnerId: newWinnerId,
      status: "FINISHED",
      confirmedAt: new Date(),
    },
  });

  // Apply new ranking points
  const p1Pts = newWinnerId === match.player1Id ? RANKING.WIN : newWinnerId === match.player2Id ? RANKING.LOSS : RANKING.DRAW;
  const p2Pts = newWinnerId === match.player2Id ? RANKING.WIN : newWinnerId === match.player1Id ? RANKING.LOSS : RANKING.DRAW;

  await prisma.user.update({ where: { id: match.player1Id }, data: { rankingPoints: { increment: p1Pts } } });
  await prisma.rankingHistory.create({
    data: { userId: match.player1Id, tournamentMatchId: matchId, pointsChange: p1Pts, reason: `Resultado editado por ${dbUser.username}` },
  });
  await prisma.user.update({ where: { id: match.player2Id }, data: { rankingPoints: { increment: p2Pts } } });
  await prisma.rankingHistory.create({
    data: { userId: match.player2Id, tournamentMatchId: matchId, pointsChange: p2Pts, reason: `Resultado editado por ${dbUser.username}` },
  });

  // Apply new league standings
  if (match.tournament.format === "LEAGUE" || match.tournament.format === "GROUP_KNOCKOUT") {
    await updateLeagueStandings(match.tournament.id, match.player1Id, match.player2Id, newResultP1, newResultP2);
  }

  // Audit log
  await prisma.tournamentAuditLog.create({
    data: {
      tournamentId: match.tournament.id,
      action: "RESULT_EDITED",
      performedById: dbUser.id,
      details: `Resultado editado: ${oldResultP1 ?? "?"}-${oldResultP2 ?? "?"} → ${newResultP1}-${newResultP2}`,
    },
  });

  revalidatePath(`/torneos/${match.tournament.id}`);
  revalidatePath(`/arena/${matchId}`);
  return { success: true };
}

async function reverseLeagueStandings(
  tournamentId: string,
  player1Id: string,
  player2Id: string,
  resultP1: number,
  resultP2: number,
) {
  const p1Won = resultP1 > resultP2;
  const p2Won = resultP2 > resultP1;
  const draw = resultP1 === resultP2;

  await prisma.leagueStanding.update({
    where: { tournamentId_userId: { tournamentId, userId: player1Id } },
    data: {
      played: { decrement: 1 },
      won: p1Won ? { decrement: 1 } : undefined,
      drawn: draw ? { decrement: 1 } : undefined,
      lost: p2Won ? { decrement: 1 } : undefined,
      goalsFor: { decrement: resultP1 },
      goalsAgainst: { decrement: resultP2 },
      points: { decrement: p1Won ? 3 : draw ? 1 : 0 },
    },
  });

  await prisma.leagueStanding.update({
    where: { tournamentId_userId: { tournamentId, userId: player2Id } },
    data: {
      played: { decrement: 1 },
      won: p2Won ? { decrement: 1 } : undefined,
      drawn: draw ? { decrement: 1 } : undefined,
      lost: p1Won ? { decrement: 1 } : undefined,
      goalsFor: { decrement: resultP2 },
      goalsAgainst: { decrement: resultP1 },
      points: { decrement: p2Won ? 3 : draw ? 1 : 0 },
    },
  });
}

// ─── ADMIN: VOID PLAYER ───────────────────────────────────

export async function voidPlayer(
  tournamentId: string,
  targetUserId: string,
  mode: "REMOVE_POINTS" | "NEVER_EXISTED",
) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true, username: true },
  });
  if (!dbUser) return { error: "No autenticado" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, format: true, createdById: true },
  });
  if (!tournament) return { error: "Torneo no encontrado" };

  const isCreator = tournament.createdById === dbUser.id;
  const isAdmin = dbUser.role === "ADMIN";
  if (!isCreator && !isAdmin) return { error: "Sin permisos" };

  // Get all finished matches involving this player
  const playerMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      status: "FINISHED",
      OR: [{ player1Id: targetUserId }, { player2Id: targetUserId }],
    },
  });

  if (mode === "REMOVE_POINTS") {
    // Revert ranking points this player earned/caused in this tournament
    const rankingRecords = await prisma.rankingHistory.findMany({
      where: {
        userId: targetUserId,
        tournamentMatchId: { in: playerMatches.map((m) => m.id) },
      },
    });

    let totalPoints = 0;
    for (const record of rankingRecords) {
      totalPoints += record.pointsChange;
    }

    if (totalPoints !== 0) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { rankingPoints: { decrement: totalPoints } },
      });
    }

    await prisma.rankingHistory.deleteMany({
      where: {
        userId: targetUserId,
        tournamentMatchId: { in: playerMatches.map((m) => m.id) },
      },
    });

    // Remove from participants
    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId, userId: targetUserId },
    });

    // Notify player
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "ADMIN_MESSAGE",
        title: "Removido del torneo",
        message: `Fuiste removido de ${tournament.name}. Se revirtieron ${totalPoints} puntos de ranking.`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      },
    });
  } else {
    // NEVER_EXISTED — revert everything, void all matches
    for (const match of playerMatches) {
      const opponentId = match.player1Id === targetUserId ? match.player2Id : match.player1Id;

      // Revert ranking for BOTH players in this match
      const rankingRecords = await prisma.rankingHistory.findMany({
        where: { tournamentMatchId: match.id },
      });
      for (const record of rankingRecords) {
        await prisma.user.update({
          where: { id: record.userId },
          data: { rankingPoints: { decrement: record.pointsChange } },
        });
      }
      await prisma.rankingHistory.deleteMany({ where: { tournamentMatchId: match.id } });

      // Revert league standings for both players
      if (
        (tournament.format === "LEAGUE" || tournament.format === "GROUP_KNOCKOUT") &&
        match.resultP1 !== null && match.resultP2 !== null &&
        match.player1Id && match.player2Id
      ) {
        await reverseLeagueStandings(tournament.id, match.player1Id, match.player2Id, match.resultP1, match.resultP2);
      }

      // Void the match
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: { status: "CANCELLED", resultP1: null, resultP2: null, winnerId: null },
      });

      // Notify opponent
      if (opponentId) {
        await prisma.notification.create({
          data: {
            userId: opponentId,
            type: "ADMIN_MESSAGE",
            title: "Partido anulado",
            message: `Tu partido en ${tournament.name} fue anulado. Se revirtieron los puntos.`,
            relatedId: match.id,
            linkUrl: `/torneos/${tournamentId}`,
          },
        });
      }
    }

    // Cancel all pending/scheduled matches
    await prisma.tournamentMatch.updateMany({
      where: {
        tournamentId,
        status: { in: ["SCHEDULED", "READY_P1", "READY_P2", "IN_PROGRESS", "PENDING_CONFIRMATION"] },
        OR: [{ player1Id: targetUserId }, { player2Id: targetUserId }],
      },
      data: { status: "CANCELLED" },
    });

    // Remove league standing
    await prisma.leagueStanding.deleteMany({
      where: { tournamentId, userId: targetUserId },
    });

    // Remove from participants
    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId, userId: targetUserId },
    });

    // Notify player
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "ADMIN_MESSAGE",
        title: "Removido del torneo",
        message: `Fuiste removido de ${tournament.name}. Todos tus partidos fueron anulados.`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      },
    });
  }

  // Audit log
  await prisma.tournamentAuditLog.create({
    data: {
      tournamentId,
      action: mode === "REMOVE_POINTS" ? "PLAYER_REMOVED" : "PLAYER_VOIDED",
      performedById: dbUser.id,
      details: `Jugador ${targetUserId} ${mode === "REMOVE_POINTS" ? "removido (puntos revertidos)" : "anulado (nunca existió)"}`,
    },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

export async function remindPendingMatches(tournamentId: string) {
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, createdById: true },
  });
  if (!tournament) return { error: "Torneo no encontrado" };
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "Solo el organizador puede enviar recordatorios" };
  }

  const pendingMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      status: { in: ["IN_PROGRESS", "SCHEDULED"] },
      player1Id: { not: null },
      player2Id: { not: null },
    },
    include: {
      player1: { select: { username: true } },
      player2: { select: { username: true } },
    },
  });

  if (pendingMatches.length === 0) return { error: "No hay partidos pendientes" };

  const notifications = pendingMatches.flatMap((match) => {
    const players = [match.player1Id!, match.player2Id!];
    return players.map((playerId) => {
      const rivalName = playerId === match.player1Id
        ? match.player2?.username ?? "rival"
        : match.player1?.username ?? "rival";
      return {
        userId: playerId,
        type: "MATCH_REMINDER" as const,
        title: `Partido pendiente en ${tournament.name}`,
        message: `Tenés un partido pendiente contra ${rivalName}. ¡Coordiná y jugá!`,
        relatedId: match.id,
        linkUrl: `/arena/${match.id}`,
      };
    });
  });

  await prisma.notification.createMany({ data: notifications });

  return { success: true, count: pendingMatches.length };
}

export async function sendTournamentChatMessage(tournamentId: string, text: string) {
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

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return { error: "Mensaje inválido" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, createdById: true },
  });
  if (!tournament) return { error: "Torneo no encontrado" };

  const isParticipant = await prisma.tournamentParticipant.findFirst({
    where: { tournamentId, userId: dbUser.id, status: "CONFIRMED" },
  });
  const isCreator = tournament.createdById === dbUser.id;
  const isAdmin = dbUser.role === "ADMIN";
  if (!isParticipant && !isCreator && !isAdmin) return { error: "No tenés acceso a este chat" };

  await prisma.tournamentMessage.create({
    data: {
      tournamentId,
      userId: dbUser.id,
      text: trimmed,
    },
  });

  const senderUser = await prisma.user.findUnique({
    where: { id: dbUser.id },
    select: { username: true },
  });

  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId, status: "CONFIRMED", userId: { not: dbUser.id } },
    select: { userId: true },
  });
  const notifyIds = new Set(participants.map((p) => p.userId));
  if (tournament.createdById !== dbUser.id) notifyIds.add(tournament.createdById);

  const recentNotif = await prisma.notification.findFirst({
    where: {
      type: "TOURNAMENT_CHAT",
      relatedId: tournamentId,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
  });

  if (!recentNotif && notifyIds.size > 0) {
    await prisma.notification.createMany({
      data: Array.from(notifyIds).map((userId) => ({
        userId,
        type: "TOURNAMENT_CHAT",
        title: `Nuevo mensaje en ${tournament.name}`,
        message: `${senderUser?.username ?? "Alguien"}: ${trimmed.slice(0, 100)}`,
        relatedId: tournamentId,
        linkUrl: `/torneos/${tournamentId}`,
      })),
    });
  }

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

// ─── REINICIAR TORNEO ─────────────────────────────────────────

export async function resetTournament(tournamentId: string) {
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { createdById: true, status: true },
  });
  if (!tournament) return { error: "Torneo no encontrado" };
  if (tournament.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permiso" };
  }

  // Delete in order: match messages → match disputes → matches → league standings
  const matchIds = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    select: { id: true },
  });
  const ids = matchIds.map((m) => m.id);

  if (ids.length > 0) {
    await prisma.rankingHistory.deleteMany({
      where: { tournamentMatchId: { in: ids } },
    });
    await prisma.matchMessage.deleteMany({
      where: { tournamentMatchId: { in: ids } },
    });
    await prisma.tournamentDispute.deleteMany({
      where: { tournamentId },
    });
    await prisma.tournamentMatch.deleteMany({
      where: { tournamentId },
    });
  }

  await prisma.leagueStanding.deleteMany({
    where: { tournamentId },
  });

  // Reset tournament status to REGISTRATION
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "REGISTRATION" },
  });

  revalidatePath(`/torneos/${tournamentId}`);
  return { success: true };
}

// ─── DUPLICAR TORNEO ──────────────────────────────────────────

export async function duplicateTournament(tournamentId: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const original = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!original) return { error: "Torneo no encontrado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  if (original.createdById !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "Sin permisos" };
  }

  const newTournament = await prisma.tournament.create({
    data: {
      name: `${original.name} (copia)`,
      description: original.description,
      rules: original.rules,
      format: original.format,
      leagueLegs: original.leagueLegs,
      status: "DRAFT",
      maxPlayers: original.maxPlayers,
      platforms: original.platforms,
      teamType: original.teamType,
      prize: original.prize,
      visibility: original.visibility,
      verificationLevel: original.verificationLevel,
      logoUrl: original.logoUrl,
      bannerUrl: original.bannerUrl,
      requiresVerification: original.requiresVerification,
      matchTime: original.matchTime,
      difficulty: original.difficulty,
      controls: original.controls,
      gameMode: original.gameMode,
      stadium: original.stadium,
      groupCount: original.groupCount,
      qualifyPerGroup: original.qualifyPerGroup,
      knockoutSeeding: original.knockoutSeeding,
      randomDrawUntil: original.randomDrawUntil,
      hasLosersBracket: original.hasLosersBracket,
      thirdPlaceMatch: original.thirdPlaceMatch,
      playoffRule: original.playoffRule,
      knockoutFormat: original.knockoutFormat,
      requireProof: original.requireProof,
      requiresRoster: original.requiresRoster,
      scheduleDays: original.scheduleDays,
      scheduleTimeMode: original.scheduleTimeMode,
      scheduleTime: original.scheduleTime,
      waitTimeMinutes: original.waitTimeMinutes,
      relegationCount: original.relegationCount,
      cup1Name: original.cup1Name,
      cup1Spots: original.cup1Spots,
      cup2Name: original.cup2Name,
      cup2Spots: original.cup2Spots,
      createdById: dbUser.id,
    },
  });

  await prisma.tournamentParticipant.create({
    data: {
      tournamentId: newTournament.id,
      userId: dbUser.id,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  revalidatePath("/torneos");
  return { success: true, tournamentId: newTournament.id };
}
