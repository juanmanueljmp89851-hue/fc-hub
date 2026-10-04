import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TOURNAMENTS_KEY = "active_tournaments";

interface Tournament {
  slug: string;
  name: string;
  shortName?: string;
  org: string;
  description: string;
  status: "live" | "upcoming" | "completed" | "tba";
  statusLabel: string;
  dates: string;
  prizePool?: string;
  mode: string;
  region: string;
  category: "international" | "argentina";
  links: { label: string; url: string }[];
  hasDetailPage?: boolean;
  highlight?: boolean;
  logoUrl?: string;
  // Ignored: updatedAt is computed in main() from whether the entry changed.
  updatedAt?: string;
}

const now = new Date().toISOString();

const LOGOS: Record<string, string> = {
  "fc-pro-27": "https://images.ctfassets.net/lz8ubpsr15g3/2qB3soMm6IEqEbgHBfEKQm/8cd02233b343f9c3f183c79b5be74f88/fc-pro-headerlogo.png?fm=webp&q=70&w=200&h=200",
  "fc-pro-leagues": "https://images.ctfassets.net/lz8ubpsr15g3/2qB3soMm6IEqEbgHBfEKQm/8cd02233b343f9c3f183c79b5be74f88/fc-pro-headerlogo.png?fm=webp&q=70&w=200&h=200",
  "red-bull-wings-cup": "https://img.redbull.com/images/c_fill,g_auto,w_450,h_450/q_auto,f_auto/redbullcom/2026/8/3/eoax1nlacot7kqu8rbq1/red-bull-wings-cup",
  "uefa-eeuro-2026": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Uefa_logo.svg/250px-Uefa_logo.svg.png",
  "conmebol-elibertadores": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Official_Image_of_CONMEBOL.svg/250px-Official_Image_of_CONMEBOL.svg.png",
  "esports-world-cup": "https://d3h9qea4qy4169.cloudfront.net/EWC_26_Paris_Logo_White_a4b2f457c3.png",
  "esports-nations-cup": "https://esportsnationscup.com/brands/enc/apple-touch-icon.png",
  "odesur-2026": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/ODESUR_Logo.svg/250px-ODESUR_Logo.svg.png",
  vpn: "https://www.virtualpronetwork.com/apps/global/grouplogos/9746f185d98b9cbb0d6c8a578552e970.png",
  iesa: "https://iesa-global.com/empresa/images/logo-transparent.png",
  vpg: "https://virtualprogaming.com/assets/vpg-icon-CucS85T0_copy-Bvqit087.png",
};

