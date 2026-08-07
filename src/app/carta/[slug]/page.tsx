import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { FutCard } from "@/components/jugadores/FutCard";
import { prisma } from "@/lib/db";
import { getPlayerDetail, getCommunityChemStyles, getCardFromApi, type PlayerStatGroup, type ApiCard } from "@/lib/futgg";
import { getCardComments } from "@/lib/actions/card-comments";
import { CardComments } from "@/components/cartas/CardComments";
import { createClient } from "@/lib/supabase/server";
import type { FutPlayer } from "@/types/player";

export const dynamic = "force-dynamic";

function eaIdFromSlug(slug: string): number | null {
  const last = decodeURIComponent(slug).split("-").pop() ?? "";
  const n = parseInt(last, 10);
  return isNaN(n) ? null : n;
}

async function getCard(slug: string) {
  const eaId = eaIdFromSlug(slug);
  if (eaId == null) {
    console.log(`[getCard] invalid slug: ${slug}`);
    return null;
  }
  const dbCard = await prisma.futCard.findFirst({ where: { eaId } });
  if (dbCard) {
    console.log(`[getCard] found in DB: ${dbCard.name} (eaId=${eaId})`);
    return dbCard;
  }
  console.log(`[getCard] not in DB, trying API for eaId=${eaId}`);
  const apiCard = await getCardFromApi(eaId);
  console.log(`[getCard] API result: ${apiCard ? apiCard.name : 'null'}`);
  return apiCard;
}

type CardData = NonNullable<Awaited<ReturnType<typeof prisma.futCard.findFirst>>> | ApiCard;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCard(params.slug);
  if (!c) return { title: "Carta no encontrada | Modo Fosa" };
  const name = "commonName" in c && c.commonName ? c.commonName : c.name;
  const pos = c.position;
  const promo = c.promo;
  const title = `${name} ${c.overall} ${pos}${promo ? ` — ${promo}` : ""} | EA FC 26`;
  const img = c.cardFullUrl || c.imageUrl;
  return {
    title,
    description: `${name} ${c.overall} (${pos}) de EA FC 26: stats, precio, club, liga y nación. ${promo ?? ""}`.trim(),
    openGraph: { title, images: img ? [img] : [] },
  };
}

function StatBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "#22c55e" : value >= 80 ? "#a3e635" : value >= 70 ? "#fbbf24" : value >= 60 ? "#fb923c" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-[11px] text-foreground/50">{label}</span>
      <span className="w-7 text-right text-sm font-black tabular-nums">{value}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-light">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function StatGroup({ group }: { group: PlayerStatGroup }) {
  const color =
    group.overall >= 90 ? "text-green-400" : group.overall >= 80 ? "text-lime-400" : group.overall >= 70 ? "text-yellow-400" : "text-orange-400";
  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50">{group.groupEs}</h3>
        <span className={`text-lg font-black tabular-nums ${color}`}>{group.overall}</span>
      </div>
      <div className="space-y-1.5">
        {group.stats.map((s) => (
          <StatBar key={s.name} label={s.name} value={s.value} />
        ))}
      </div>
    </div>
  );
}

function fmtCoins(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return Math.round(n / 1_000).toLocaleString("es-AR") + "K";
  return n.toLocaleString("es-AR");
}

const POS_ES: Record<string, string> = {
  GK: "POR", RB: "LD", RWB: "CDD", CB: "DFC", LB: "LI", LWB: "CDI",
  CDM: "MCD", CM: "MC", CAM: "MCO", RM: "MD", LM: "MI",
  RW: "ED", LW: "EI", RF: "DLD", LF: "DLI", CF: "MP",
  ST: "DC",
};

const FOOT_ES: Record<string, string> = {
  Right: "Derecho", Left: "Izquierdo", R: "Derecho", L: "Izquierdo",
};

function tPos(pos: string): string {
  return POS_ES[pos] ?? pos;
}

