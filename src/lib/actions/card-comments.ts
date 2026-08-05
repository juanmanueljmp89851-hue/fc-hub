"use server";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function getCardComments(cardEaId: number) {
  return prisma.cardComment.findMany({
    where: { cardEaId, parentId: null },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function addCardComment(cardEaId: number, text: string, parentId?: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) {
    return { error: "El comentario debe tener entre 1 y 500 caracteres." };
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "Tenés que estar registrado para comentar." };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado." };

  const comment = await prisma.cardComment.create({
    data: {
      cardEaId,
      userId: dbUser.id,
      text: trimmed,
      parentId: parentId ?? null,
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return { comment };
}

export async function deleteCardComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "No autenticado." };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return { error: "Usuario no encontrado." };

  const comment = await prisma.cardComment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Comentario no encontrado." };
  if (comment.userId !== dbUser.id && dbUser.role !== "ADMIN") {
    return { error: "No tenés permiso para borrar este comentario." };
  }

  await prisma.cardComment.deleteMany({ where: { parentId: commentId } });
  await prisma.cardComment.delete({ where: { id: commentId } });

  return { success: true };
}
