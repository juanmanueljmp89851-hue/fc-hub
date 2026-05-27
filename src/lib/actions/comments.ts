"use server";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function getInfluencerComments(influencerId: string) {
  return prisma.influencerComment.findMany({
    where: { influencerId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function addInfluencerComment(influencerId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) {
    return { error: "El comentario debe tener entre 1 y 500 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Tenés que estar registrado para comentar." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado." };
  }

  const comment = await prisma.influencerComment.create({
    data: {
      influencerId,
      userId: dbUser.id,
      text: trimmed,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return { comment };
}