const TOURNAMENTS: Tournament[] = [
  // ─── INTERNATIONAL ────────────────────────────────────
  {
    slug: "fc-pro-27",
    name: "FC Pro 27 Open",
    org: "EA Sports",
    description:
      "Circuito oficial de EA. Open Ladder clasificatoria → Regional Qualifiers → Global Qualifier presencial en Londres (64 jugadores). Camino al FC Pro World Championship 2027.",
    status: "live",
    statusLabel: "Open Ladder finalizado (3 oct) · Regional Qualifiers 10-11 oct · Global Qualifier en Londres 5-7 nov",
    dates: "21 Sep — 3 Oct 2026 (Open Ladder, finalizado) + Regional Qualifiers 10-11 oct + Global Qualifier en Londres 5-7 nov",
    prizePool: "US$2.5M (temporada completa)",
    mode: "Ultimate Team 1v1",
    region: "Global",
    category: "international",
    links: [
      { label: "Info oficial", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/news/fc-pro-27-deep-dive" },
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/FC_Pro_27/Open" },
    ],
    updatedAt: now,
  },
  {
    slug: "red-bull-wings-cup",
    name: "Red Bull Wings Cup",
    org: "Red Bull × EA Sports",
    description:
      "Torneo global nuevo, exclusivo PS5. Liga Abierta (Ultimate Team 11v11) y Liga Universitaria (Rush) → finales nacionales offline → Final Mundial en Miami, enero 2027 (formato Kick Off 95).",
    status: "live",
    statusLabel: "Clasificatorias en curso (Liga Abierta hasta 25/10, Liga Universitaria hasta 15/11)",
    dates: "Sep 2026 — Ene 2027 (clasificatorias regionales hasta oct/nov según categoría + Final Mundial en Miami)",
    mode: "Ultimate Team 11v11 (Liga Abierta) / Rush (Liga Universitaria)",
    region: "Global (multi-país)",
    category: "international",
    links: [
      { label: "Web oficial", url: "https://www.redbull.com/us-en/event-series/red-bull-wings-cup-series" },
      { label: "Argentina", url: "https://www.redbull.com/ar-es/events/red-bull-wings-cup-argentina-2026" },
    ],
    updatedAt: now,
  },
  {
    slug: "uefa-eeuro-2026",
    name: "UEFA eEURO 2026",
    shortName: "eEURO",
    org: "UEFA × EA Sports",
    description:
      "Competencia de selecciones europeas de EA FC. Clasificatorias nacionales → evento clasificatorio online (Swiss + eliminación doble) define top 8 → final presencial en Londres. Edición FC 27.",
    status: "upcoming",
    statusLabel: "Evento clasificatorio 17-18 oct · Final presencial 12 dic en Londres",
    dates: "17-18 Oct 2026 (clasificatorio) · 12 Dic 2026 (final en BBC Studios, Londres)",
    mode: "Ultimate Team 1v1",
    region: "Europa",
    category: "international",
    links: [
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/UEFA_eEURO/2026" },
    ],
    updatedAt: now,
  },
  {
    slug: "conmebol-elibertadores",
    name: "CONMEBOL eLibertadores",
    org: "CONMEBOL × EA Sports",
    description:
      "Torneo S-Tier de Sudamérica. Clasificación vía FC Pro Ladder LATAM. Ganador obtiene plaza al FC Pro World Championship. US$100K+ en premios.",
    status: "tba",
    statusLabel: "FC 27 por anunciar",
    dates: "TBA 2027",
    prizePool: "US$100K+ (ed. anterior)",
    mode: "Ultimate Team 1v1",
    region: "Sudamérica",
    category: "international",
    links: [
      { label: "Info FC 26", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/news/conmebol-elibertadores-26-revealed" },
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/ELibertadores/2026" },
    ],
    updatedAt: now,
  },
  {
    slug: "esports-world-cup",
    name: "Esports World Cup",
    shortName: "EWC",
    org: "Esports World Cup Foundation",
    description:
      "Mayor evento multi-juego del mundo. FC Pro World Championship se juega acá. 2026 fue en París; 2027 será en Riad, Arabia Saudita.",
    status: "upcoming",
    statusLabel: "2026 finalizado (París) · 2027 anunciado: Riad",
    dates: "2026: Jul—Ago (finalizado) · 2027: 20 Jul — 1 Ago en Riad (qualifier abierto 16-18 jul)",
    mode: "Ultimate Team 1v1",
    region: "Global",
    category: "international",
    links: [
      { label: "Web oficial", url: "https://esportsworldcup.com/" },
      { label: "Liquipedia FC Pro WC", url: "https://liquipedia.net/easportsfc/FC_Pro_26/World_Championship" },
    ],
    updatedAt: now,
  },
  {
    slug: "fc-pro-leagues",
    name: "FC Pro Leagues",
    org: "EA Sports",
    description:
      "Ligas nacionales oficiales de EA en múltiples países. Clasificatorias → FC Pro World Championship.",
    status: "live",
    statusLabel: "Temporada FC 27 en curso (desde 21/sep)",
    dates: "Sep 2026 — 2027",
    mode: "Ultimate Team 1v1",
    region: "Multi-región",
    category: "international",
    links: [
      { label: "Web oficial", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/fc-pro-leagues" },
    ],
    updatedAt: now,
  },
  {
    slug: "esports-nations-cup",
    name: "Esports Nations Cup",
    shortName: "ENC",
    org: "Esports Foundation",
    description:
      "Festival de naciones (no clubes): más de 100 países compiten en 16 títulos, incluido EA Sports FC. Pospuesto de noviembre 2026 a noviembre 2027 por la situación regional en Medio Oriente.",
    status: "tba",
    statusLabel: "Pospuesto a nov. 2027 · fecha FC por confirmar",
    dates: "Nov 2027 (Riad) — fecha exacta TBA",
    mode: "Ultimate Team (selecciones)",
    region: "Global",
    category: "international",
    links: [
      { label: "Web oficial", url: "https://esportsnationscup.com/en" },
    ],
    updatedAt: now,
  },
  // ─── ARGENTINA ─────────────────────────────────────────
  {
    slug: "odesur-2026",
    name: "Juegos Suramericanos ODESUR 2026",
    shortName: "ODESUR Santa Fe",
    org: "ODESUR / DEVA Argentina",
    description:
      "Primera vez que esports otorga medallas oficiales en juegos multideportivos. Argentina: Daniela Arias oro (fem.), Lautaro Zuviría bronce (masc.).",
    status: "completed",
    statusLabel: "Finalizado",
    dates: "Septiembre 2026, Santa Fe",
    mode: "1v1",
    region: "Sudamérica",
    category: "argentina",
    highlight: true,
    hasDetailPage: true,
    links: [
      { label: "Info DEVA", url: "https://www.argentina.gob.ar/noticias/esports-argentina-con-equipo-listo-para-santa-fe-2026" },
    ],
    updatedAt: now,
  },
  {
    slug: "vpn",
    name: "Liga Argentina VPN",
    shortName: "VPN",
    org: "Virtual Pro Network",
    description:
      "Liga oficial de Clubes Pro en Xbox. 4 divisiones con ascensos y descensos. 100+ equipos. Posiciones en vivo.",
    status: "live",
    statusLabel: "Temporada en curso",
    dates: "Permanente (temporadas)",
    mode: "Clubes Pro 11v11",
    region: "Argentina",
    category: "argentina",
    hasDetailPage: true,
    links: [
      { label: "Web", url: "https://virtualprogaming.com/" },
    ],
    updatedAt: now,
  },
  {
    slug: "iesa",
    name: "IESA Argentina",
    org: "International eSports Association",
    description:
      "Liga más grande del mundo de Clubes Pro. Varias divisiones con ascensos y descensos. Temporadas regulares + playoffs.",
    status: "live",
    statusLabel: "Temporada activa",
    dates: "Permanente (temporadas)",
    mode: "Clubes Pro",
    region: "Argentina",
    category: "argentina",
    links: [
      { label: "Web", url: "https://iesa-global.com/pro/federacion.php?sec=fed&fed=2" },
      { label: "Instagram", url: "https://www.instagram.com/iesafifaar/" },
    ],
    updatedAt: now,
  },
  {
    slug: "licp",
    name: "Liga Argentina de Clubes Pro",
    shortName: "LICP",
    org: "Comunidad independiente",
    description:
      "Comunidad argentina independiente de Clubes Pro. Torneos regulares y ligas.",
    status: "live",
    statusLabel: "Activa",
    dates: "Permanente",
    mode: "Clubes Pro",
    region: "Argentina",
    category: "argentina",
    links: [
      { label: "Instagram", url: "https://www.instagram.com/licpargentina/" },
    ],
    updatedAt: now,
  },
  {
    slug: "elpf",
    name: "eLPF — Liga Profesional de Fútbol AFA",
    shortName: "eLPF",
    org: "AFA / Liga Profesional × IESA",
    description:
      "Torneo oficial de esports de la Liga Profesional de Fútbol de AFA, disputado por las 30 franquicias de Primera División. Organizado junto a IESA. La edición 2026 (FC 26) se jugó del 19 al 29 de marzo con 16 equipos.",
    status: "tba",
    statusLabel: "Edición FC 27 por anunciar",
    dates: "TBA (ed. anterior fue 19-29 mar 2026)",
    mode: "Ultimate Team competitivo (clubes AFA)",
    region: "Argentina",
    category: "argentina",
    links: [
      { label: "Web oficial", url: "https://www.ligaprofesional.ar/elpf/" },
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/ELPF/2026" },
    ],
    updatedAt: now,
  },
  {
    slug: "vpg",
    name: "VPG (Virtual Pro Gaming)",
    org: "Virtual Pro Gaming",
    description:
      "Plataforma global de 11v11. 500K+ usuarios. Ligas por zona horaria con división LATAM.",
    status: "live",
    statusLabel: "Activa",
    dates: "Permanente",
    mode: "Clubes Pro 11v11",
    region: "Global (div. LATAM)",
    category: "argentina",
    links: [
      { label: "Web", url: "https://virtualprogaming.com/" },
      { label: "Instagram", url: "https://www.instagram.com/vpgesports/" },
    ],
    updatedAt: now,
  },
];

// Postgres JSONB reorders object keys, so compare with sorted keys.
function stableJson(v: unknown): string {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x,
  );
}

async function main() {
  console.log(`Seeding ${TOURNAMENTS.length} tournaments...`);

  const row = await prisma.systemConfig.findUnique({ where: { key: TOURNAMENTS_KEY } });
  const existing = new Map(
    ((row?.value ?? []) as Record<string, unknown>[]).map((t) => [t.slug as string, t]),
  );

  // Merge instead of replace: coverage data (standings, brackets, content, ...) lives only in
  // the DB, so fields this file doesn't set must survive the daily reseed.
  const merged = TOURNAMENTS.map(({ updatedAt: _ignored, ...entry }) => {
    const seeded: Record<string, unknown> = { ...entry, logoUrl: entry.logoUrl ?? LOGOS[entry.slug] };
    if (seeded.logoUrl === undefined) delete seeded.logoUrl;
    const prev = existing.get(entry.slug);
    const changed = !prev || Object.keys(seeded).some((k) => stableJson(prev[k]) !== stableJson(seeded[k]));
    if (changed) console.log(`  ✏️  ${entry.slug} changed`);
    return { ...prev, ...seeded, updatedAt: changed ? now : (prev?.updatedAt as string | undefined) ?? now };
  });

  await prisma.systemConfig.upsert({
    where: { key: TOURNAMENTS_KEY },
    update: { value: merged as any },
    create: { key: TOURNAMENTS_KEY, value: merged as any },
  });

  console.log("✅ Tournaments saved to DB");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
