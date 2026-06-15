"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Platform, TeamMode } from "@prisma/client";

// ─── CREAR EQUIPO ──────────────────────────────────────────

interface CreateTeamInput {
  name: string;
  tag?: string;
  logoUrl?: string;
  bannerUrl?: string;
  mode: TeamMode;
  platform: Platform;
}

export async function createTeam(input: CreateTeamInput) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  if (!dbUser.isDT && dbUser.role !== "ADMIN") {
    return { error: "Debés activar el rol de DT en tu perfil para crear un equipo" };
  }

  const gamertagForPlatform = getGamertag(dbUser, input.platform);
  if (!gamertagForPlatform) {
    return { error: `Necesitás configurar tu gamertag de ${input.platform} en tu perfil antes de crear un equipo` };
  }

  if (input.name.length < 3 || input.name.length > 40) {
    return { error: "Nombre debe tener entre 3 y 40 caracteres" };
  }

  const team = await prisma.team.create({
    data: {
      name: input.name,
      tag: input.tag || null,
      logoUrl: input.logoUrl || null,
      bannerUrl: input.bannerUrl || null,
      mode: input.mode,
      platform: input.platform,
      managerId: dbUser.id,
      members: {
        create: {
          userId: dbUser.id,
          role: "MANAGER",
        },
      },
    },
  });

  revalidatePath("/equipos");
  return { success: true, teamId: team.id };
}

// ─── AGREGAR JUGADOR ───────────────────────────────────────

export async function addTeamMember(teamId: string, username: string, position?: string, shirtNumber?: number) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return { error: "Equipo no encontrado" };
  if (team.managerId !== dbUser.id) return { error: "Solo el DT puede agregar jugadores" };

  const maxMembers = team.mode === "CLUBS_PRO" ? 30 : 10;
  if (team.members.length >= maxMembers + 1) {
    return { error: `Máximo ${maxMembers} jugadores (+ DT)` };
  }

  const targetUser = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (!targetUser) return { error: `Usuario "${username}" no encontrado. Verificá que esté registrado en Modo Fosa.` };

  const gamertagForPlatform = getGamertag(targetUser, team.platform);
  if (!gamertagForPlatform) {
    return { error: `${username} no tiene gamertag de ${team.platform} configurado. Debe completar su perfil.` };
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) return { error: `${username} ya está en el equipo` };

  const inOtherTeam = await prisma.teamMember.findFirst({
    where: { userId: targetUser.id, team: { mode: team.mode } },
  });
  if (inOtherTeam) return { error: `${username} ya pertenece a otro equipo de ${team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}` };

  await prisma.teamMember.create({
    data: {
      teamId,
      userId: targetUser.id,
      role: "PLAYER",
      position: position || null,
      shirtNumber: shirtNumber || null,
    },
  });

  revalidatePath(`/equipos/${teamId}`);
  return { success: true };
}

// ─── SACAR JUGADOR ─────────────────────────────────────────

export async function removeTeamMember(teamId: string, userId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Equipo no encontrado" };
  if (team.managerId !== dbUser.id && dbUser.role !== "ADMIN") return { error: "Sin permisos" };
  if (userId === team.managerId) return { error: "No podés sacar al DT" };

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  revalidatePath(`/equipos/${teamId}`);
  return { success: true };
}

// ─── VER EQUIPO ────────────────────────────────────────────

export async function getTeam(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      manager: { select: { id: true, username: true, avatarUrl: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              psnUsername: true,
              xboxUsername: true,
              pcUsername: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });
}

// ─── LISTAR EQUIPOS ────────────────────────────────────────

