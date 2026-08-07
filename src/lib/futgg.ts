// Cliente de solo-lectura para la API pública de fut.gg (sin key).
// Usado para listar SBCs activos. Newest-first, paginado.

const GAME = "26";
const SBC_API = `https://www.fut.gg/api/fut/sbc/${GAME}/`;

export interface SbcAwardPlayer {
  commonName: string | null;
  cardName: string | null;
  overall: number;
  rarityName: string | null;
  imageUrl: string | null;
}

export interface SbcChallenge {
  name: string;
  description: string;
  requirements: string[];
  awards: string[];
  cheapestCoins: number | null;
  cheapestPc: number | null;
  solutionUrl: string | null;
  solutionUuid: string | null;
}

export interface SbcSet {
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
  rewardPlayer: SbcAwardPlayer | null;
  challenges: SbcChallenge[];
  cheapestTotal: number | null;
  cheapestTotalPc: number | null;
}

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
  isIcon?: boolean;
  isHero?: boolean;
  isSpecial?: boolean;
  foot?: string | null;
  weakFoot?: number | null;
  skillMoves?: number | null;
  height?: number | null;
  price?: number | null;
  hasPrice?: boolean;
  createdAt?: string;
  faceStatsV2?: {
    facePace: number; faceShooting: number; facePassing: number;
    faceDribbling: number; faceDefending: number; facePhysicality: number;
    gkFaceDiving?: number; gkFaceHandling?: number; gkFaceKicking?: number;
    gkFaceReflexes?: number; gkFaceSpeed?: number; gkFacePositioning?: number;
  } | null;
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

// Traduce un requisito de SBC (texto libre en inglés) a español.
// Reemplazos ordenados: frases largas primero, luego palabras y países.
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
  // Países comunes
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
  // Capitaliza primera letra
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// Traduce descripciones libres de SBC/desafío (plantillas comunes).
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

// Traduce recompensas (packs, jugadores, evos).
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

function mapSbc(r: RawSbc): SbcSet {
  const rp = r.awards?.find((a) => a.player)?.player ?? null;
  const challenges: SbcChallenge[] = (r.challenges ?? []).map((c) => ({
    name: c.name,
    description: translateDesc(c.description),
    requirements: (c.requirementsText ?? []).map(translateReq),
    awards: (c.awards ?? []).map(translateAward).filter((x): x is string => !!x),
    cheapestCoins: c.cheapestSolutionPrice,
    cheapestPc: c.cheapestSolutionPricePc,
    solutionUrl: c.cheapestSolutionUrl ? `https://www.fut.gg${c.cheapestSolutionUrl}` : null,
    solutionUuid: c.cheapestSolutionUrl?.match(/squad-builder\/([a-f0-9-]+)/)?.[1] ?? null,
  }));
  // Suma de la solución más barata de cada challenge (null si algún tramo no tiene precio)
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
      ? {
          commonName: rp.commonName,
          cardName: rp.cardName,
          overall: rp.overall,
          rarityName: rp.rarityName,
          imageUrl: rp.imageUrl,
        }
      : null,
    challenges,
    cheapestTotal: sum("cheapestCoins"),
    cheapestTotalPc: sum("cheapestPc"),
  };
}

