import { prisma } from "@/lib/db";

/**
 * Get the next promoOrder value for a new card.
 * Returns (current max + 1), ensuring new cards appear first in listings.
 *
 * For scripts that use their own PrismaClient, pass it as parameter:
 *   const order = await getNextPromoOrder(myPrisma);
 */
export async function getNextPromoOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any,
): Promise<number> {
  const db = client ?? prisma;
  const top = await db.futCard.findFirst({
    orderBy: { promoOrder: "desc" },
    select: { promoOrder: true },
  });
  return (top?.promoOrder ?? 999_999) + 1;
}
