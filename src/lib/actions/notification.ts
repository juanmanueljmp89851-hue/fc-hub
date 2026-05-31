"use server";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@prisma/client";

export async function getMyNotifications(limit = 20) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return [];

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return [];

  return prisma.notification.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return 0;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return 0;

  return prisma.notification.count({
    where: { userId: dbUser.id, read: false },
  });
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return null;

  return prisma.notification.updateMany({
    where: { id: notificationId, userId: dbUser.id },
    data: { read: true },
  });
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return null;

  return prisma.notification.updateMany({
    where: { userId: dbUser.id, read: false },
    data: { read: true },
  });
}

/** Admin: send notification to specific user or all users */
export async function sendAdminNotification({
  targetUserId,
  title,
  message,
  broadcast,
  linkUrl,
}: {
  targetUserId?: string;
  title: string;
  message: string;
  broadcast?: boolean;
  linkUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("No autenticado");

  const adminUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true },
  });
  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  if (broadcast) {
    // Send to all users
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: allUsers.map((u) => ({
        userId: u.id,
        type: "ADMIN_MESSAGE" as NotificationType,
        title,
        message,
        linkUrl: linkUrl || null,
      })),
    });
    return { sent: allUsers.length };
  }

  // "SELF" marker = send to admin's own account (for testing)
  const resolvedTarget = targetUserId === "SELF" ? adminUser.id : targetUserId;
  if (!resolvedTarget) throw new Error("Se requiere targetUserId o broadcast");

  await prisma.notification.create({
    data: {
      userId: resolvedTarget,
      type: "ADMIN_MESSAGE" as NotificationType,
      title,
      message,
      linkUrl: linkUrl || null,
    },
  });
  return { sent: 1 };
}
