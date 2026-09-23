import { prisma } from "@/lib/db";

const TOURNAMENTS_KEY = "active_tournaments";

export type TournamentStatus = "live" | "upcoming" | "completed" | "tba";

export interface TournamentLink {
  label: string;
  url: string;
}

export interface Tournament {
  slug: string;
  name: string;
  shortName?: string;
  org: string;
  description: string;
  status: TournamentStatus;
  statusLabel: string;
  dates: string;
  prizePool?: string;
  mode: string;
  region: string;
  category: "international" | "argentina";
  links: TournamentLink[];
  hasDetailPage?: boolean;
  highlight?: boolean;
  updatedAt?: string;
}

export async function getTournamentsFromDb(): Promise<Tournament[]> {
  const row = await prisma.systemConfig.findUnique({ where: { key: TOURNAMENTS_KEY } });
  if (!row?.value) return [];
  return row.value as unknown as Tournament[];
}

export async function saveTournamentsToDb(tournaments: Tournament[]): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: TOURNAMENTS_KEY },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { value: tournaments as any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { key: TOURNAMENTS_KEY, value: tournaments as any },
  });
}