const NATION_ES: Record<string, string> = {
  Belgium: "Bélgica", Germany: "Alemania", France: "Francia", Spain: "España",
  Italy: "Italia", England: "Inglaterra", Netherlands: "Países Bajos",
  Portugal: "Portugal", Brazil: "Brasil", Argentina: "Argentina",
  Colombia: "Colombia", Uruguay: "Uruguay", Chile: "Chile", Mexico: "México",
  "United States": "Estados Unidos", Japan: "Japón", "Korea Republic": "Corea del Sur",
  China: "China", Australia: "Australia", Canada: "Canadá",
  Sweden: "Suecia", Norway: "Noruega", Denmark: "Dinamarca", Finland: "Finlandia",
  Poland: "Polonia", Austria: "Austria", Switzerland: "Suiza",
  Croatia: "Croacia", Serbia: "Serbia", Turkey: "Turquía", Greece: "Grecia",
  "Czech Republic": "República Checa", Romania: "Rumania", Hungary: "Hungría",
  Scotland: "Escocia", Wales: "Gales", Ireland: "Irlanda",
  "Republic of Ireland": "Irlanda", "Northern Ireland": "Irlanda del Norte",
  Nigeria: "Nigeria", Cameroon: "Camerún", Senegal: "Senegal",
  Ghana: "Ghana", "Ivory Coast": "Costa de Marfil", "Côte d'Ivoire": "Costa de Marfil",
  Egypt: "Egipto", Morocco: "Marruecos", Algeria: "Argelia", Tunisia: "Túnez",
  "South Africa": "Sudáfrica", "Saudi Arabia": "Arabia Saudita",
  Iran: "Irán", Iraq: "Irak", Paraguay: "Paraguay", Peru: "Perú",
  Venezuela: "Venezuela", Ecuador: "Ecuador", Bolivia: "Bolivia",
  "Costa Rica": "Costa Rica", Honduras: "Honduras", Jamaica: "Jamaica",
  Iceland: "Islandia", Ukraine: "Ucrania", Russia: "Rusia",
  Albania: "Albania", "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Montenegro: "Montenegro", "North Macedonia": "Macedonia del Norte",
  Slovenia: "Eslovenia", Slovakia: "Eslovaquia", Bulgaria: "Bulgaria",
  "Republic of China": "China", "Cape Verde": "Cabo Verde",
  Mali: "Malí", Guinea: "Guinea", Congo: "Congo",
  "DR Congo": "RD Congo", Gabon: "Gabón", Mozambique: "Mozambique",
};

function tNation(n: string): string {
  return NATION_ES[n] ?? n;
}

const ACCELERATE_ES: Record<string, string> = {
  CONTROLLED: "Controlado",
  EXPLOSIVE: "Explosivo",
  LENGTHY: "Largo",
  MOSTLY_CONTROLLED: "Mayormente Controlado",
  MOSTLY_EXPLOSIVE: "Mayormente Explosivo",
  MOSTLY_LENGTHY: "Mayormente Largo",
};

