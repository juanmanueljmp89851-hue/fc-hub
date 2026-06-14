"use server";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BLOCKED_PATTERNS = [
  /\b\d[\d\s\-().]{6,}\d\b/,                          // phone numbers (7+ digits)
  /[\w.+-]+@[\w-]+\.[\w.]+/i,                          // emails
  /\b(instagram|twitter|tiktok|discord|telegram|snapchat|whatsapp|facebook|fb|ig|twitch|youtube|yt)\b/i, // platform names
  /(?:https?:\/\/|www\.)\S+/i,                         // URLs
  /@[\w.]{2,}/,                                        // social handles (@user)
];

function containsBlockedContent(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ");
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function getAuthUser() {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, username: true, role: true },
  });
}

export async function sendDirectMessage(receiverId: string, text: string) {
  const dbUser = await getAuthUser();
  if (!dbUser) return { error: "No autenticado" };

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return { error: "Mensaje inválido" };

  if (dbUser.id === receiverId) return { error: "No podés enviarte mensajes a vos mismo" };

  if (containsBlockedContent(trimmed)) {
    return { error: "No se permite compartir datos de contacto, redes sociales o links externos." };
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, username: true },
  });
  if (!receiver) return { error: "Usuario no encontrado" };

  await prisma.directMessage.create({
    data: {
      senderId: dbUser.id,
      receiverId,
      text: trimmed,
    },
  });

  // Notify receiver (throttle: 1 per conversation per 5 min)
  const recentNotif = await prisma.notification.findFirst({
    where: {
      userId: receiverId,
      type: "DIRECT_MESSAGE",
      relatedId: dbUser.id,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
  });

  if (!recentNotif) {
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "DIRECT_MESSAGE",
        title: `Mensaje de ${dbUser.username}`,
        message: trimmed.slice(0, 100),
        relatedId: dbUser.id,
        linkUrl: `/mensajes/${dbUser.id}`,
      },
    });
  }

  revalidatePath(`/mensajes/${receiverId}`);
  return { success: true };
}

export async function getConversations() {
  const dbUser = await getAuthUser();
  if (!dbUser) return [];

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [{ senderId: dbUser.id }, { receiverId: dbUser.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      receiver: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  // Group by conversation partner, get latest message + unread count
  const convMap = new Map<string, {
    partnerId: string;
    partnerUsername: string;
    partnerAvatar: string | null;
    lastMessage: string;
    lastDate: Date;
    unreadCount: number;
  }>();

  for (const msg of messages) {
    const partnerId = msg.senderId === dbUser.id ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === dbUser.id ? msg.receiver : msg.sender;

    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        partnerUsername: partner.username,
        partnerAvatar: partner.avatarUrl,
        lastMessage: msg.text,
        lastDate: msg.createdAt,
        unreadCount: 0,
      });
    }

    if (!msg.read && msg.receiverId === dbUser.id) {
      const conv = convMap.get(partnerId)!;
      conv.unreadCount++;
    }
  }

  return Array.from(convMap.values()).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
}

export async function getConversation(partnerId: string) {
  const dbUser = await getAuthUser();
  if (!dbUser) return { messages: [], partner: null };

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, username: true, avatarUrl: true },
  });
  if (!partner) return { messages: [], partner: null };

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: dbUser.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: dbUser.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  // Mark unread messages as read
  await prisma.directMessage.updateMany({
    where: {
      senderId: partnerId,
      receiverId: dbUser.id,
      read: false,
    },
    data: { read: true },
  });

  return { messages, partner, currentUserId: dbUser.id };
}

export async function getUnreadDmCount() {
  const dbUser = await getAuthUser();
  if (!dbUser) return 0;

  return prisma.directMessage.count({
    where: { receiverId: dbUser.id, read: false },
  });
}

// Admin: view all conversations
export async function adminGetAllConversations() {
  const dbUser = await getAuthUser();
  if (!dbUser || dbUser.role !== "ADMIN") return [];

  const messages = await prisma.directMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
    },
  });

  return messages;
}
