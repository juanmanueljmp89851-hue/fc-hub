/**
 * Evolutions sync — fut.gg → DB (SystemConfig "active_evolutions").
 *
 * fut.gg has no public listing API for evolutions: active IDs are read from the
 * /evolutions/ page links, then each one is fetched from /api/fut/evolutions/v2/{id}/.
 * If the listing page is unreachable, falls back to probing IDs around the stored ones.
 *
 * Usage: npx tsx scripts/sync-evolutions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const KEY = "active_evolutions";
const LIST_URL = "https://www.fut.gg/evolutions/";
const DETAIL_URL = (id: number) => `https://www.fut.gg/api/fut/evolutions/v2/${id}/`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
  Accept: "application/json, text/html;q=0.9, */*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  Referer: "https://www.fut.gg/evolutions/",
};

// ─── Raw fut.gg types (only what we read) ────────────────────

interface RawText { label: string; value: string; maxValue: string | null }
interface RawLevel {
  idx: number;
  challenges: string[] | null;
  totalUpgradesText: RawText[] | null;
  upgradeOptions: { idx: number; totalUpgradesText: RawText[] | null }[] | null;
}
interface RawEvolution {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  coinsCost: number;
  pointsCost: number;
  numberOfPlayers: number;
  createdAt: string;
  endTime: string | null;
  endSubmissionTime: string | null;
  levels: RawLevel[] | null;
  totalUpgradesText: RawText[] | null;
  requirementsText: { label: string; value: string }[] | null;
  sbcName: string | null;
  objectiveGroupName: string | null;
  categoryName: string | null;
  isRewardEvolution: boolean;
  isExpired: boolean;
  hideFromListings: boolean;
  hasUpgradeChoices: boolean;
  analysis: { completionDifficulty?: string | null } | null;
}
interface RawLeveledPlayer {
  overall: number;
  position: string;
  commonName: string | null;
  firstName: string | null;
  lastName: string | null;
  cardImageUrl: string | null;
}
interface RawDetail { data: { evolution: RawEvolution; leveledPlayer: RawLeveledPlayer[] | null } }

// ─── Translation ─────────────────────────────────────────────

const LABELS: Record<string, string> = {
  Overall: "Media",
  Position: "Posición",
  "Excluded Position": "Posición excluida",
  "Max Pos.": "Posiciones máx.",
  "Min Pos.": "Posiciones mín.",
  "Max PS": "PlayStyles máx.",
  "Max PS+": "PlayStyles+ máx.",
  "Min PS": "PlayStyles mín.",
  "Min PS+": "PlayStyles+ mín.",
  Rarity: "Rareza",
  "Excluded Rarity": "Rareza excluida",
  Nation: "Nacionalidad",
  League: "Liga",
  Club: "Club",
  PlayStyle: "PlayStyle",
  "PlayStyle+": "PlayStyle+",
  "Role+": "Rol+",
  "Role++": "Rol++",
  WF: "Pierna mala",
  "Weak Foot": "Pierna mala",
  SM: "Filigranas",
  "Skill Moves": "Filigranas",
  Pace: "Ritmo",
  Shooting: "Tiro",
  Passing: "Pase",
  Dribbling: "Regate",
  Defending: "Defensa",
  Physical: "Físico",
  Physicality: "Físico",
  Acceleration: "Aceleración",
  "Sprint Speed": "Velocidad",
  Positioning: "Posicionamiento",
  Finishing: "Definición",
  "Shot Power": "Potencia de tiro",
  "Long Shots": "Tiros lejanos",
  Volleys: "Voleas",
  Penalties: "Penales",
  Vision: "Visión",
  Crossing: "Centros",
  "Fk Accuracy": "Tiros libres",
  "FK Accuracy": "Tiros libres",
  "Short Passing": "Pase corto",
  "Long Passing": "Pase largo",
  Curve: "Efecto",
  Agility: "Agilidad",
  Balance: "Equilibrio",
  Reactions: "Reacciones",
  "Ball Control": "Control del balón",
  "Dribbling (attr.)": "Regate (atrib.)",
  Composure: "Compostura",
  Interceptions: "Intercepciones",
  "Heading Accuracy": "Cabezazo",
  "Defensive Awareness": "Conciencia defensiva",
  "Standing Tackle": "Entrada de pie",
  "Sliding Tackle": "Entrada agresiva",
  Jumping: "Salto",
  Stamina: "Resistencia",
  Strength: "Fuerza",
  Aggression: "Agresividad",
  "GK Diving": "Estirada",
  "GK Handling": "Parada",
  "GK Kicking": "Saque",
  "GK Reflexes": "Reflejos",
  "GK Positioning": "Colocación",
  "GK Speed": "Velocidad (POR)",
};

