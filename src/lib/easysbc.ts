// Cliente de solo-lectura para la API pública de easysbc (sin key).
// Trae el catálogo de Evoluciones de EA FC (juego actual). Traducido a español.

const EVO_API = "https://api.easysbc.io/evolutions";

// ─── Diccionarios ES ─────────────────────────────────────────

const CATEGORY_ES: Record<string, string> = {
  Evolutions: "Evoluciones",
  Rewards: "Recompensas",
  Cosmetics: "Cosméticas",
  "Training Camp": "Campo de entrenamiento",
  Roles: "Roles",
  "PS+ Bakery": "PlayStyles+ (tienda)",
  "PS Bakery": "PlayStyles (tienda)",
  "Premium PS+ Bakery": "PlayStyles+ premium",
  "PlayStyles Lab": "Lab de PlayStyles",
  "PlayStyles+ Lab": "Lab de PlayStyles+",
};

const STATE_ES: Record<string, string> = {
  available: "Disponible",
  unachieved: "Bloqueada",
};

// Labels de requisitos + upgrades → español (stats EA FC)
const LABEL_ES: Record<string, string> = {
  Overall: "General",
  Pace: "Ritmo",
  Shooting: "Tiro",
  Passing: "Pase",
  Dribbling: "Regate",
  Defending: "Defensa",
  Physicality: "Físico",
  Shot_power: "Potencia de tiro",
  "Shot Power": "Potencia de tiro",
  PlayStyles: "PlayStyles",
  "PlayStyles+": "PlayStyles+",
  Playstyle: "PlayStyle",
  "Playstyle+": "PlayStyle+",
  "Position(s)": "Posición(es)",
  "Position#": "Posición",
  Position: "Posición",
  "Player Group": "Grupo de jugadores",
  Rarity: "Rareza",
  "Not Rarity": "Rareza distinta a",
  "Not positions": "Posiciones excluidas",
  Acceleration: "Aceleración",
  "Sprint Speed": "Velocidad",
  Agility: "Agilidad",
  Balance: "Equilibrio",
  Reactions: "Reacciones",
  "Ball Control": "Control de balón",
  Composure: "Serenidad",
  Finishing: "Definición",
  "Long Shots": "Tiros lejanos",
  Volleys: "Voleas",
  Penalties: "Penales",
  Curve: "Efecto",
  "Freekick Accuracy": "Precisión de tiros libres",
  "Heading Accuracy": "Precisión de cabeza",
  "Short Passing": "Pase corto",
  "Long Passing": "Pase largo",
  Vision: "Visión",
  Crossing: "Centros",
  Interceptions: "Intercepciones",
  "Defensive Awareness": "Colocación defensiva",
  "Standing Tackles": "Entrada",
  "Sliding Tackles": "Barrida",
  Jumping: "Salto",
  Stamina: "Resistencia",
  Strength: "Fuerza",
  Aggression: "Agresión",
  "GK Diving": "Estirada (POR)",
  "GK Handling": "Blocaje (POR)",
  "GK Kicking": "Saque (POR)",
  "GK Reflexes": "Reflejos (POR)",
  Positioning: "Colocación",
  "Skill Moves": "Filigranas",
  "Weak Foot": "Pie malo",
  "Role+": "Rol+",
  "Role++": "Rol++",
};

function tLabel(label: unknown): string {
  const s = String(label ?? "");
  return LABEL_ES[s] ?? s;
}

// Traduce valores: "Max 95" → "Máx 95", "+30 (max 96)" → "+30 (máx 96)", "Any" → "Cualquier".
// Coerce a string: algunos valores de la API vienen como número.
import { translatePositionsInText } from "@/lib/positions";

function tValue(value: unknown): string {
  return translatePositionsInText(
    String(value ?? "")
      .replace(/\bMax\b/g, "Máx")
      .replace(/\bmax\b/g, "máx")
      .replace(/\bMin\b/g, "Mín")
      .replace(/\bmin\b/g, "mín")
      .replace(/\bAny\b/g, "Cualquier"),
  );
}

// ─── Tipos ───────────────────────────────────────────────────

export interface EvoRow {
  label: string;
  value: string;
}

export interface EvoPlayer {
  eaId: number;
  name: string;
  overall: number;
  position: string;
  imageUrl: string;
  cardImageUrl: string | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  skillMoves: number;
  weakFoot: number;
}

