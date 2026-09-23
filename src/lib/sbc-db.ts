import { prisma } from "@/lib/db";
import type { SbcSet } from "@/lib/futgg";

const SBC_KEY = "active_sbcs";

export async function getActiveSbcsFromDb(): Promise<SbcSet[]> {
  const row = await prisma.systemConfig.findUnique({ where: { key: SBC_KEY } });
  if (!row?.value) return [];
  return row.value as unknown as SbcSet[];
}

export async function getSbcBySlugFromDb(slug: string): Promise<SbcSet | null> {
  const all = await getActiveSbcsFromDb();
  return all.find((s) => s.slug === slug) ?? null;
}

export async function saveSbcsToDb(sbcs: SbcSet[]): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: SBC_KEY },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { value: sbcs as any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { key: SBC_KEY, value: sbcs as any },
  });
}
