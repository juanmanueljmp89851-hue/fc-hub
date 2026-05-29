// ─── FUT PLAYER TYPES ──────────────────────────────────────

export type CardType =
  | "gold_rare"
  | "gold_common"
  | "silver_rare"
  | "silver_common"
  | "bronze_rare"
  | "bronze_common"
  | "tots"
  | "toty"
  | "icon"
  | "hero"
  | "special";

export type PositionCategory = "ATK" | "MID" | "DEF" | "GK";

export interface FutPlayer {
  id: string;
  eaId?: number;
  name: string;
  commonName?: string;
  position: string;
  alternatePositions?: string[];
  overall: number;
  // Face stats (outfield)
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  // GK stats
  gkDiving?: number;
  gkHandling?: number;
  gkKicking?: number;
  gkPositioning?: number;
  gkReflexes?: number;
  gkSpeed?: number;
  // Meta
  club: string;
  league: string;
  nation: string;
  nationFlag?: string;
  cardType: CardType;
  promo?: string;
  promoOrder?: number;
  height?: number;
  weight?: number;
  foot?: string;
  weakFoot?: number;
  skillMoves?: number;
  workRateAtk?: string;
  workRateDef?: string;
  bodyType?: string;
  // CDN
  imageUrl?: string;
  cardImageId?: string;
  // Prices
  pricePs?: number;
  pricePc?: number;
  futbinRating?: number;
  addedAt?: string; // ISO date from DB createdAt
}

export const POSITION_MAP: Record<string, PositionCategory> = {
  ST: "ATK", CF: "ATK", LW: "ATK", RW: "ATK", LF: "ATK", RF: "ATK",
  CAM: "MID", CM: "MID", CDM: "MID", LM: "MID", RM: "MID",
  CB: "DEF", LB: "DEF", RB: "DEF", LWB: "DEF", RWB: "DEF",
  GK: "GK",
};

// ─── CDN HELPERS ─────────────────────────────────────────

/** Player face image (FC26 uses "p" prefix on EA IDs) */
export function playerFaceUrl(eaId: number): string {
  return `https://cdn.futbin.com/content/fifa26/img/players/p${eaId}.png`;
}

/** Card background image from FUTBIN CDN */
export function cardBgUrl(cardImageId: string): string {
  return `https://cdn.futbin.com/content/fifa26/img/cards/tiny/${cardImageId}.png`;
}

// ─── CARD TEXT COLORS BY CARD IMAGE ID ──────────────────

interface CardStyle {
  textColor: string;
  statLabelColor: string;
  nameColor: string;
  dividerColor: string;
}

/** Get card text/label colors based on card type for overlay readability */
export function getCardStyle(cardImageId?: string): CardStyle {
  const id = (cardImageId ?? "").toLowerCase();

  // TOTS — dark blue card, golden text
  if (id.includes("team_of_the_season") || id.includes("tots")) {
    return { textColor: "#f5db9b", statLabelColor: "#d4c07a", nameColor: "#f5db9b", dividerColor: "#f5db9b40" };
  }
  // TOTY — deep blue/gold, gold text
  if (id.includes("toty")) {
    return { textColor: "#f5db9b", statLabelColor: "#c4a060", nameColor: "#f5db9b", dividerColor: "#f5db9b40" };
  }
  // Icons — gold/dark
  if (id.includes("icon")) {
    return { textColor: "#fef3c7", statLabelColor: "#c4a636", nameColor: "#fef3c7", dividerColor: "#fef3c740" };
  }
  // Hero — teal/dark
  if (id.includes("hero")) {
    return { textColor: "#e0f0f0", statLabelColor: "#80c0d0", nameColor: "#e0f0f0", dividerColor: "#e0f0f040" };
  }
  // RTTF (UCL/UEL/UECL/UWCL) — dark blue, light text
  if (id.includes("rttf")) {
    return { textColor: "#e0e8ff", statLabelColor: "#90a0d0", nameColor: "#e0e8ff", dividerColor: "#e0e8ff40" };
  }
  // Future Stars — purple/gold
  if (id.includes("future")) {
    return { textColor: "#f5db9b", statLabelColor: "#c4a060", nameColor: "#f5db9b", dividerColor: "#f5db9b40" };
  }
  // FUT Birthday — vibrant
  if (id.includes("birthday")) {
    return { textColor: "#ffffff", statLabelColor: "#d0d0d0", nameColor: "#ffffff", dividerColor: "#ffffff40" };
  }
  // Honourable mentions
  if (id.includes("honourable")) {
    return { textColor: "#f5db9b", statLabelColor: "#c4a060", nameColor: "#f5db9b", dividerColor: "#f5db9b40" };
  }
  // TOTW
  if (id.includes("totw")) {
    return { textColor: "#fef3c7", statLabelColor: "#c4a636", nameColor: "#fef3c7", dividerColor: "#fef3c740" };
  }
  // Default special — white text on dark
  return { textColor: "#ffffff", statLabelColor: "#cccccc", nameColor: "#ffffff", dividerColor: "#ffffff40" };
}