export async function listTeams(mode?: TeamMode) {
  return prisma.team.findMany({
    where: mode ? { mode } : undefined,
    include: {
      manager: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── MIS EQUIPOS ───────────────────────────────────────────

export async function getMyTeams() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return [];

  return prisma.team.findMany({
    where: {
      members: { some: { userId: dbUser.id } },
    },
    include: {
      manager: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── EDITAR EQUIPO ─────────────────────────────────────────

export async function updateTeam(teamId: string, data: { name?: string; tag?: string; logoUrl?: string; bannerUrl?: string }) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Equipo no encontrado" };
  if (team.managerId !== dbUser.id && dbUser.role !== "ADMIN") return { error: "Sin permisos" };

  await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.tag !== undefined && { tag: data.tag || null }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl || null }),
    },
  });

  revalidatePath(`/equipos/${teamId}`);
  return { success: true };
}

// ─── BUSCAR USUARIOS ──────────────────────────────────────

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];

  return prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      banned: false,
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      psnUsername: true,
      xboxUsername: true,
      pcUsername: true,
    },
    take: 10,
  });
}

// ─── INVITAR JUGADOR ──────────────────────────────────────

export async function sendTeamInvite(teamId: string, invitedUserId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { members: true } } },
  });
  if (!team) return { error: "Equipo no encontrado" };
  if (team.managerId !== dbUser.id && dbUser.role !== "ADMIN") return { error: "Solo el DT puede invitar jugadores" };

  const maxMembers = team.mode === "CLUBS_PRO" ? 31 : 11;
  if (team._count.members >= maxMembers) return { error: "Plantilla completa" };

  const invitedUser = await prisma.user.findUnique({ where: { id: invitedUserId } });
  if (!invitedUser) return { error: "Usuario no encontrado" };

  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: invitedUserId } },
  });
  if (existingMember) return { error: "Ya es miembro del equipo" };

  const existingInvite = await prisma.teamInvite.findUnique({
    where: { teamId_invitedId: { teamId, invitedId: invitedUserId } },
  });
  if (existingInvite?.status === "PENDING") return { error: "Ya tiene una invitación pendiente" };

  if (existingInvite) {
    await prisma.teamInvite.update({
      where: { id: existingInvite.id },
      data: { status: "PENDING", respondedAt: null },
    });
  } else {
    await prisma.teamInvite.create({
      data: { teamId, invitedId: invitedUserId },
    });
  }

  await prisma.notification.create({
    data: {
      userId: invitedUserId,
      type: "TEAM_INVITE",
      title: "Invitación de equipo",
      message: `${dbUser.username} te invitó a unirte a ${team.name} (${team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"})`,
      relatedId: teamId,
      linkUrl: `/equipos/invitaciones`,
    },
  });

  revalidatePath(`/equipos/${teamId}`);
  return { success: true };
}

// ─── RESPONDER INVITACIÓN ─────────────────────────────────

export async function respondTeamInvite(inviteId: string, accept: boolean) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: true },
  });
  if (!invite) return { error: "Invitación no encontrada" };
  if (invite.invitedId !== dbUser.id) return { error: "Esta invitación no es tuya" };
  if (invite.status !== "PENDING") return { error: "Invitación ya respondida" };

  if (accept) {
    const maxMembers = invite.team.mode === "CLUBS_PRO" ? 31 : 11;
    const memberCount = await prisma.teamMember.count({ where: { teamId: invite.teamId } });
    if (memberCount >= maxMembers) {
      return { error: "Plantilla completa, no se puede aceptar" };
    }

    const inOtherTeam = await prisma.teamMember.findFirst({
      where: { userId: dbUser.id, team: { mode: invite.team.mode } },
    });
    if (inOtherTeam) return { error: `Ya pertenecés a otro equipo de ${invite.team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}` };

    await prisma.$transaction([
      prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.teamMember.create({
        data: { teamId: invite.teamId, userId: dbUser.id },
      }),
      prisma.notification.create({
        data: {
          userId: invite.team.managerId,
          type: "TEAM_INVITE_ACCEPTED",
          title: "Invitación aceptada",
          message: `${dbUser.username} aceptó unirse a ${invite.team.name}`,
          relatedId: invite.teamId,
          linkUrl: `/equipos/${invite.teamId}`,
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "REJECTED", respondedAt: new Date() },
      }),
      prisma.notification.create({
        data: {
          userId: invite.team.managerId,
          type: "TEAM_INVITE_REJECTED",
          title: "Invitación rechazada",
          message: `${dbUser.username} rechazó unirse a ${invite.team.name}`,
          relatedId: invite.teamId,
          linkUrl: `/equipos/${invite.teamId}`,
        },
      }),
    ]);
  }

  revalidatePath("/equipos/invitaciones");
  revalidatePath(`/equipos/${invite.teamId}`);
  return { success: true };
}