const tLabel = (s: string) => LABELS[s] ?? s;
const tValue = (s: string) => s.replace(/\bMax\./g, "Máx.").replace(/\bMin\./g, "Mín.");

const CHALLENGE_RULES: [RegExp, string][] = [
  [/Send your Player to Training Camp\.?/i, "Enviá tu jugador al Training Camp."],
  [/\bon min\.? ([A-Za-z-]+) difficulty/gi, "en dificultad $1 o superior"],
  [/\(or Rush\/Rivals\/Champions\/Live Events\)/gi, "(o Rush/Rivals/Champions/Eventos en vivo)"],
  [/using your active EVO player( in game)?/gi, "con tu jugador EVO activo"],
  [/with your active EVO player( in game)?/gi, "con tu jugador EVO activo"],
  [/\bin any mode\b/gi, "en cualquier modo"],
  [/^Play 1 match\b/i, "Jugá 1 partido"],
  [/^Play (\d+) matches\b/i, "Jugá $1 partidos"],
  [/^Win 1 match\b/i, "Ganá 1 partido"],
  [/^Win (\d+) matches\b/i, "Ganá $1 partidos"],
  [/^Score 1 goal\b/i, "Marcá 1 gol"],
  [/^Score (\d+) goals\b/i, "Marcá $1 goles"],
  [/^Assist 1 goal\b/i, "Dá 1 asistencia"],
  [/^Assist (\d+) goals\b/i, "Dá $1 asistencias"],
  [/^Keep 1 clean sheet\b/i, "Mantené la valla invicta en 1 partido"],
  [/^Keep (\d+) clean sheets\b/i, "Mantené la valla invicta en $1 partidos"],
  [/\bin Squad Battles\b/g, "en Squad Battles"],
];

function tChallenge(s: string): string {
  let out = s.trim();
  for (const [re, rep] of CHALLENGE_RULES) out = out.replace(re, rep);
  return out.replace(/\s+/g, " ").replace(/\s+\./g, ".");
}

function mapStats(list: RawText[] | null | undefined): { label: string; value: string; max: number | null }[] {
  return (list ?? []).map((u) => {
    const cap = u.maxValue?.match(/\^(\d+)/)?.[1];
    return { label: tLabel(u.label), value: u.value, max: cap ? Number(cap) : null };
  });
}

// ─── Fetch ───────────────────────────────────────────────────

async function fetchWithRetry(url: string, as: "json" | "text", attempts = 3): Promise<unknown | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
      if (res.status === 404) return null;
      if (res.ok) return as === "json" ? await res.json() : await res.text();
      console.log(`  ⚠ ${url} → HTTP ${res.status} cf-ray=${res.headers.get("cf-ray") ?? "-"} intento ${attempt}/${attempts}`);
    } catch (e) {
      console.log(`  ⚠ ${url} → ${e instanceof Error ? e.message : e} intento ${attempt}/${attempts}`);
    }
    if (attempt < attempts) await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
  return null;
}

