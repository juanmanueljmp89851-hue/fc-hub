import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const now = new Date();

  // Active referrals → VALIDATED + LEGACY
  const validated = await prisma.referral.updateMany({
    where: {
      isActive: true,
      invalidated: false,
      conversionStatus: "PENDING",
    },
    data: {
      conversionStatus: "VALIDATED",
      conversionRule: "LEGACY",
      convertedAt: now,
    },
  });

  // Create logs for validated ones
  const validatedReferrals = await prisma.referral.findMany({
    where: { conversionStatus: "VALIDATED", conversionRule: "LEGACY" },
    select: { id: true },
  });

  if (validatedReferrals.length > 0) {
    await prisma.conversionLog.createMany({
      data: validatedReferrals.map((r) => ({
        referralId: r.id,
        previousStatus: "PENDING",
        newStatus: "VALIDATED",
        rule: "LEGACY",
        changedBy: "SYSTEM",
        reason: "Migration V2.2: existing active referral",
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    migrated: validated.count,
    message: `${validated.count} referrals migrated to VALIDATED+LEGACY`,
  });
}