// ─── MIS INVITACIONES ─────────────────────────────────────

export async function getMyInvites() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return [];

  return prisma.teamInvite.findMany({
    where: { invitedId: dbUser.id, status: "PENDING" },
    include: {
      team: {
        include: {
          manager: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── INVITACIONES DEL EQUIPO ──────────────────────────────

export async function getTeamInvites(teamId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return [];

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return [];
  if (team.managerId !== dbUser.id && dbUser.role !== "ADMIN") return [];

  return prisma.teamInvite.findMany({
    where: { teamId },
    include: {
      invited: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── SOLICITAR UNIRSE ─────────────────────────────────────

export async function requestJoinTeam(teamId: string, message?: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { members: true } } },
  });
  if (!team) return { error: "Equipo no encontrado" };

  const alreadyMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: dbUser.id } },
  });
  if (alreadyMember) return { error: "Ya sos miembro de este equipo" };

  const inOtherTeam = await prisma.teamMember.findFirst({
    where: { userId: dbUser.id, team: { mode: team.mode } },
  });
  if (inOtherTeam) return { error: `Ya pertenecés a otro equipo de ${team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}` };

  const existing = await prisma.teamJoinRequest.findUnique({
    where: { teamId_requesterId: { teamId, requesterId: dbUser.id } },
  });
  if (existing?.status === "PENDING") return { error: "Ya tenés una solicitud pendiente" };

  if (existing) {
    await prisma.teamJoinRequest.update({
      where: { id: existing.id },
      data: { status: "PENDING", message: message || null, respondedAt: null },
    });
  } else {
    await prisma.teamJoinRequest.create({
      data: { teamId, requesterId: dbUser.id, message: message || null },
    });
  }

  await prisma.notification.create({
    data: {
      userId: team.managerId,
      type: "TEAM_JOIN_REQUEST",
      title: "Solicitud de unión",
      message: `${dbUser.username} quiere unirse a ${team.name}`,
      relatedId: teamId,
      linkUrl: `/equipos/${teamId}/gestionar`,
    },
  });

  return { success: true };
}

// ─── RESPONDER SOLICITUD DE UNIÓN ─────────────────────────

export async function respondJoinRequest(requestId: string, accept: boolean) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const request = await prisma.teamJoinRequest.findUnique({
    where: { id: requestId },
    include: { team: true, requester: true },
  });
  if (!request) return { error: "Solicitud no encontrada" };
  if (request.team.managerId !== dbUser.id && dbUser.role !== "ADMIN") return { error: "Sin permisos" };
  if (request.status !== "PENDING") return { error: "Solicitud ya respondida" };

  if (accept) {
    const maxMembers = request.team.mode === "CLUBS_PRO" ? 31 : 11;
    const memberCount = await prisma.teamMember.count({ where: { teamId: request.teamId } });
    if (memberCount >= maxMembers) return { error: "Plantilla completa" };

    const inOtherTeam = await prisma.teamMember.findFirst({
      where: { userId: request.requesterId, team: { mode: request.team.mode } },
    });
    if (inOtherTeam) return { error: `${request.requester.username} ya pertenece a otro equipo de ${request.team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}` };

    await prisma.$transaction([
      prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.teamMember.create({
        data: { teamId: request.teamId, userId: request.requesterId },
      }),
      prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "TEAM_JOIN_ACCEPTED",
          title: "Solicitud aceptada",
          message: `Tu solicitud para unirte a ${request.team.name} fue aceptada`,
          relatedId: request.teamId,
          linkUrl: `/equipos/${request.teamId}`,
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", respondedAt: new Date() },
      }),
      prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "TEAM_JOIN_REJECTED",
          title: "Solicitud rechazada",
          message: `Tu solicitud para unirte a ${request.team.name} fue rechazada`,
          relatedId: request.teamId,
          linkUrl: `/equipos`,
        },
      }),
    ]);
  }

  revalidatePath(`/equipos/${request.teamId}/gestionar`);
  return { success: true };
}