export default async function CartaPage({ params }: { params: { slug: string } }) {
  const c = await getCard(params.slug);
  if (!c) notFound();

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  let currentUserId: string | null = null;
  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: { id: true },
    });
    currentUserId = dbUser?.id ?? null;
  }

  const [detail, otherVersions, chemStyles, comments] = await Promise.all([
    getPlayerDetail(c.eaId),
    prisma.futCard.findMany({
      where: { name: c.name, NOT: { id: c.id } },
      orderBy: { overall: "desc" },
      take: 6,
      select: {
        id: true, eaId: true, name: true, overall: true, position: true,
        promo: true, cardFullUrl: true, imageUrl: true, cardBgImageUrl: true,
        cardImageId: true, cardType: true,
      },
    }),
    getCommunityChemStyles(c.eaId),
    getCardComments(c.eaId),
  ]);

  const fp: FutPlayer = {
    id: c.id,
    eaId: c.eaId,
    name: c.name,
    commonName: c.commonName ?? undefined,
    position: c.position,
    alternatePositions: c.altPositions,
    overall: c.overall,
    pace: c.pace,
    shooting: c.shooting,
    passing: c.passing,
    dribbling: c.dribbling,
    defending: c.defending,
    physical: c.physical,
    gkDiving: c.gkDiving ?? undefined,
    gkHandling: c.gkHandling ?? undefined,
    gkKicking: c.gkKicking ?? undefined,
    gkReflexes: c.gkReflexes ?? undefined,
    gkSpeed: c.gkSpeed ?? undefined,
    gkPositioning: c.gkPositioning ?? undefined,
    club: c.club,
    league: c.league,
    nation: c.nation,
    cardType: c.cardType as FutPlayer["cardType"],
    promo: c.promo ?? undefined,
    height: c.height ?? undefined,
    foot: c.foot ?? undefined,
    weakFoot: c.weakFoot ?? undefined,
    skillMoves: c.skillMoves ?? undefined,
    imageUrl: c.imageUrl ?? undefined,
    cardImageId: c.cardImageId ?? undefined,
    cardBgImageUrl: c.cardBgImageUrl ?? undefined,
    cardFullUrl: c.cardFullUrl ?? undefined,
  };

  const isGK = c.position === "GK";
  const faceStats = isGK
    ? [
        { l: "DIV", v: c.gkDiving ?? 0 }, { l: "MAN", v: c.gkHandling ?? 0 }, { l: "SAQ", v: c.gkKicking ?? 0 },
        { l: "REF", v: c.gkReflexes ?? 0 }, { l: "VEL", v: c.gkSpeed ?? 0 }, { l: "POS", v: c.gkPositioning ?? 0 },
      ]
    : [
        { l: "RIT", v: c.pace }, { l: "TIR", v: c.shooting }, { l: "PAS", v: c.passing },
        { l: "REG", v: c.dribbling }, { l: "DEF", v: c.defending }, { l: "FÍS", v: c.physical },
      ];

  const price = detail?.price ?? c.pricePs;
  const accelType = detail?.accelerateType;

  const footRaw = c.foot ?? detail?.foot ?? null;
  const meta: [string, string | null][] = [
    ["Posición", tPos(c.position)],
    ["Alt.", c.altPositions.length ? c.altPositions.map(tPos).join(", ") : null],
    ["Club", c.club || null],
    ["Liga", c.league || null],
    ["Nación", c.nation ? tNation(c.nation) : null],
    ["Pie", footRaw ? (FOOT_ES[footRaw] ?? footRaw) : null],
    ["Pie malo", (c.weakFoot ?? detail?.weakFoot) ? `${c.weakFoot ?? detail?.weakFoot}★` : null],
    ["Filigranas", (c.skillMoves ?? detail?.skillMoves) ? `${c.skillMoves ?? detail?.skillMoves}★` : null],
    ["Altura", c.height ? `${c.height} cm` : null],
    ["AcceleRATE", accelType ? (ACCELERATE_ES[accelType] ?? accelType) : null],
  ];
  const isSbc = detail?.isSbc ?? false;

  const slugify = (name: string, eaId: number) =>
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${eaId}`;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/jugadores" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Cartas
        </Link>

        {/* Header: carta + info principal */}
        <div className="flex flex-col gap-8 sm:flex-row">
          {/* Carta */}
          <div className="mx-auto shrink-0 sm:mx-0">
            <FutCard player={fp} size="lg" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black">{c.name}</h1>
                <p className="mt-1 text-sm text-foreground/50">
                  <span className="font-bold text-accent">{c.overall}</span> {tPos(c.position)}
                  {c.promo ? ` · ${c.promo}` : ""}
                </p>
              </div>
              {price != null && (
                <div className="flex items-center gap-2 rounded-lg bg-surface/50 px-3 py-1.5">
                  {isSbc && (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <div className="text-right">
                    <span className="block text-[10px] uppercase text-foreground/40">
                      {isSbc ? "Precio SBC" : "Precio"}
                    </span>
                    <span className="text-sm font-bold text-gold">{fmtCoins(price)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Face stats + Total IGS */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {faceStats.map((s) => (
                  <div key={s.l} className="rounded-lg bg-surface-light/50 px-2.5 py-1 text-center">
                    <span className="block text-[9px] font-bold uppercase text-foreground/40">{s.l}</span>
                    <span className="text-sm font-black tabular-nums">{s.v}</span>
                  </div>
                ))}
              </div>
              {detail?.totalIgs != null && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-1 text-center">
                  <span className="block text-[9px] font-bold uppercase text-accent/60">Total IGS</span>
                  <span className="text-sm font-black tabular-nums text-accent">{detail.totalIgs}</span>
                </div>
              )}
            </div>

            {/* Metadata grid */}
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {meta
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-surface-light/50 py-1">
                    <span className="text-foreground/40">{k}</span>
                    <span className="font-medium text-foreground/80">{v}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Sub-atributos detallados */}
        {detail && detail.statGroups.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Atributos detallados</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {detail.statGroups.map((g) => (
                <StatGroup key={g.group} group={g} />
              ))}
            </div>
          </section>
        )}

        {/* Community Chemistry Styles */}
        {chemStyles.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Estilos de química de la comunidad</h2>
            <div className="rounded-xl border border-surface-light bg-surface/30 p-5">
              <div className="space-y-3">
                {chemStyles.map((cs) => (
                  <div key={cs.id} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-bold text-foreground/80">{cs.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-light">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${cs.pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-bold tabular-nums text-foreground/60">
                      {cs.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-foreground/30">
                Votación de la comunidad
              </p>
            </div>
          </section>
        )}

        {/* Comentarios */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-bold">Comentarios</h2>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
              Dejá tu opinión
            </span>
          </div>
          <p className="mb-4 text-sm text-foreground/50">
            ¿Qué te parece esta carta? ¿La usaste? Contale a la comunidad tu experiencia.
          </p>
          <CardComments
            cardEaId={c.eaId}
            initialComments={comments as unknown as Parameters<typeof CardComments>[0]["initialComments"]}
            currentUserId={currentUserId}
          />
        </section>

        {/* Otras versiones */}
        {otherVersions.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Otras versiones</h2>
            <div className="flex flex-wrap gap-3">
              {otherVersions.map((v) => {
                const vp: FutPlayer = {
                  id: v.id, eaId: v.eaId, name: v.name, overall: v.overall,
                  position: v.position, alternatePositions: [],
                  pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
                  club: "", league: "", nation: "",
                  cardType: v.cardType as FutPlayer["cardType"],
                  promo: v.promo ?? undefined,
                  cardFullUrl: v.cardFullUrl ?? undefined,
                  imageUrl: v.imageUrl ?? undefined,
                  cardBgImageUrl: v.cardBgImageUrl ?? undefined,
                  cardImageId: v.cardImageId ?? undefined,
                };
                return (
                  <Link key={v.id} href={`/carta/${slugify(v.name, v.eaId)}`}>
                    <FutCard player={vp} size="sm" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