async function listingIds(): Promise<number[] | null> {
  const html = (await fetchWithRetry(LIST_URL, "text")) as string | null;
  if (!html) return null;
  const ids = new Set<number>();
  for (const m of html.matchAll(/\/evolutions\/(\d+)-[a-z0-9-]+\//g)) ids.add(Number(m[1]));
  return ids.size > 0 ? Array.from(ids) : null;
}

// Fallback when the listing page is blocked: re-check stored IDs and scan past the highest one.
async function probeIds(stored: number[]): Promise<number[]> {
  const ids = new Set(stored);
  let next = stored.length ? Math.max(...stored) + 1 : 0;
  let misses = 0;
  while (next > 0 && misses < 10) {
    const d = await fetchWithRetry(DETAIL_URL(next), "json", 1);
    if (d) { ids.add(next); misses = 0; } else misses++;
    next++;
    await new Promise((r) => setTimeout(r, 200));
  }
  return Array.from(ids);
}

function mapEvolution(e: RawEvolution, players: RawLeveledPlayer[] | null) {
  const kind = e.isRewardEvolution ? "reward" : e.categoryName ? "roles" : "standard";
  const first = players?.[0];
  const last = players?.[players.length - 1];
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    description: e.description ?? "",
    kind,
    unlockedBy: e.objectiveGroupName ?? e.sbcName ?? null,
    coinsCost: e.coinsCost ?? 0,
    pointsCost: e.pointsCost ?? 0,
    createdAt: e.createdAt,
    endTime: e.endTime,
    endSubmissionTime: e.endSubmissionTime,
    difficulty: e.analysis?.completionDifficulty ?? null,
    numberOfPlayers: e.numberOfPlayers ?? 0,
    requirements: (e.requirementsText ?? []).map((r) => ({ label: tLabel(r.label), value: tValue(r.value) })),
    upgrades: mapStats(e.totalUpgradesText),
    levels: (e.levels ?? []).map((l) => ({
      idx: l.idx,
      challenges: (l.challenges ?? []).map(tChallenge),
      upgrades: mapStats(l.totalUpgradesText),
      options: (l.upgradeOptions ?? []).length > 1 ? (l.upgradeOptions ?? []).map((o) => mapStats(o.totalUpgradesText)) : [],
    })),
    hasChoices: e.hasUpgradeChoices,
    example: first
      ? {
          name: first.commonName ?? [first.firstName, first.lastName].filter(Boolean).join(" "),
          position: first.position,
          overallFrom: first.overall,
          overallTo: last?.overall ?? first.overall,
          cardImageUrl: first.cardImageUrl,
        }
      : null,
  };
}

async function main() {
  console.log("[sync-evolutions] Fetching fut.gg evolutions...");
  const row = await prisma.systemConfig.findUnique({ where: { key: KEY } });
  const stored = new Map(((row?.value ?? []) as ReturnType<typeof mapEvolution>[]).map((e) => [e.id, e]));
  const storedIds = Array.from(stored.keys());

  let ids = await listingIds();
  if (!ids) {
    console.log("::warning::Evolutions listing page unreachable — probing IDs instead.");
    ids = await probeIds(storedIds);
  }
  console.log(`  ${ids.length} candidate IDs`);

  const evolutions: ReturnType<typeof mapEvolution>[] = [];
  let failed = 0;
  let fresh = 0;
  for (const id of ids) {
    const d = (await fetchWithRetry(DETAIL_URL(id), "json")) as RawDetail | null;
    await new Promise((r) => setTimeout(r, 200));
    if (!d?.data?.evolution) {
      failed++;
      const prev = stored.get(id);
      if (prev) evolutions.push(prev);
      continue;
    }
    const e = d.data.evolution;
    fresh++;
    if (e.isExpired || e.hideFromListings) continue;
    evolutions.push(mapEvolution(e, d.data.leveledPlayer));
  }

  if (fresh === 0 || evolutions.length === 0) {
    console.error("::error::0 active evolutions fetched from fut.gg — DB left untouched.");
    await prisma.$disconnect();
    process.exit(1);
  }
  if (failed > 0) console.log(`::warning::${failed} evolution details could not be fetched`);

  evolutions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await prisma.systemConfig.upsert({
    where: { key: KEY },
    update: { value: evolutions as unknown as object[] },
    create: { key: KEY, value: evolutions as unknown as object[] },
  });

  const newOnes = evolutions.filter((e) => !storedIds.includes(e.id)).map((e) => e.name);
  console.log(`[sync-evolutions] Done! ${evolutions.length} active${newOnes.length ? ` · new: ${newOnes.join(", ")}` : ""}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[sync-evolutions] Fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});
