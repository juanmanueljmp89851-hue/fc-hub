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

interface RawAward {
  pack?: string | null;
  evolutionName?: string | null;
  player?: {
    commonName: string | null;
    cardName: string | null;
    overall: number;
    rarityName: string | null;
    imageUrl: string | null;
  } | null;
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
  faceStatsV2: FutggFaceStats | null;
  club: { name: string } | null;
  league: { name: string } | null;
  nation: { name: string } | null;
  skillMoves: number | null;
  weakFoot: number | null;
  cardImageUrl: string | null;
  imageUrl: string | null;
  price: number | null;
  hasPrice: boolean;
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
