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

export async function reportUser(reportedId: string, reason: string, description?: string) {
  const dbUser = await getAuthUser();
  if (!dbUser) return { error: "No autenticado" };
  if (dbUser.id === reportedId) return { error: "No podés reportarte a vos mismo" };

  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "Motivo requerido" };

  const recent = await prisma.userReport.findFirst({
    where: {
      reporterId: dbUser.id,
      reportedId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) return { error: "Ya reportaste a este usuario en las últimas 24h" };

  await prisma.userReport.create({
    data: {
      reporterId: dbUser.id,
      reportedId,
      reason: trimmedReason,
      description: description?.trim() || null,
    },
  });

  return { success: true };
}

export async function getReports(status?: string) {
  const dbUser = await getAuthUser();
  if (!dbUser || dbUser.role !== "ADMIN") return [];

  const where = status && status !== "ALL" ? { status: status as "PENDING" | "REVIEWED" | "ACTIONED" | "DISMISSED" } : {};

  return prisma.userReport.findMany({
    where,
    include: {
      reporter: { select: { id: true, username: true, avatarUrl: true } },
      reported: { select: { id: true, username: true, avatarUrl: true, banned: true } },
      resolvedBy: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function resolveReport(reportId: string, status: "REVIEWED" | "ACTIONED" | "DISMISSED", note?: string) {
  const dbUser = await getAuthUser();
  if (!dbUser || dbUser.role !== "ADMIN") return { error: "No autorizado" };

  await prisma.userReport.update({
    where: { id: reportId },
    data: {
      status,
      resolvedById: dbUser.id,
      resolutionNote: note?.trim() || null,
      resolvedAt: new Date(),
    },
  });

  return { success: true };
}

export async function getPendingReportsCount() {
  const dbUser = await getAuthUser();
  if (!dbUser || dbUser.role !== "ADMIN") return 0;

  return prisma.userReport.count({ where: { status: "PENDING" } });
}
