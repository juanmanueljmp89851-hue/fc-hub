/**
 * fut.gg card sync — reemplaza scraping de FUTBIN por API pública fut.gg.
 *
 * Endpoint: https://www.fut.gg/api/fut/players/v2/26/  (JSON, sin API key)
 * Newest-first. Recorre páginas hasta cutoff por fecha de release.
 *
 * Uso:
 *   npx tsx scripts/sync-futgg.ts                 # diario: últimos 2 días
 *   npx tsx scripts/sync-futgg.ts --days 40       # backfill: últimos 40 días
 *   npx tsx scripts/sync-futgg.ts --max-pages 500 # tope de páginas
 *
 * Corre en GitHub Actions (nube) → funciona con la compu apagada.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME = "26";
const API = `https://www.fut.gg/api/fut/players/v2/${GAME}/`;

function arg(name: string, def: number): number {
  const raw = process.argv.find((a) => a.startsWith(`--${name}`));
  if (!raw) return def;
  const val = raw.includes("=") ? raw.split("=")[1] : process.argv[process.argv.indexOf(raw) + 1];
  const n = parseInt(val ?? "");
  return isNaN(n) ? def : n;
}

const LOOKBACK_DAYS = arg("days", 2);
const MAX_PAGES = arg("max-pages", 400);

// ─── Tipos ───────────────────────────────────────────────────

interface FutggFaceStats {
  facePace: number; faceShooting: number; facePassing: number;
  faceDribbling: number; faceDefending: number; facePhysicality: number;
  gkFaceDiving: number; gkFaceHandling: number; gkFaceKicking: number;
  gkFaceReflexes: number; gkFaceSpeed: number; gkFacePositioning: number;
}

interface FutggPlayer {
  eaId: number;
  basePlayerEaId: number;
  overall: number;
  commonName: string | null;
  cardName: string | null;
  firstName: string | null;
  lastName: string | null;
  rarityName: string | null;
  isIcon: boolean;
  isHero: boolean;
  isSpecial: boolean;
  isEvolutionPlayerItem: boolean;
  position: string;
  alternativePositions: string[] | null;
  foot: string | null;
  weakFoot: number | null;
  skillMoves: number | null;
  height: number | null;
  attackingWorkrate: string | null;
  defensiveWorkrate: string | null;
  price: number | null;
  hasPrice: boolean;
  createdAt: string;
  url: string | null;
  imageUrl: string | null;
  rarityImageUrl: string | null;
  faceStatsV2: FutggFaceStats | null;
  club: { name: string } | null;
  league: { name: string } | null;
  nation: { name: string; countryCode: string } | null;
}

interface ApiResponse {
  next: number | null;
  currentPage: number;
  total: number;
  data: FutggPlayer[];
}

// ─── Mapeo rareza → cardType conocido (para gradiente del render) ───

function mapCardType(p: FutggPlayer): string {
  if (p.isIcon) return "icon";
  if (p.isHero) return "hero";
  const r = (p.rarityName ?? "").toLowerCase();
  if (r.includes("tots") || r.includes("team of the season")) return "tots";
  if (r.includes("toty") || r.includes("team of the year")) return "toty";
  if (r.includes("end of") && r.includes("era")) return "end_of_era";
  if (r.includes("path to glory")) return "path_to_glory";
  if (r.includes("national pride") && r.includes("red")) return "national_pride_red";
  if (r.includes("national pride")) return "national_pride";
  if (r.includes("showdown")) return "showdown";
  if (p.isSpecial) return "special";
  // No especial → oro común/raro (heurística por rareza)
  if (r.includes("rare")) return "gold_rare";
  if (r.includes("common")) return "gold_common";
  return "gold_rare";
}

function displayName(p: FutggPlayer): string {
  if (p.commonName) return p.commonName;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return full || p.cardName || `Player ${p.eaId}`;
}

// ─── Fetch con reintento ─────────────────────────────────────

async function fetchPage(page: number): Promise<ApiResponse> {
  const url = `${API}?page=${page}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as ApiResponse;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ⚠ Página ${page} intento ${attempt}/3 falló: ${msg}`);
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error("unreachable");
}

// ─── Upsert ──────────────────────────────────────────────────

async function upsertPlayer(p: FutggPlayer): Promise<"created" | "updated" | "skipped"> {
  if (!p.eaId || !p.faceStatsV2) return "skipped";

  const cardType = mapCardType(p);
  const fs = p.faceStatsV2;
  const isGK = p.position === "GK";
  // release date → promoOrder monótono (minutos desde epoch): más nuevo = mayor.
  // Minutos (~29.7M para 2026) garantiza que futgg quede por encima de las
  // cartas futbin legacy (order ~6M), sin borrar nada.
  const releaseDate = new Date(p.createdAt);
  const promoOrder = Math.floor(releaseDate.getTime() / 60_000);

  const existing = await prisma.futCard.findUnique({
    where: { eaId_cardType: { eaId: p.eaId, cardType } },
    select: { id: true },
  });

  const data = {
    name: displayName(p),
    commonName: p.commonName ?? undefined,
    overall: p.overall,
    position: p.position,
    altPositions: p.alternativePositions ?? [],
    pace: fs.facePace,
    shooting: fs.faceShooting,
    passing: fs.facePassing,
    dribbling: fs.faceDribbling,
    defending: fs.faceDefending,
    physical: fs.facePhysicality,
    gkDiving: isGK ? fs.gkFaceDiving : null,
    gkHandling: isGK ? fs.gkFaceHandling : null,
    gkKicking: isGK ? fs.gkFaceKicking : null,
    gkReflexes: isGK ? fs.gkFaceReflexes : null,
    gkSpeed: isGK ? fs.gkFaceSpeed : null,
    gkPositioning: isGK ? fs.gkFacePositioning : null,
    club: p.club?.name ?? "",
    league: p.league?.name ?? "",
    nation: p.nation?.name ?? "",
    nationCode: p.nation?.countryCode || null,
    cardType,
    promo: p.rarityName ?? undefined,
    promoOrder,
    releaseDate,
    imageUrl: p.imageUrl ?? undefined,
    cardBgImageUrl: p.rarityImageUrl ?? undefined,
    skillMoves: p.skillMoves ?? undefined,
    weakFoot: p.weakFoot ?? undefined,
    foot: p.foot ?? undefined,
    height: p.height ?? undefined,
    workRateAtk: p.attackingWorkrate ?? undefined,
    workRateDef: p.defensiveWorkrate ?? undefined,
    pricePs: p.hasPrice && p.price ? p.price : undefined,
    pricePc: p.hasPrice && p.price ? p.price : undefined,
    source: "futgg",
    sourceUrl: p.url ? `https://www.fut.gg${p.url}` : undefined,
  };

  await prisma.futCard.upsert({
    where: { eaId_cardType: { eaId: p.eaId, cardType } },
    update: data,
    create: { eaId: p.eaId, ...data },
  });

  return existing ? "updated" : "created";
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  console.log(`\n🟢 Sync fut.gg FC${GAME} — ${new Date().toLocaleString("es-AR")}`);
  console.log(`   Cutoff release: ${cutoff.toISOString()} (${LOOKBACK_DAYS} días)`);
  console.log(`   Tope páginas: ${MAX_PAGES}\n`);

  let created = 0, updated = 0, skipped = 0, evos = 0;
  let page = 1;

  while (page <= MAX_PAGES) {
    const res = await fetchPage(page);
    const cards = res.data;
    if (cards.length === 0) break;

    let pageAllOld = true;
    for (const p of cards) {
      if (new Date(p.createdAt) >= cutoff) pageAllOld = false;
      if (p.isEvolutionPlayerItem) { evos++; continue; }
      const r = await upsertPlayer(p);
      if (r === "created") created++;
      else if (r === "updated") updated++;
      else skipped++;
    }

    const newest = cards[0]?.createdAt?.slice(0, 10) ?? "?";
    console.log(`  📄 Pág ${page} → ${cards.length} cartas (release ${newest}) | +${created} nuevas, ~${updated} act`);

    if (pageAllOld) {
      console.log(`  ⏹️  Página entera más vieja que cutoff — corto.`);
      break;
    }
    if (res.next === null) break;
    page++;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Hecho: ${created} nuevas, ${updated} actualizadas, ${skipped} skip, ${evos} evos ignoradas\n`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
