import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { FutCard } from "@/components/jugadores/FutCard";
import { prisma } from "@/lib/db";
import type { FutPlayer } from "@/types/player";

export const revalidate = 3600; // 1h

function eaIdFromSlug(slug: string): number | null {
  const last = decodeURIComponent(slug).split("-").pop() ?? "";
  const n = parseInt(last, 10);
  return isNaN(n) ? null : n;
}

async function getCard(slug: string) {
  const eaId = eaIdFromSlug(slug);
  if (eaId == null) return null;
  return prisma.futCard.findFirst({ where: { eaId } });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCard(params.slug);
  if (!c) return { title: "Carta no encontrada | Modo Fosa" };
  const title = `${c.name} ${c.overall} ${c.position}${c.promo ? ` — ${c.promo}` : ""} | EA FC 26`;
  return {
    title,
    description: `${c.name} ${c.overall} (${c.position}) de EA FC 26: stats, precio, club, liga y nación. ${c.promo ?? ""}`.trim(),
    openGraph: { title, images: c.cardFullUrl || c.imageUrl ? [c.cardFullUrl || c.imageUrl!] : [] },
  };
}

function StatBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "#22c55e" : value >= 80 ? "#a3e635" : value >= 70 ? "#fbbf24" : value >= 60 ? "#fb923c" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-[11px] font-bold uppercase text-foreground/50">{label}</span>
      <span className="w-7 text-right text-sm font-black tabular-nums">{value}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-light">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default async function CartaPage({ params }: { params: { slug: string } }) {
  const c = await getCard(params.slug);
  if (!c) notFound();

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
  const stats = isGK
    ? [
        { l: "DIV", v: c.gkDiving ?? 0 }, { l: "MAN", v: c.gkHandling ?? 0 }, { l: "SAQ", v: c.gkKicking ?? 0 },
        { l: "REF", v: c.gkReflexes ?? 0 }, { l: "VEL", v: c.gkSpeed ?? 0 }, { l: "POS", v: c.gkPositioning ?? 0 },
      ]
    : [
        { l: "RIT", v: c.pace }, { l: "TIR", v: c.shooting }, { l: "PAS", v: c.passing },
        { l: "REG", v: c.dribbling }, { l: "DEF", v: c.defending }, { l: "FÍS", v: c.physical },
      ];

  const meta: [string, string | null][] = [
    ["Posición", c.position],
    ["Alt.", c.altPositions.length ? c.altPositions.join(", ") : null],
    ["Club", c.club || null],
    ["Liga", c.league || null],
    ["Nación", c.nation || null],
    ["Pie", c.foot ?? null],
    ["Pie malo", c.weakFoot ? `${c.weakFoot}★` : null],
    ["Filigranas", c.skillMoves ? `${c.skillMoves}★` : null],
    ["Altura", c.height ? `${c.height} cm` : null],
    ["Precio", c.pricePs ? `${c.pricePs.toLocaleString("es-AR")} coins` : null],
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/jugadores" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Cartas
        </Link>

        <div className="flex flex-col gap-8 sm:flex-row">
          {/* Carta */}
          <div className="mx-auto shrink-0 sm:mx-0">
            <FutCard player={fp} size="lg" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-black">{c.name}</h1>
            <p className="mt-1 text-sm text-foreground/50">
              <span className="font-bold text-accent">{c.overall}</span> {c.position}
              {c.promo ? ` · ${c.promo}` : ""}
            </p>

            {/* Stats */}
            <div className="mt-5 space-y-1.5">
              {stats.map((s) => (
                <StatBar key={s.l} label={s.l} value={s.v} />
              ))}
            </div>

            {/* Metadata */}
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
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
      </main>
    </div>
  );
}
