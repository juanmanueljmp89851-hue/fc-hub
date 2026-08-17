import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "5e9ef013-b3c4-4cd9-bf43-e5bc67784c53";

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, username: true, email: true, role: true, createdAt: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      },
      matches: {
        include: {
          player1: { select: { id: true, username: true } },
          player2: { select: { id: true, username: true } },
          winner: { select: { id: true, username: true } },
        },
      },
      standings: true,
      chatMessages: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
      auditLog: {
        include: { performedBy: { select: { id: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      format: tournament.format,
      maxPlayers: tournament.maxPlayers,
      teamType: tournament.teamType,
      platforms: tournament.platforms,
      scheduleDays: tournament.scheduleDays,
      knockoutFormat: tournament.knockoutFormat,
      knockoutSeeding: tournament.knockoutSeeding,
      hasLosersBracket: tournament.hasLosersBracket,
      createdAt: tournament.createdAt,
      createdBy: tournament.createdBy,
      drawMode: tournament.drawMode,
      drawData: tournament.drawData,
    },
    participants: tournament.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      username: p.user.username,
      status: p.status,
      joinedAt: p.joinedAt,
      confirmedAt: p.confirmedAt,
    })),
    matches: tournament.matches.map((m) => ({
      id: m.id,
      round: m.round,
      status: m.status,
      seriesId: m.seriesId,
      leg: m.leg,
      player1: m.player1,
      player2: m.player2,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      resultP1: m.resultP1,
      resultP2: m.resultP2,
      winner: m.winner,
      winnerId: m.winnerId,
      createdAt: m.createdAt,
    })),
    standings: tournament.standings,
    chatMessages: tournament.chatMessages.map((c) => ({
      id: c.id,
      text: c.text,
      username: c.user.username,
      createdAt: c.createdAt,
    })),
    auditLog: tournament.auditLog.map((a) => ({
      action: a.action,
      details: a.details,
      performedBy: a.performedBy.username,
      createdAt: a.createdAt,
    })),
  });
}
