/**
 * SBC sync — fetch from fut.gg API and store in DB (SystemConfig).
 *
 * Vercel can't reach fut.gg (IP blocked), so this script runs locally
 * or via GitHub Actions to keep SBCs fresh.
 *
 * Usage:
 *   npx tsx scripts/sync-sbcs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME = "27";
const SBC_API = `https://www.fut.gg/api/fut/sbc/${GAME}/`;
const SBC_KEY = "active_sbcs";

interface RawAwardPlayer {
  eaId: number;
  commonName: string | null;
  cardName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  overall: number;
  position?: string;
  alternativePositions?: string[] | null;
  rarityName: string | null;
  imageUrl: string | null;
  cardImageUrl?: string | null;
  rarityImageUrl?: string | null;
  foot?: string | null;
  weakFoot?: number | null;
  skillMoves?: number | null;
  height?: number | null;
  price?: number | null;
  hasPrice?: boolean;
  createdAt?: string;
  faceStatsV2?: Record<string, number> | null;
  club?: { name: string } | null;
  league?: { name: string } | null;
  nation?: { name: string } | null;
}

interface RawAward {
  pack?: string | null;
  evolutionName?: string | null;
  playerEaId?: number | null;
  player?: RawAwardPlayer | null;
}

interface RawChallenge {
  name: string;
  description: string | null;
  requirementsText: string[] | null;
  cheapestSolutionPrice: number | null;
  cheapestSolutionPricePc: number | null;
  cheapestSolutionUrl: string | null;
  awards: RawAward[] | null;
}

interface RawSbc {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imagePath: string | null;
  cost: number;
  costPc: number;
  endTime: string | null;
  isNew: boolean;
  isRepeatable: boolean;
  isExpired: boolean;
  challengesCount: number;
  numberOfRepeats: number;
  repeatRefreshIntervalText: string | null;
  url: string | null;
  slug: string;
  hasPlayerAward: boolean;
  awards: RawAward[] | null;
  challenges: RawChallenge[] | null;
}

interface SbcResponse {
  next: number | null;
  totalPages: number;
  data: RawSbc[];
}

const SBC_REQ_REPLACEMENTS: [RegExp, string][] = [
  [/from the same Nation/gi, "de la misma nacionalidad"],
  [/from the same League/gi, "de la misma liga"],
  [/from the same Club/gi, "del mismo club"],
  [/Squad Total Chemistry Points/gi, "puntos de química del equipo"],
  [/Nationalities in Squad/gi, "nacionalidades en el equipo"],
  [/Leagues in Squad/gi, "ligas en el equipo"],
  [/Clubs in Squad/gi, "clubes en el equipo"],
  [/Team Rating/gi, "media del equipo"],
  [/Player quality/gi, "calidad del jugador"],
  [/Number of players/gi, "cantidad de jugadores"],
  [/with OVR of/gi, "con general de"],
  [/Players from/gi, "jugadores de"],
  [/Player from/gi, "jugador de"],
  [/\bPlayers\b/gi, "jugadores"],
  [/\bPlayer\b/gi, "jugador"],
  [/\bExactly\b/gi, "exactamente"],
  [/\bExact\b/gi, "exacto"],
  [/\bMin\./gi, "mín."],
  [/\bMax\./gi, "máx."],
  [/\bRare\b/gi, "raras"],
  [/\bGold\b/gi, "oro"],
  [/\bSilver\b/gi, "plata"],
  [/\bBronze\b/gi, "bronce"],
  [/\bAny\b/gi, "cualquier"],
  [/\bOVR\b/gi, "general"],
  [/ OR /g, " o "],
  [/\bBrazil\b/g, "Brasil"],
  [/\bSpain\b/g, "España"],
  [/\bNetherlands\b/g, "Países Bajos"],
  [/\bFrance\b/g, "Francia"],
  [/\bEngland\b/g, "Inglaterra"],
  [/\bNorway\b/g, "Noruega"],
  [/\bGermany\b/g, "Alemania"],
  [/\bItaly\b/g, "Italia"],
  [/\bBelgium\b/g, "Bélgica"],
];

function translateReq(s: string): string {
  let out = s;
  for (const [re, rep] of SBC_REQ_REPLACEMENTS) out = out.replace(re, rep);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

const SBC_DESC_REPLACEMENTS: [RegExp, string][] = [
  [/Earn a pack containing/gi, "Ganá un sobre con"],
  [/Exchange a Squad featuring/gi, "Entregá un equipo con"],
  [/Exchange an? ([0-9]+)-Rated Squad/gi, "Entregá un equipo de media $1"],
  [/Exchange an?/gi, "Entregá un"],
  [/Complete this squad/gi, "Completá este equipo"],
  [/Rare Gold Player Items/gi, "jugadores oro raros"],
  [/Gold Player Items/gi, "jugadores oro"],
  [/Player Items/gi, "jugadores"],
  [/rated ([0-9]+) or higher/gi, "de $1 o más"],
  [/\bfeaturing\b/gi, "con"],
  [/\bSquad\b/gi, "equipo"],
  [/\bPlayers\b/gi, "jugadores"],
  [/\bPlayer\b/gi, "jugador"],
  [/\bRare\b/gi, "raros"],
  [/\bGold\b/gi, "oro"],
  [/\bSilver\b/gi, "plata"],
  [/\bBronze\b/gi, "bronce"],
];

function translateDesc(s: string | null): string {
  if (!s) return "";
  let out = s;
  for (const [re, rep] of SBC_DESC_REPLACEMENTS) out = out.replace(re, rep);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function translateAward(a: RawAward): string | null {
  if (a.player?.commonName) return `Jugador: ${a.player.commonName} ${a.player.overall}`;
  if (a.evolutionName) return `Evolución: ${a.evolutionName}`;
  if (a.pack) {
    return a.pack
      .replace(/Players Pack/gi, "sobre de jugadores")
      .replace(/Player Pack/gi, "sobre de jugador")
      .replace(/\bPack\b/gi, "sobre")
      .replace(/\bGold\b/gi, "oro")
      .replace(/\bSilver\b/gi, "plata")
      .replace(/\bBronze\b/gi, "bronce")
      .replace(/\bRare\b/gi, "raro")
      .replace(/\bPremium\b/gi, "premium")
      .replace(/\bSmall\b/gi, "pequeño")
      .replace(/\bJumbo\b/gi, "jumbo")
      .replace(/\bMega\b/gi, "mega");
  }
  return null;
}

interface SbcSet {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  cost: number;
  costPc: number;
  endTime: string | null;
  isNew: boolean;
  isRepeatable: boolean;
  isExpired: boolean;
  challengesCount: number;
  numberOfRepeats: number;
  repeatRefreshText: string | null;
  url: string | null;
  slug: string;
  rewardPlayer: { commonName: string | null; cardName: string | null; overall: number; rarityName: string | null; imageUrl: string | null } | null;
  challenges: { name: string; description: string; requirements: string[]; awards: string[]; cheapestCoins: number | null; cheapestPc: number | null; solutionUrl: string | null; solutionUuid: string | null }[];
  cheapestTotal: number | null;
  cheapestTotalPc: number | null;
}

function mapSbc(r: RawSbc): SbcSet {
  const rp = r.awards?.find((a) => a.player)?.player ?? null;
  const challenges = (r.challenges ?? []).map((c) => ({
    name: c.name,
    description: translateDesc(c.description),
    requirements: (c.requirementsText ?? []).map(translateReq),
    awards: (c.awards ?? []).map(translateAward).filter((x): x is string => !!x),
    cheapestCoins: c.cheapestSolutionPrice,
    cheapestPc: c.cheapestSolutionPricePc,
    solutionUrl: c.cheapestSolutionUrl ? `https://www.fut.gg${c.cheapestSolutionUrl}` : null,
    solutionUuid: c.cheapestSolutionUrl?.match(/squad-builder\/([a-f0-9-]+)/)?.[1] ?? null,
  }));

  const sum = (key: "cheapestCoins" | "cheapestPc"): number | null => {
    if (challenges.length === 0) return null;
    let total = 0;
    for (const c of challenges) {
      if (c[key] == null) return null;
      total += c[key] as number;
    }
    return total;
  };

  return {
    id: r.id,
    name: r.name,
    description: translateDesc(r.description),
    imageUrl: r.imageUrl,
    iconUrl: r.imagePath
      ? `https://game-assets.fut.gg/cdn-cgi/image/quality=85,format=auto,width=400/${r.imagePath}`
      : null,
    cost: r.cost,
    costPc: r.costPc,
    endTime: r.endTime,
    isNew: r.isNew,
    isRepeatable: r.isRepeatable,
    isExpired: r.isExpired,
    challengesCount: r.challengesCount,
    numberOfRepeats: r.numberOfRepeats ?? 0,
    repeatRefreshText: r.repeatRefreshIntervalText ?? null,
    url: r.url,
    slug: r.slug,
    rewardPlayer: rp
      ? { commonName: rp.commonName, cardName: rp.cardName, overall: rp.overall, rarityName: rp.rarityName, imageUrl: rp.imageUrl }
      : null,
    challenges,
    cheapestTotal: sum("cheapestCoins"),
    cheapestTotalPc: sum("cheapestPc"),
  };
}

// --- Solution types & fetching ---

const SOLUTIONS_KEY = "sbc_solutions";

interface RawSquadResponse {
  data?: {
    data?: {
      activeFormationId?: string | null;
      activeGroupPositions?: { playerEaId: number; positionIdx: number }[];
    };
  };
}

interface RawPlayerItem {
  eaId: number;
  commonName: string | null;
  firstName: string | null;
  lastName: string | null;
  cardName: string | null;
  overall: number;
  position: string;
  price: number | null;
  hasPrice: boolean;
  imageUrl: string | null;
  cardImageUrl: string | null;
  skillMoves: number | null;
  weakFoot: number | null;
  club?: { name: string } | null;
  league?: { name: string } | null;
  nation?: { name: string } | null;
  faceStatsV2?: Record<string, number> | null;
}

interface SolutionPlayer {
  eaId: number;
  name: string;
  commonName?: string;
  position: string;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  club: string;
  league: string;
  nation: string;
  skillMoves?: number;
  weakFoot?: number;
  cardFullUrl?: string;
  imageUrl?: string;
  price: number | null;
}

interface SbcSolution {
  uuid: string;
  formation: string | null;
  players: SolutionPlayer[];
  total: number | null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchSolution(uuid: string): Promise<SbcSolution | null> {
  const squad = await fetchJson<RawSquadResponse>(`https://www.fut.gg/api/squads/${uuid}/`);
  const inner = squad?.data?.data;
  const positions = inner?.activeGroupPositions ?? [];
  if (positions.length === 0) return null;

  const ids = positions.map((p) => p.playerEaId);
  const items = await fetchJson<{ data: RawPlayerItem[] }>(
    `https://www.fut.gg/api/fut/${GAME}/player-items/?ids=${ids.join(",")}`,
  );
  const byId = new Map((items?.data ?? []).map((p) => [p.eaId, p]));

  const players: SolutionPlayer[] = [];
  let total = 0;
  let hasAnyPrice = false;
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) continue;
    const fs = p.faceStatsV2;
    const price = p.hasPrice ? p.price : null;
    if (price != null) { total += price; hasAnyPrice = true; }
    players.push({
      eaId: p.eaId,
      name: p.commonName ?? [p.firstName, p.lastName].filter(Boolean).join(" ").trim() ?? p.cardName ?? `#${p.eaId}`,
      commonName: p.commonName ?? undefined,
      position: p.position,
      overall: p.overall,
      pace: fs?.facePace ?? 0,
      shooting: fs?.faceShooting ?? 0,
      passing: fs?.facePassing ?? 0,
      dribbling: fs?.faceDribbling ?? 0,
      defending: fs?.faceDefending ?? 0,
      physical: fs?.facePhysicality ?? 0,
      club: p.club?.name ?? "",
      league: p.league?.name ?? "",
      nation: p.nation?.name ?? "",
      skillMoves: p.skillMoves ?? undefined,
      weakFoot: p.weakFoot ?? undefined,
      cardFullUrl: (p.cardImageUrl ?? undefined)?.replace("width=300", "width=500"),
      imageUrl: p.imageUrl ?? undefined,
      price,
    });
  }

  return {
    uuid,
    formation: inner?.activeFormationId ?? null,
    players,
    total: hasAnyPrice ? total : null,
  };
}

async function syncSolutions(sbcs: SbcSet[]): Promise<void> {
  const uuids: string[] = [];
  for (const sbc of sbcs) {
    for (const ch of sbc.challenges) {
      if (ch.solutionUuid) uuids.push(ch.solutionUuid);
    }
  }

  console.log(`[sync-sbcs] Fetching ${uuids.length} solutions...`);
  const solutions: Record<string, SbcSolution> = {};
  let ok = 0;
  for (const uuid of uuids) {
    const sol = await fetchSolution(uuid);
    if (sol && sol.players.length > 0) {
      solutions[uuid] = sol;
      ok++;
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`[sync-sbcs] Got ${ok}/${uuids.length} solutions.`);

  await prisma.systemConfig.upsert({
    where: { key: SOLUTIONS_KEY },
    update: { value: solutions as unknown as Record<string, unknown> },
    create: { id: crypto.randomUUID(), key: SOLUTIONS_KEY, value: solutions as unknown as Record<string, unknown> },
  });
}

async function main() {
  console.log("[sync-sbcs] Fetching SBCs from fut.gg...");
  const all: SbcSet[] = [];

  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${SBC_API}?page=${page}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error(`[sync-sbcs] page ${page} returned ${res.status}`);
      break;
    }
    const json = (await res.json()) as SbcResponse;
    for (const raw of json.data) {
      if (!raw.isExpired) all.push(mapSbc(raw));
    }
    console.log(`  page ${page}: ${json.data.length} items (${all.length} active total)`);
    if (json.next === null || page >= json.totalPages) break;
  }

  if (all.length === 0) {
    console.warn("[sync-sbcs] ⚠️ Got 0 SBCs — skipping DB write to preserve existing data.");
    await prisma.$disconnect();
    return;
  }

  console.log(`[sync-sbcs] Saving ${all.length} SBCs to DB...`);
  await prisma.systemConfig.upsert({
    where: { key: SBC_KEY },
    update: { value: all as unknown as Record<string, unknown>[] },
    create: { id: crypto.randomUUID(), key: SBC_KEY, value: all as unknown as Record<string, unknown>[] },
  });

  // Sync solutions
  await syncSolutions(all);

  console.log(`[sync-sbcs] Done! ${all.length} SBCs + solutions stored.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[sync-sbcs] Fatal:", err);
  process.exit(1);
});
