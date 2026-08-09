import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingMatches = await prisma.tournamentMatch.findMany({
      where: {
        status: { in: ["SCHEDULED", "READY_P1", "READY_P2"] },
        player1Id: { not: null },
        player2Id: { not: null },
        createdAt: { lte: cutoff },
        tournament: { status: "IN_PROGRESS" },
      },
      include: {
        tournament: { select: { name: true } },
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    if (pendingMatches.length === 0) {
      return NextResponse.json({ reminded: 0 });
    }

    const alreadyReminded = new Set(
      (
        await prisma.notification.findMany({
          where: {
            type: "MATCH_REMINDER",
            createdAt: { gte: cutoff },
            relatedId: { in: pendingMatches.map((m) => m.id) },
          },
          select: { relatedId: true },
        })
      ).map((n) => n.relatedId),
    );

    const notifications = pendingMatches
      .filter((m) => !alreadyReminded.has(m.id))
      .flatMap((match) =>
        [match.player1!, match.player2!].map((player) => {
          const rival =
            player.id === match.player1!.id
              ? match.player2!.username
              : match.player1!.username;
          return {
            userId: player.id,
            type: "MATCH_REMINDER" as const,
            title: `Partido pendiente en ${match.tournament.name}`,
            message: `Tenés un partido pendiente contra ${rival}. ¡Coordiná y jugá!`,
            relatedId: match.id,
            linkUrl: `/arena/${match.id}`,
          };
        }),
      );

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      reminded: notifications.length / 2,
      skipped: alreadyReminded.size,
    });
  } catch (error) {
    console.error("Cron match-reminders error:", error);
    return NextResponse.json(
      { error: "Error sending reminders" },
      { status: 500 },
    );
  }
}
