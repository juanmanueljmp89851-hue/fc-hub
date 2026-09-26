import { prisma } from "@/lib/db";
import { fmtCoins } from "@/lib/format";

const EVOLUTIONS_KEY = "active_evolutions";

export interface EvoStat {
  label: string;
  value: string;
  max: number | null;
}

export interface EvoLevel {
  idx: number;
  challenges: string[];
  upgrades: EvoStat[];
  options: EvoStat[][];
}

export type EvoKind = "standard" | "roles" | "reward";

export interface Evolution {
  id: number;
  slug: string;
  name: string;
  description: string;
  kind: EvoKind;
  unlockedBy: string | null;
  coinsCost: number;
  pointsCost: number;
  createdAt: string;
  endTime: string | null;
  endSubmissionTime: string | null;
  difficulty: string | null;
  numberOfPlayers: number;
  requirements: { label: string; value: string }[];
  upgrades: EvoStat[];
  levels: EvoLevel[];
  hasChoices: boolean;
  example: {
    name: string;
    position: string;
    overallFrom: number;
    overallTo: number;
    cardImageUrl: string | null;
  } | null;
}

export function evoCost(e: Pick<Evolution, "coinsCost" | "pointsCost">): string {
  if (!e.coinsCost && !e.pointsCost) return "Gratis";
  const parts: string[] = [];
  if (e.coinsCost) parts.push(`${fmtCoins(e.coinsCost)} monedas`);
  if (e.pointsCost) parts.push(`${e.pointsCost} FC Points`);
  return parts.join(" · ");
}

export async function getActiveEvolutionsFromDb(): Promise<Evolution[]> {
  const row = await prisma.systemConfig.findUnique({ where: { key: EVOLUTIONS_KEY } });
  if (!row?.value) return [];
  const now = Date.now();
  return (row.value as unknown as Evolution[]).filter((e) => !e.endTime || new Date(e.endTime).getTime() > now);
}

export async function getEvolutionBySlugFromDb(slug: string): Promise<Evolution | null> {
  const all = await getActiveEvolutionsFromDb();
  return all.find((e) => e.slug === slug) ?? null;
}
