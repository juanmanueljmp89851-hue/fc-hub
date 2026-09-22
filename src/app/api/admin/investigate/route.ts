import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSbcs } from "@/lib/futgg";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "diag") {
    const [fc26, fc27, sbcs] = await Promise.all([
      prisma.futCard.count({ where: { game: "26" } }),
      prisma.futCard.count({ where: { game: "27" } }),
      getActiveSbcs().catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) })),
    ]);

    // Direct fetch test to see what fut.gg returns from Vercel
    let directTest: Record<string, unknown> = {};
    try {
      const res = await fetch("https://www.fut.gg/api/fut/sbc/27/?page=1", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const text = await res.text();
      directTest = {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        bodyLength: text.length,
        bodyPreview: text.substring(0, 500),
        isJson: text.startsWith("{") || text.startsWith("["),
      };
    } catch (e: unknown) {
      directTest = { fetchError: e instanceof Error ? e.message : String(e) };
    }

    return NextResponse.json({
      cards: { fc26, fc27 },
      sbcs: Array.isArray(sbcs) ? { count: sbcs.length, names: sbcs.slice(0, 5).map(s => s.name) } : sbcs,
      directFutggTest: directTest,
    });
  }

  if (action === "bundle") {
    const pos = parseInt(searchParams.get("pos") || "32814");
    const range = parseInt(searchParams.get("range") || "200");
    try {
      const bundlePath = join(process.cwd(), ".next/server/app/torneos/[id]/page.js");
      const content = readFileSync(bundlePath, "utf-8");
      const start = Math.max(0, pos - range);
      const end = Math.min(content.length, pos + range);
      const snippet = content.substring(start, end);
      const markerPos = pos - start;
      return NextResponse.json({
        totalLength: content.length,
        position: pos,
        snippetStart: start,
        snippetEnd: end,
        snippet,
        markerPos,
        around: snippet.substring(markerPos - 50, markerPos + 50),
      });
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
    }
  }

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