// Legacy export for backward compatibility
export const CARD_COLORS: Record<CardType, {
  gradient: string;
  text: string;
  accent: string;
  statText: string;
  nameBg: string;
}> = {
  gold_rare: {
    gradient: "linear-gradient(160deg, #2a1f07 0%, #6d5521 15%, #c4a636 35%, #f5e291 50%, #c4a636 65%, #6d5521 85%, #2a1f07 100%)",
    text: "#f5e291", accent: "#fef3c7", statText: "#fef3c7", nameBg: "rgba(42, 31, 7, 0.6)",
  },
  gold_common: {
    gradient: "linear-gradient(160deg, #3a3015 0%, #8a7530 25%, #c4a636 50%, #8a7530 75%, #3a3015 100%)",
    text: "#d4bb4a", accent: "#e8d580", statText: "#e8d580", nameBg: "rgba(58, 48, 21, 0.6)",
  },
  silver_rare: {
    gradient: "linear-gradient(160deg, #2a2e33 0%, #5a6270 20%, #98a4b0 45%, #c8d4e0 55%, #98a4b0 70%, #5a6270 90%, #2a2e33 100%)",
    text: "#c8d4e0", accent: "#e0e8f0", statText: "#e0e8f0", nameBg: "rgba(42, 46, 51, 0.6)",
  },
  silver_common: {
    gradient: "linear-gradient(160deg, #353a40 0%, #6a7280 30%, #a0aab4 50%, #6a7280 70%, #353a40 100%)",
    text: "#a0aab4", accent: "#c0c8d0", statText: "#c0c8d0", nameBg: "rgba(53, 58, 64, 0.6)",
  },
  bronze_rare: {
    gradient: "linear-gradient(160deg, #1a0f08 0%, #4a2e1a 20%, #8a5a3a 45%, #c49b6e 55%, #8a5a3a 70%, #4a2e1a 90%, #1a0f08 100%)",
    text: "#c49b6e", accent: "#dbb890", statText: "#dbb890", nameBg: "rgba(26, 15, 8, 0.6)",
  },
  bronze_common: {
    gradient: "linear-gradient(160deg, #2a1a10 0%, #5a3a22 30%, #8a6040 50%, #5a3a22 70%, #2a1a10 100%)",
    text: "#8a6040", accent: "#a87850", statText: "#a87850", nameBg: "rgba(42, 26, 16, 0.6)",
  },
  tots: {
    gradient: "linear-gradient(160deg, #041225 0%, #0a2a5c 20%, #1565c0 40%, #42a5f5 55%, #1565c0 70%, #0a2a5c 90%, #041225 100%)",
    text: "#42a5f5", accent: "#90caf9", statText: "#bbdefb", nameBg: "rgba(4, 18, 37, 0.6)",
  },
  toty: {
    gradient: "linear-gradient(160deg, #05051a 0%, #0d0d4a 20%, #1a1a8a 40%, #3535cc 55%, #1a1a8a 70%, #0d0d4a 90%, #05051a 100%)",
    text: "#6666ff", accent: "#9999ff", statText: "#bbbbff", nameBg: "rgba(5, 5, 26, 0.6)",
  },
  icon: {
    gradient: "linear-gradient(160deg, #1a1608 0%, #3a3010 15%, #6a5520 30%, #a08530 45%, #d4c070 55%, #a08530 65%, #6a5520 80%, #3a3010 92%, #1a1608 100%)",
    text: "#d4c070", accent: "#f0e0a0", statText: "#e8d890", nameBg: "rgba(26, 22, 8, 0.6)",
  },
  hero: {
    gradient: "linear-gradient(160deg, #0a1520 0%, #1a3040 20%, #2a5a70 40%, #40a0b0 55%, #2a5a70 70%, #1a3040 90%, #0a1520 100%)",
    text: "#40a0b0", accent: "#80d0e0", statText: "#a0e0f0", nameBg: "rgba(10, 21, 32, 0.6)",
  },
  special: {
    gradient: "linear-gradient(160deg, #1a0520 0%, #3a1050 20%, #6a2080 40%, #a040c0 55%, #6a2080 70%, #3a1050 90%, #1a0520 100%)",
    text: "#a040c0", accent: "#d080f0", statText: "#e0a0ff", nameBg: "rgba(26, 5, 32, 0.6)",
  },
};
