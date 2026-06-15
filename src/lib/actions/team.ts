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

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) return { error: `Usuario "${username}" no encontrado` };

  const gamertagForPlatform = getGamertag(targetUser, team.platform);
  if (!gamertagForPlatform) {
    return { error: `${username} no tiene gamertag de ${team.platform} configurado. Debe completar su perfil.` };
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) return { error: `${username} ya está en el equipo` };

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

// ─── HELPERS ───────────────────────────────────────────────

function getGamertag(user: { psnUsername: string | null; xboxUsername: string | null; pcUsername: string | null }, platform: Platform): string | null {
  switch (platform) {
    case "PS5": return user.psnUsername;
    case "XBOX": return user.xboxUsername;
    case "PC": return user.pcUsername;
    default: return null;
  }
}