export interface Evolution {
  id: number;
  name: string;
  category: string;
  state: string;
  isNew: boolean;
  endTime: number | null; // unix seconds
  costCoins: number;
  costXp: number;
  requirements: EvoRow[];
  upgrades: EvoRow[];
  basePlayer: EvoPlayer | null;
  evoPlayer: EvoPlayer | null;
}

interface RawRow {
  label: string;
  value: string;
  type?: string;
}
interface RawPlayer {
  resourceId: number;
  cardName: string;
  name: string;
  rating: number;
  attributes: number[];
  preferredPosition: string;
  playerUrl: string;
  skillMoves: number;
  weakFoot: number;
}
interface RawEvo {
  id: number;
  name: string;
  categoryId: number;
  state: string;
  expired: boolean;
  newEvolution: boolean;
  endTime: number | null;
  cost: { coins: number; points: number } | null;
  requirements: RawRow[] | null;
  upgrades: RawRow[] | null;
  topPlayers: { basePlayer: RawPlayer; evolutionPlayer: RawPlayer }[] | null;
}
interface RawResponse {
  categories: { id: number; name: string }[];
  evolutions: RawEvo[];
}

/** Trae las evoluciones activas (no expiradas), traducidas a español. */
export async function getEvolutions(): Promise<Evolution[]> {
  let res: Response;
  try {
    res = await fetch(EVO_API, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)",
        Accept: "application/json",
      },
      next: { revalidate: 1800 }, // 30 min ISR
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json()) as RawResponse;

  const catName = new Map(json.categories.map((c) => [c.id, c.name]));

  function mapPlayer(p: RawPlayer | undefined, cardImages: Map<number, string>): EvoPlayer | null {
    if (!p) return null;
    const attrs = p.attributes ?? [];
    return {
      eaId: p.resourceId,
      name: p.cardName || p.name,
      overall: p.rating,
      position: p.preferredPosition,
      imageUrl: p.playerUrl,
      cardImageUrl: cardImages.get(p.resourceId) ?? null,
      pace: attrs[0] ?? 0,
      shooting: attrs[1] ?? 0,
      passing: attrs[2] ?? 0,
      dribbling: attrs[3] ?? 0,
      defending: attrs[4] ?? 0,
      physical: attrs[5] ?? 0,
      skillMoves: p.skillMoves ?? 0,
      weakFoot: p.weakFoot ?? 0,
    };
  }

  const active = json.evolutions.filter((e) => !e.expired);

  // Collect unique resourceIds to batch-fetch card images from fut.gg
  const eaIds = new Set<number>();
  for (const e of active) {
    const top = e.topPlayers?.[0];
    if (top?.basePlayer?.resourceId) eaIds.add(top.basePlayer.resourceId);
    if (top?.evolutionPlayer?.resourceId) eaIds.add(top.evolutionPlayer.resourceId);
  }

  const cardImages = new Map<number, string>();
  if (eaIds.size > 0) {
    try {
      const idsParam = [...eaIds].join(",");
      const imgRes = await fetch(
        `https://www.fut.gg/api/fut/26/player-items/?ids=${idsParam}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ModoFosaBot/1.0)",
            Accept: "application/json",
          },
          next: { revalidate: 1800 },
        },
      );
      if (imgRes.ok) {
        const imgJson = (await imgRes.json()) as {
          data: { eaId: number; cardImageUrl?: string }[];
        };
        for (const p of imgJson.data ?? []) {
          if (p.cardImageUrl) cardImages.set(p.eaId, p.cardImageUrl);
        }
      }
    } catch {
      // card images optional — continue without
    }
  }

  return active
    .map((e) => {
      const rawCat = catName.get(e.categoryId) ?? "Evoluciones";
      const top = e.topPlayers?.[0];
      return {
        id: e.id,
        name: e.name,
        category: CATEGORY_ES[rawCat] ?? rawCat,
        state: STATE_ES[e.state] ?? e.state,
        isNew: e.newEvolution,
        endTime: e.endTime,
        costCoins: e.cost?.coins ?? 0,
        costXp: e.cost?.points ?? 0,
        requirements: (e.requirements ?? []).map((r) => ({
          label: tLabel(r.label),
          value: tValue(r.value),
        })),
        upgrades: (e.upgrades ?? []).map((u) => ({
          label: tLabel(u.label),
          value: tValue(u.value),
        })),
        basePlayer: mapPlayer(top?.basePlayer, cardImages),
        evoPlayer: mapPlayer(top?.evolutionPlayer, cardImages),
      };
    })
    .sort((a, b) => Number(b.isNew) - Number(a.isNew));
}