// ─── OBTENER SOLICITUDES DEL EQUIPO ───────────────────────

export async function getTeamJoinRequests(teamId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return [];

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return [];
  if (team.managerId !== dbUser.id && dbUser.role !== "ADMIN") return [];

  return prisma.teamJoinRequest.findMany({
    where: { teamId, status: "PENDING" },
    include: {
      requester: {
        select: { id: true, username: true, avatarUrl: true, psnUsername: true, xboxUsername: true, pcUsername: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── ABANDONAR EQUIPO ─────────────────────────────────────

export async function leaveTeam(teamId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: dbUser.id } },
    include: { team: true },
  });
  if (!membership) return { error: "No sos miembro de este equipo" };
  if (membership.role === "MANAGER") return { error: "El DT no puede abandonar el equipo. Contactá al administrador." };

  await prisma.teamMember.delete({
    where: { id: membership.id },
  });

  await prisma.notification.create({
    data: {
      userId: membership.team.managerId,
      type: "TEAM_PLAYER_LEFT",
      title: "Jugador abandonó el equipo",
      message: `${dbUser.username} abandonó ${membership.team.name}`,
      relatedId: teamId,
      linkUrl: `/equipos/${teamId}/gestionar`,
    },
  });

  revalidatePath(`/equipos/${teamId}`);
  return { success: true };
}

// ─── ADMIN: SACAR JUGADOR ─────────────────────────────────

export async function adminRemoveMember(teamId: string, userId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  if (dbUser.role !== "ADMIN") return { error: "Solo admin puede realizar esta acción" };

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { user: true, team: true },
  });
  if (!member) return { error: "No es miembro del equipo" };

  if (member.role === "MANAGER") {
    await prisma.team.update({
      where: { id: teamId },
      data: { managerId: dbUser.id },
    });
  }

  await prisma.teamMember.delete({ where: { id: member.id } });

  revalidatePath(`/equipos/${teamId}`);
  return { success: true, message: `${member.user.username} removido de ${member.team.name}` };
}

// ─── ADMIN: DESIGNAR DT ──────────────────────────────────

export async function adminSetManager(teamId: string, userId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado" };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado" };

  if (dbUser.role !== "ADMIN") return { error: "Solo admin puede realizar esta acción" };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Equipo no encontrado" };

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "Usuario no encontrado" };

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  await prisma.$transaction([
    prisma.teamMember.updateMany({
      where: { teamId, role: "MANAGER" },
      data: { role: "PLAYER" },
    }),
    ...(membership
      ? [prisma.teamMember.update({ where: { id: membership.id }, data: { role: "MANAGER" } })]
      : [prisma.teamMember.create({ data: { teamId, userId, role: "MANAGER" } })]
    ),
    prisma.team.update({
      where: { id: teamId },
      data: { managerId: userId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { isDT: true },
    }),
  ]);

  revalidatePath(`/equipos/${teamId}`);
  return { success: true, message: `${targetUser.username} designado como DT de ${team.name}` };
}

// ─── CHECK MEMBERSHIP ─────────────────────────────────────

export async function isTeamMember(teamId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return false;

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return false;
  if (dbUser.role === "ADMIN") return true;

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: dbUser.id } },
  });
  return !!member;
}

// ─── HELPERS ───────────────────────────────────────────────

function getGamertag(user: { psnUsername: string | null; xboxUsername: string | null; pcUsername: string | null }, platform: Platform): string | null {
  switch (platform) {
    case "PS5": return user.psnUsername;
    case "XBOX": return user.xboxUsername;
    case "PC": return user.pcUsername;
    default: return null;
  }
}