/** Trae todos los SBC sets activos (no expirados), newest-first. */
export async function getActiveSbcs(): Promise<SbcSet[]> {
  const all: SbcSet[] = [];
  for (let page = 1; page <= 5; page++) {
    let res: Response;
    try {
      res = await fetch(`${SBC_API}?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)",
          Accept: "application/json",
        },
        // Revalida cada 15 min (ISR)
        next: { revalidate: 900 },
      });
    } catch {
      break;
    }
    if (!res.ok) break;
    const json = (await res.json()) as SbcResponse;
    for (const raw of json.data) {
      if (!raw.isExpired) all.push(mapSbc(raw));
    }
    if (json.next === null || page >= json.totalPages) break;
  }
  return all;
}

/** Trae un SBC por slug (busca en los activos). */
export async function getSbcBySlug(slug: string): Promise<SbcSet | null> {
  const all = await getActiveSbcs();
  return all.find((s) => s.slug === slug) ?? null;
}

// ─── Solución de SBC (squad de fut.gg, renderizado propio) ───

export interface SolutionPlayer {
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

export interface SbcSolution {
  uuid: string;
  formation: string | null;
  players: SolutionPlayer[];
  total: number | null;
}

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
  alternativePositions?: string[] | null;
  faceStatsV2: FutggFaceStats | null;
  club: { name: string } | null;
  league: { name: string } | null;
  nation: { name: string } | null;
  skillMoves: number | null;
  weakFoot: number | null;
  foot?: string | null;
  height?: number | null;
  cardImageUrl: string | null;
  imageUrl: string | null;
  rarityImageUrl?: string | null;
  rarityName?: string | null;
  isIcon?: boolean;
  isHero?: boolean;
  isSpecial?: boolean;
  isSbc?: boolean;
  price: number | null;
  hasPrice: boolean;
  createdAt?: string;
}
interface FutggFaceStats {
  facePace: number; faceShooting: number; facePassing: number;
  faceDribbling: number; faceDefending: number; facePhysicality: number;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)", Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Trae el squad-solución de fut.gg por uuid y lo arma con datos de jugadores. */
export async function getSbcSolution(uuid: string): Promise<SbcSolution | null> {
  const squad = await fetchJson<RawSquadResponse>(`https://www.fut.gg/api/squads/${uuid}/`);
  const inner = squad?.data?.data;
  const positions = inner?.activeGroupPositions ?? [];
  if (positions.length === 0) return null;

  const ids = positions.map((p) => p.playerEaId);
  const items = await fetchJson<{ data: RawPlayerItem[] }>(
    `https://www.fut.gg/api/fut/26/player-items/?ids=${ids.join(",")}`,
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

// ─── Detalle de jugador (sub-atributos, accelerate, precio) ───

export interface PlayerSubStat {
  name: string;
  value: number;
}

export interface PlayerStatGroup {
  group: string;
  groupEs: string;
  overall: number;
  stats: PlayerSubStat[];
}

export interface PlayerDetail {
  accelerateType: string | null;
  totalIgs: number;
  price: number | null;
  isSbc: boolean;
  sbcPrice: number | null;
  foot: string | null;
  weakFoot: number | null;
  skillMoves: number | null;
  height: number | null;
  statGroups: PlayerStatGroup[];
  playStyleIds: number[];
  playStylePlusIds: number[];
  rolesPlusPlus: number[];
}

const STAT_GROUP_ES: Record<string, string> = {
  PACE: "Ritmo",
  SHOOTING: "Tiro",
  PASSING: "Pase",
  DRIBBLING: "Regate",
  DEFENDING: "Defensa",
  PHYSICALITY: "Físico",
};

const STAT_NAME_ES: Record<string, string> = {
  Acceleration: "Aceleración",
  "Sprint Speed": "Velocidad",
  Positioning: "Posición",
  Finishing: "Definición",
  "Shot Power": "Potencia",
  "Long Shots": "Tiro lejano",
  Volleys: "Voleas",
  Penalties: "Penales",
  Vision: "Visión",
  Crossing: "Centros",
  "FK Accuracy": "Tiro libre",
  "Short Passing": "Pase corto",
  "Long Passing": "Pase largo",
  Curve: "Efecto",
  Agility: "Agilidad",
  Balance: "Equilibrio",
  Reactions: "Reacciones",
  "Ball Control": "Control",
  Dribbling: "Regate",
  Composure: "Compostura",
  Interceptions: "Intercepciones",
  "Heading Accuracy": "Cabezazo",
  "Defensive Awareness": "Marcaje",
  "Standing Tackle": "Entrada",
  "Sliding Tackle": "Barrida",
  Jumping: "Salto",
  Stamina: "Resistencia",
  Strength: "Fuerza",
  Aggression: "Agresividad",
};

interface RawStatGroupEntry {
  stats: { name: string; value: number }[];
  groupOverall: number;
}

interface RawPlayerDetail {
  data: {
    attributeGroups?: Record<string, RawStatGroupEntry>;
    currentPrice?: number | null;
    isSbc?: boolean;
    sbcPrice?: number | null;
    foot?: string | null;
    weakFoot?: number | null;
    skillMoves?: number | null;
  };
}

// ─── Community Chemistry Styles (votación de fut.gg) ───

const CHEM_STYLE_NAMES: Record<number, string> = {
  1: "Básico", 2: "Francotirador", 3: "Finalizador", 4: "Certero", 5: "Tirador",
  6: "Halcón", 7: "Artista", 8: "Arquitecto", 9: "Potencia", 10: "Maestro",
  11: "Motor", 12: "Centinela", 13: "Guardián", 14: "Gladiador", 15: "Columna",
  16: "Ancla", 17: "Cazador", 18: "Catalizador", 19: "Sombra",
  // POR
  20: "Muro", 21: "Escudo", 22: "Gato", 23: "Guante", 24: "Básico POR",
};

export interface ChemStyleVote {
  id: number;
  name: string;
  pct: number;
}

export async function getCommunityChemStyles(eaId: number): Promise<ChemStyleVote[]> {
  const raw = await fetchJson<{ data: { top3ChemistryStyles: [number, number][] } }>(
    `https://www.fut.gg/api/fut/players/26/${eaId}/chemistry-style/`,
  );
  if (!raw?.data?.top3ChemistryStyles) return [];
  return raw.data.top3ChemistryStyles.map(([id, pct]) => ({
    id,
    name: CHEM_STYLE_NAMES[id] ?? `Style ${id}`,
    pct,
  }));
}

export async function getPlayerDetail(eaId: number): Promise<PlayerDetail | null> {
  const [raw, bulk] = await Promise.all([
    fetchJson<RawPlayerDetail>(
      `https://www.fut.gg/api/fut/player-items/26-${eaId}/`,
    ),
    fetchJson<{ data: { accelerateType?: string; totalIgs?: number; playStyleEaIds?: number[]; playStylePlusEaIds?: number[]; rolesPlusPlus?: number[] }[] }>(
      `https://www.fut.gg/api/fut/26/player-items/?ids=${eaId}`,
    ),
  ]);
  if (!raw?.data?.attributeGroups) return null;
  const bulkData = bulk?.data?.[0];

  const groupOrder = ["PACE", "SHOOTING", "PASSING", "DRIBBLING", "DEFENDING", "PHYSICALITY"];
  const statGroups: PlayerStatGroup[] = [];
  let totalIgs = 0;

  for (const key of groupOrder) {
    const g = raw.data.attributeGroups[key];
    if (!g) continue;
    const stats = g.stats.map((s) => {
      totalIgs += s.value;
      return { name: STAT_NAME_ES[s.name] ?? s.name, value: s.value };
    });
    statGroups.push({
      group: key,
      groupEs: STAT_GROUP_ES[key] ?? key,
      overall: g.groupOverall,
      stats,
    });
  }

  return {
    accelerateType: bulkData?.accelerateType ?? null,
    totalIgs: bulkData?.totalIgs ?? totalIgs,
    price: raw.data.currentPrice ?? null,
    isSbc: raw.data.isSbc ?? false,
    sbcPrice: raw.data.sbcPrice ?? null,
    foot: raw.data.foot ?? null,
    weakFoot: raw.data.weakFoot ?? null,
    skillMoves: raw.data.skillMoves ?? null,
    height: null,
    statGroups,
    playStyleIds: bulkData?.playStyleEaIds ?? [],
    playStylePlusIds: bulkData?.playStylePlusEaIds ?? [],
    rolesPlusPlus: bulkData?.rolesPlusPlus ?? [],
  };
}

// ─── Live card fetch (like SBC model — no DB, no cron) ───

interface FutggLivePlayer {
  eaId: number;
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
  price: number | null;
  hasPrice: boolean;
  createdAt: string;
  url: string | null;
  imageUrl: string | null;
  rarityImageUrl: string | null;
  cardImageUrl: string | null;
  faceStatsV2: {
    facePace: number; faceShooting: number; facePassing: number;
    faceDribbling: number; faceDefending: number; facePhysicality: number;
    gkFaceDiving: number; gkFaceHandling: number; gkFaceKicking: number;
    gkFaceReflexes: number; gkFaceSpeed: number; gkFacePositioning: number;
  } | null;
  club: { name: string } | null;
  league: { name: string } | null;
  nation: { name: string; countryCode: string } | null;
}

interface LiveApiResponse {
  next: number | null;
  currentPage: number;
  total: number;
  data: FutggLivePlayer[];
}

function liveMapCardType(p: FutggLivePlayer): string {
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
  if (r.includes("rare")) return "gold_rare";
  if (r.includes("common")) return "gold_common";
  return "gold_rare";
}

function liveDisplayName(p: FutggLivePlayer): string {
  if (p.commonName) return p.commonName;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return full || p.cardName || `Player ${p.eaId}`;
}

export interface LiveCard {
  eaId: number;
  name: string;
  commonName?: string;
  overall: number;
  position: string;
  altPositions: string[];
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  gkDiving?: number;
  gkHandling?: number;
  gkKicking?: number;
  gkReflexes?: number;
  gkSpeed?: number;
  gkPositioning?: number;
  club: string;
  league: string;
  nation: string;
  cardType: string;
  promo?: string;
  promoOrder: number;
  height?: number;
  foot?: string;
  weakFoot?: number;
  skillMoves?: number;
  imageUrl?: string;
  cardBgImageUrl?: string;
  cardFullUrl?: string;
  pricePs?: number;
  pricePc?: number;
  createdAt: string;
}

export async function getLatestCardsLive(pages = 3): Promise<LiveCard[]> {
  const [apiCards, sbcCards] = await Promise.all([
    fetchLivePages(pages),
    getSbcRewardCards(),
  ]);

  const seen = new Set(apiCards.map((c) => c.eaId));
  for (const sc of sbcCards) {
    if (!seen.has(sc.eaId)) {
      apiCards.push(sc);
      seen.add(sc.eaId);
    }
  }

  apiCards.sort((a, b) => b.promoOrder - a.promoOrder);
  return apiCards;
}

async function fetchLivePages(pages: number): Promise<LiveCard[]> {
  const cards: LiveCard[] = [];
  for (let page = 1; page <= pages; page++) {
    const res = await fetchJson<LiveApiResponse>(
      `https://www.fut.gg/api/fut/players/v2/${GAME}/?page=${page}`,
    );
    if (!res?.data?.length) break;
    for (const p of res.data) {
      if (p.isEvolutionPlayerItem || !p.faceStatsV2) continue;
      const fs = p.faceStatsV2;
      const isGK = p.position === "GK";
      const releaseDate = new Date(p.createdAt);
      cards.push({
        eaId: p.eaId,
        name: liveDisplayName(p),
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
        gkDiving: isGK ? fs.gkFaceDiving : undefined,
        gkHandling: isGK ? fs.gkFaceHandling : undefined,
        gkKicking: isGK ? fs.gkFaceKicking : undefined,
        gkReflexes: isGK ? fs.gkFaceReflexes : undefined,
        gkSpeed: isGK ? fs.gkFaceSpeed : undefined,
        gkPositioning: isGK ? fs.gkFacePositioning : undefined,
        club: p.club?.name ?? "",
        league: p.league?.name ?? "",
        nation: p.nation?.name ?? "",
        cardType: liveMapCardType(p),
        promo: p.rarityName ?? undefined,
        promoOrder: Math.floor(releaseDate.getTime() / 60_000),
        height: p.height ?? undefined,
        foot: p.foot ?? undefined,
        weakFoot: p.weakFoot ?? undefined,
        skillMoves: p.skillMoves ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        cardBgImageUrl: p.rarityImageUrl ?? undefined,
        cardFullUrl: p.cardImageUrl?.replace("width=300", "width=500") ?? undefined,
        pricePs: p.hasPrice && p.price ? p.price : undefined,
        pricePc: p.hasPrice && p.price ? p.price : undefined,
        createdAt: p.createdAt,
      });
    }
    if (res.next === null) break;
  }
  return cards;
}

async function getSbcRewardCards(): Promise<LiveCard[]> {
  const cards: LiveCard[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetchJson<SbcResponse>(`${SBC_API}?page=${page}`);
    if (!res?.data?.length) break;
    for (const sbc of res.data) {
      if (sbc.isExpired) continue;
      const allAwards = [
        ...(sbc.awards ?? []),
        ...(sbc.challenges ?? []).flatMap((c) => c.awards ?? []),
      ];
      for (const award of allAwards) {
        const p = award.player;
        if (!p?.eaId || !p.faceStatsV2 || !p.position) continue;
        const fs = p.faceStatsV2;
        const isGK = p.position === "GK";
        const created = p.createdAt ?? new Date().toISOString();
        const releaseDate = new Date(created);
        const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
        const name = p.commonName ?? (fullName || p.cardName || `Player ${p.eaId}`);
        cards.push({
          eaId: p.eaId,
          name,
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
          gkDiving: isGK ? fs.gkFaceDiving : undefined,
          gkHandling: isGK ? fs.gkFaceHandling : undefined,
          gkKicking: isGK ? fs.gkFaceKicking : undefined,
          gkReflexes: isGK ? fs.gkFaceReflexes : undefined,
          gkSpeed: isGK ? fs.gkFaceSpeed : undefined,
          gkPositioning: isGK ? fs.gkFacePositioning : undefined,
          club: p.club?.name ?? "",
          league: p.league?.name ?? "",
          nation: p.nation?.name ?? "",
          cardType: liveMapCardType(p as unknown as FutggLivePlayer),
          promo: p.rarityName ?? undefined,
          promoOrder: Math.floor(releaseDate.getTime() / 60_000),
          height: p.height ?? undefined,
          foot: p.foot ?? undefined,
          weakFoot: p.weakFoot ?? undefined,
          skillMoves: p.skillMoves ?? undefined,
          imageUrl: p.imageUrl ?? undefined,
          cardBgImageUrl: p.rarityImageUrl ?? undefined,
          cardFullUrl: p.cardImageUrl?.replace("width=300", "width=500") ?? undefined,
          createdAt: created,
        });
      }
    }
    if (res.next === null || page >= res.totalPages) break;
  }
  return cards;
}

export interface ApiCard {
  id: string;
  eaId: number;
  name: string;
  commonName: string | null;
  position: string;
  altPositions: string[];
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  gkDiving: number | null;
  gkHandling: number | null;
  gkKicking: number | null;
  gkReflexes: number | null;
  gkSpeed: number | null;
  gkPositioning: number | null;
  club: string;
  league: string;
  nation: string;
  cardType: string;
  promo: string | null;
  promoOrder: number;
  height: number | null;
  foot: string | null;
  weakFoot: number | null;
  skillMoves: number | null;
  imageUrl: string | null;
  cardImageId: string | null;
  cardBgImageUrl: string | null;
  cardFullUrl: string | null;
  pricePs: number | null;
  pricePc: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCardFromApi(eaId: number): Promise<ApiCard | null> {
  let p: RawPlayerItem | undefined;
  try {
    const res = await fetch(`https://www.fut.gg/api/fut/26/player-items/?ids=${eaId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)", Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[getCardFromApi] fut.gg returned ${res.status} for eaId=${eaId}`);
      return null;
    }
    const json = (await res.json()) as { data: RawPlayerItem[] };
    p = json?.data?.[0];
  } catch (err) {
    console.error(`[getCardFromApi] fetch failed for eaId=${eaId}:`, err);
    return null;
  }
  if (!p?.faceStatsV2) return null;

  const fs = p.faceStatsV2;
  const isGK = p.position === "GK";
  const name = p.commonName ?? ([p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.cardName || `Player ${eaId}`);
  const created = p.createdAt ? new Date(p.createdAt) : new Date();

  return {
    id: `api-${eaId}`,
    eaId,
    name,
    commonName: p.commonName,
    position: p.position,
    altPositions: p.alternativePositions ?? [],
    overall: p.overall,
    pace: fs.facePace,
    shooting: fs.faceShooting,
    passing: fs.facePassing,
    dribbling: fs.faceDribbling,
    defending: fs.faceDefending,
    physical: fs.facePhysicality,
    gkDiving: isGK ? (fs as unknown as Record<string, number>).gkFaceDiving ?? null : null,
    gkHandling: isGK ? (fs as unknown as Record<string, number>).gkFaceHandling ?? null : null,
    gkKicking: isGK ? (fs as unknown as Record<string, number>).gkFaceKicking ?? null : null,
    gkReflexes: isGK ? (fs as unknown as Record<string, number>).gkFaceReflexes ?? null : null,
    gkSpeed: isGK ? (fs as unknown as Record<string, number>).gkFaceSpeed ?? null : null,
    gkPositioning: isGK ? (fs as unknown as Record<string, number>).gkFacePositioning ?? null : null,
    club: p.club?.name ?? "",
    league: p.league?.name ?? "",
    nation: p.nation?.name ?? "",
    cardType: p.isIcon ? "icon" : p.isHero ? "hero" : p.isSpecial ? "special" : "gold_rare",
    promo: p.rarityName ?? null,
    promoOrder: Math.floor(created.getTime() / 60_000),
    height: p.height ?? null,
    foot: p.foot ?? null,
    weakFoot: p.weakFoot,
    skillMoves: p.skillMoves,
    imageUrl: p.imageUrl,
    cardImageId: null,
    cardBgImageUrl: p.rarityImageUrl ?? null,
    cardFullUrl: p.cardImageUrl?.replace("width=300", "width=500") ?? null,
    pricePs: p.hasPrice && p.price ? p.price : null,
    pricePc: p.hasPrice && p.price ? p.price : null,
    createdAt: created,
    updatedAt: created,
  };
}
