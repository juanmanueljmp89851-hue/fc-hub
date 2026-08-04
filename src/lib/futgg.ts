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
  requirements: string[];
  cheapestCoins: number | null;
  cheapestPc: number | null;
  solutionUrl: string | null;
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
  url: string | null;
  slug: string;
  rewardPlayer: SbcAwardPlayer | null;
  challenges: SbcChallenge[];
  cheapestTotal: number | null;
  cheapestTotalPc: number | null;
}

interface RawAward {
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
  requirementsText: string[] | null;
  cheapestSolutionPrice: number | null;
  cheapestSolutionPricePc: number | null;
  cheapestSolutionUrl: string | null;
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

function mapSbc(r: RawSbc): SbcSet {
  const rp = r.awards?.find((a) => a.player)?.player ?? null;
  const challenges: SbcChallenge[] = (r.challenges ?? []).map((c) => ({
    name: c.name,
    requirements: (c.requirementsText ?? []).map(translateReq),
    cheapestCoins: c.cheapestSolutionPrice,
    cheapestPc: c.cheapestSolutionPricePc,
    solutionUrl: c.cheapestSolutionUrl ? `https://www.fut.gg${c.cheapestSolutionUrl}` : null,
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
    description: r.description,
    imageUrl: r.imageUrl,
    cost: r.cost,
    costPc: r.costPc,
    endTime: r.endTime,
    isNew: r.isNew,
    isRepeatable: r.isRepeatable,
    isExpired: r.isExpired,
    challengesCount: r.challengesCount,
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
