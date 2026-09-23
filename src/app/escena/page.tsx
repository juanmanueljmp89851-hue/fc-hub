import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Competitivo — EA FC 27 | Modo Fosa",
  description:
    "Escena competitiva de EA FC 27: FC Pro, Red Bull Wings Cup, UEFA eEURO, CONMEBOL eLibertadores, VPN Argentina, IESA y más.",
  alternates: { canonical: "/escena" },
};

type TournamentStatus = "live" | "upcoming" | "completed" | "tba";

interface Tournament {
  slug: string;
  name: string;
  shortName?: string;
  org: string;
  description: string;
  status: TournamentStatus;
  statusLabel: string;
  dates: string;
  prizePool?: string;
  mode: string;
  region: string;
  links: { label: string; url: string }[];
  hasDetailPage?: boolean;
  highlight?: boolean;
}

const STATUS_STYLES: Record<TournamentStatus, string> = {
  live: "bg-green-500/20 text-green-400 animate-pulse",
  upcoming: "bg-accent/10 text-accent",
  completed: "bg-surface-light text-foreground/50",
  tba: "bg-surface-light text-foreground/40",
};

// ─── TOURNAMENT DATA ──────────────────────────────────────

const INTERNATIONAL: Tournament[] = [
  {
    slug: "fc-pro-27",
    name: "FC Pro 27 Open",
    org: "EA Sports",
    description:
      "Circuito oficial de EA. Open Ladder clasificatoria → Regional Qualifiers → Live Event en Londres. Camino al FC Pro World Championship 2027.",
    status: "live",
    statusLabel: "Open Ladder en curso",
    dates: "Sep 2026 — Ene 2027",
    prizePool: "US$2.5M (temporada completa)",
    mode: "Ultimate Team 1v1",
    region: "Global",
    links: [
      { label: "Info oficial", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/news/fc-pro-27-deep-dive" },
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/FC_Pro_27/Open" },
    ],
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
    links: [
      { label: "Web oficial", url: "https://www.redbull.com/us-en/event-series/red-bull-wings-cup-series" },
    ],
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
    dates: "17 Oct — 10 Dic 2026",
    mode: "Ultimate Team 1v1",
    region: "Europa",
    links: [
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/UEFA_eEURO/2026" },
    ],
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
    links: [
      { label: "Info FC 26", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/news/conmebol-elibertadores-26-revealed" },
      { label: "Liquipedia", url: "https://liquipedia.net/easportsfc/ELibertadores/2026" },
    ],
  },
  {
    slug: "esports-world-cup",
    name: "Esports World Cup",
    shortName: "EWC",
    org: "Esports World Cup Foundation",
    description:
      "Mayor evento multi-juego del mundo. FC Pro World Championship se juega acá. 2026 fue en París; 2027 TBA.",
    status: "completed",
    statusLabel: "2026 finalizado (París)",
    dates: "Jul — Ago 2026",
    mode: "Ultimate Team 1v1",
    region: "Global",
    links: [
      { label: "Web oficial", url: "https://esportsworldcup.com/" },
      { label: "Liquipedia FC Pro WC", url: "https://liquipedia.net/easportsfc/FC_Pro_26/World_Championship" },
    ],
  },
  {
    slug: "fc-pro-leagues",
    name: "FC Pro Leagues",
    org: "EA Sports",
    description:
      "Ligas nacionales oficiales de EA en múltiples países. Clasificatorias → FC Pro World Championship.",
    status: "upcoming",
    statusLabel: "Temporada FC 27 próximamente",
    dates: "TBA",
    mode: "Ultimate Team 1v1",
    region: "Multi-región",
    links: [
      { label: "Web oficial", url: "https://www.ea.com/games/ea-sports-fc/fc-pro/fc-pro-leagues" },
    ],
  },
];

const ARGENTINA: Tournament[] = [
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
    highlight: true,
    hasDetailPage: true,
    links: [
      { label: "Info DEVA", url: "https://www.argentina.gob.ar/noticias/esports-argentina-con-equipo-listo-para-santa-fe-2026" },
    ],
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
    hasDetailPage: true,
    links: [
      { label: "Web", url: "https://virtualprogaming.com/" },
    ],
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
    links: [
      { label: "Web", url: "https://iesa-global.com/pro/federacion.php?sec=fed&fed=2" },
      { label: "Instagram", url: "https://www.instagram.com/iesafifaar/" },
    ],
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
    links: [
      { label: "Instagram", url: "https://www.instagram.com/licpargentina/" },
    ],
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
    links: [
      { label: "Web", url: "https://virtualprogaming.com/" },
      { label: "Instagram", url: "https://www.instagram.com/vpgesports/" },
    ],
  },
];

// ─── COMPONENTS ───────────────────────────────────────────

function StatusBadge({ status, label }: { status: TournamentStatus; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-green-400" />}
      {label}
    </span>
  );
}

function TournamentCard({ t }: { t: Tournament }) {
  const inner = (
    <div
      className={`group flex h-full flex-col rounded-xl border p-4 transition-colors ${
        t.highlight
          ? "border-gold/30 bg-gold/5 hover:border-gold/50"
          : t.status === "live"
            ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40"
            : "border-surface-light bg-surface/30 hover:border-accent/40"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold leading-tight">{t.name}</h3>
          <p className="text-[11px] text-foreground/40">{t.org}</p>
        </div>
        <StatusBadge status={t.status} label={t.statusLabel} />
      </div>

      <p className="mb-3 text-sm leading-relaxed text-foreground/60">{t.description}</p>

      <div className="mt-auto space-y-2">
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">{t.mode}</span>
          <span className="rounded bg-surface-light px-2 py-0.5 text-foreground/50">{t.region}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/40">
          <span>📅 {t.dates}</span>
          {t.prizePool && <span className="font-bold text-gold">💰 {t.prizePool}</span>}
        </div>

        {!t.hasDetailPage && t.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {t.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-accent hover:underline"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}

        {t.hasDetailPage && (
          <div className="rounded-lg bg-accent/10 py-1.5 text-center text-xs font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-background">
            Ver detalle →
          </div>
        )}
      </div>
    </div>
  );

  if (t.hasDetailPage) {
    return <Link href={`/escena/${t.slug}`}>{inner}</Link>;
  }
  return inner;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-xs text-foreground/50">{subtitle}</p>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────

export default function EscenaPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-black">Competitivo</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Torneos y ligas de EA FC 27 — internacionales y argentinas. Actualizado septiembre 2026.
          </p>
        </header>

        {/* Internacional */}
        <section className="mb-10">
          <SectionHeader
            title="🌍 Torneos Internacionales"
            subtitle="Circuito oficial EA, Red Bull, UEFA y más"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {INTERNATIONAL.map((t) => (
              <TournamentCard key={t.slug} t={t} />
            ))}
          </div>
        </section>

        {/* Argentina */}
        <section className="mb-10">
          <SectionHeader
            title="🇦🇷 Argentina"
            subtitle="Ligas locales, torneos nacionales y representación internacional"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ARGENTINA.map((t) => (
              <TournamentCard key={t.slug} t={t} />
            ))}
          </div>
        </section>

        <p className="text-center text-[11px] text-foreground/30">
          ¿Conocés un torneo que falta? Escribinos por Instagram{" "}
          <a
            href="https://instagram.com/modofosa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            @modofosa
          </a>
        </p>
      </main>
    </div>
  );
}
