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
  updatedAt?: string;
}

const now = new Date().toISOString();

const TOURNAMENTS: Tournament[] = [
  // ─── INTERNATIONAL ────────────────────────────────────
  {
    slug: "fc-pro-27",
    name: "FC Pro 27 Open",
    org: "EA Sports",
    description:
      "Circuito oficial de EA. Open Ladder clasificatoria → Regional Qualifiers → Live Event en Londres. Camino al FC Pro World Championship 2027.",
    status: "live",
    statusLabel: "Open Ladder en curso · Regional Qualifiers 10-11 oct",
    dates: "21 Sep — 11 Oct 2026 (Open Ladder + Regional Qualifiers)",
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
      "Torneo global nuevo. Clasificatorias regionales online → finales nacionales offline → Final Mundial en Miami, enero 2027.",
    status: "upcoming",
    statusLabel: "Clasificatorias desde 28/sep",
    dates: "Sep 2026 — Ene 2027",
    mode: "Ultimate Team 1v1",
    region: "Global (multi-país)",
    category: "international",
    links: [
      { label: "Web oficial", url: "https://www.redbull.com/us-en/event-series/red-bull-wings-cup-series" },
    ],
    updatedAt: now,
  },
  {
    slug: "uefa-eeuro-2026",
    name: "UEFA eEURO 2026",
    shortName: "eEURO",
    org: "UEFA × EA Sports",
    description:
      "Competencia de selecciones europeas de EA FC. Fase de grupos online → playoffs → final offline. Edición FC 27.",
    status: "upcoming",
    statusLabel: "Octubre — Diciembre",
    dates: "17 Oct — 12 Dic 2026",
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
    dates: "2026: Jul—Ago (finalizado) · 2027: 20 Jul — 1 Ago (Riad)",
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

async function main() {
  console.log(`Seeding ${TOURNAMENTS.length} tournaments...`);

  await prisma.systemConfig.upsert({
    where: { key: TOURNAMENTS_KEY },
    update: { value: TOURNAMENTS as any },
    create: { key: TOURNAMENTS_KEY, value: TOURNAMENTS as any },
  });

  console.log("✅ Tournaments saved to DB");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
