"use server";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function getLobbyMessages(limit = 50) {
  return prisma.lobbyMessage.findMany({
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          rankingPoints: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function sendLobbyMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) {
    return { error: "El mensaje debe tener entre 1 y 500 caracteres." };
  }

  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Tenés que estar registrado para chatear." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, username: true, avatarUrl: true, rankingPoints: true },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado." };
  }

  const message = await prisma.lobbyMessage.create({
    data: {
      userId: dbUser.id,
      text: trimmed,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          rankingPoints: true,
        },
      },
    },
  });

  return { message };
}

export async function getTopRanking(limit = 5) {
  return prisma.user.findMany({
    where: { rankingPoints: { gt: 0 } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      rankingPoints: true,
    },
    orderBy: { rankingPoints: "desc" },
    take: limit,
  });
}

export async function getActiveMatches() {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });

  if (!dbUser) return [];

  return prisma.casualMatch.findMany({
    where: {
      OR: [{ challengerId: dbUser.id }, { challengedId: dbUser.id }],
      status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "PENDING_CONFIRMATION"] },
    },
    include: {
      challenger: { select: { id: true, username: true, avatarUrl: true } },
      challenged: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
