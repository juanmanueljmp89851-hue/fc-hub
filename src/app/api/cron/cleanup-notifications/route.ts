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
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const { count } = await prisma.notification.deleteMany({
      where: { createdAt: { lte: cutoff } },
    });

    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("Cron cleanup-notifications error:", error);
    return NextResponse.json(
      { error: "Error cleaning notifications" },
      { status: 500 },
    );
  }
}
