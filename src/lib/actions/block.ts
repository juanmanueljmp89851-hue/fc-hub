"use server";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
}

export async function blockUser(blockedId: string) {
  const dbUser = await getAuthUser();
  if (!dbUser) return { error: "No autenticado" };
  if (dbUser.id === blockedId) return { error: "No podés bloquearte a vos mismo" };

  const existing = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: dbUser.id, blockedId } },
  });
  if (existing) return { error: "Usuario ya bloqueado" };

  await prisma.blockedUser.create({
    data: { blockerId: dbUser.id, blockedId },
  });

  return { success: true };
}

export async function unblockUser(blockedId: string) {
  const dbUser = await getAuthUser();
  if (!dbUser) return { error: "No autenticado" };

  await prisma.blockedUser.deleteMany({
    where: { blockerId: dbUser.id, blockedId },
  });

  return { success: true };
}

export async function isBlocked(userId: string) {
  const dbUser = await getAuthUser();
  if (!dbUser) return false;

  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: dbUser.id, blockedId: userId },
        { blockerId: userId, blockedId: dbUser.id },
      ],
    },
  });

  return !!block;
}

export async function getBlockedUsers() {
  const dbUser = await getAuthUser();
  if (!dbUser) return [];

  return prisma.blockedUser.findMany({
    where: { blockerId: dbUser.id },
    include: {
      blocked: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
