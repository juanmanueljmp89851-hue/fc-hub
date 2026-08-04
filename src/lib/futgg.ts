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
}

interface SbcResponse {
  next: number | null;
  totalPages: number;
  data: RawSbc[];
}

function mapSbc(r: RawSbc): SbcSet {
  const rp = r.awards?.find((a) => a.player)?.player ?? null;
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
