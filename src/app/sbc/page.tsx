import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveSbcs, type SbcSet } from "@/lib/futgg";

export const revalidate = 900; // 15 min

export const metadata: Metadata = {
  title: "Resolver SBC — EA FC 26 | Modo Fosa",
  description:
    "Todos los SBC (Squad Building Challenges) activos de EA FC 26: costo, premio y vencimiento. Actualizado automáticamente.",
  alternates: { canonical: "/sbc" },
};

function fmtCoins(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "K";
  return String(n);
}

function timeLeft(endTime: string | null): string {
  if (!endTime) return "Permanente";
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return "Expira ya";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  if (d >= 1) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function SbcCard({ sbc }: { sbc: SbcSet }) {
  // Requisitos únicos de todos los challenges
  const reqs = [...new Set(sbc.challenges.flatMap((c) => c.requirements))];
  const cheapest = sbc.cheapestTotal;
  // Link a la solución: si 1 challenge, directo; si varios, a la página del SBC
  // 1 desafío con uuid → solución propia interna; varios → link externo fut.gg
  const singleUuid = sbc.challenges.length === 1 ? sbc.challenges[0].solutionUuid : null;
  const internalSolution = singleUuid ? `/sbc/solucion/${singleUuid}` : null;
  const externalSolution = sbc.url
    ? `https://www.fut.gg${sbc.url}`
    : sbc.challenges.find((c) => c.solutionUrl)?.solutionUrl ?? null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40">
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        {sbc.isNew && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-background">NUEVO</span>
        )}
        {sbc.isRepeatable && (
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-bold text-foreground/70">
            🔁 Repetible
          </span>
        )}
      </div>

      {/* Reward player image */}
      <div className="flex items-center justify-center bg-gradient-to-b from-surface-light/30 to-transparent px-4 pt-6 pb-2">
        {sbc.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sbc.imageUrl}
            alt={sbc.rewardPlayer?.commonName ?? sbc.name}
            className="h-40 w-auto object-contain drop-shadow-lg"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-40 w-28 items-center justify-center rounded-lg bg-surface-light text-3xl">🎁</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-bold leading-tight">{sbc.name}</h3>

        {/* Requisitos */}
        {reqs.length > 0 && (
          <ul className="space-y-0.5 text-[11px] text-foreground/60">
            {reqs.slice(0, 4).map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-accent">›</span>
                <span className="leading-tight">{r}</span>
              </li>
            ))}
            {reqs.length > 4 && <li className="text-foreground/30">+{reqs.length - 4} más</li>}
          </ul>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-background/50 px-2.5 py-1.5">
            <span className="block text-[10px] uppercase text-foreground/40">Solución + barata</span>
            <span className="font-bold text-gold">{cheapest != null ? fmtCoins(cheapest) : fmtCoins(sbc.cost)}</span>
          </div>
          <div className="rounded-lg bg-background/50 px-2.5 py-1.5">
            <span className="block text-[10px] uppercase text-foreground/40">Vence</span>
            <span className="font-bold text-foreground/80">{timeLeft(sbc.endTime)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-foreground/50">
          <span>
            {sbc.challengesCount} desafío{sbc.challengesCount !== 1 ? "s" : ""}
            {sbc.isRepeatable ? "" : ""}
          </span>
          {sbc.rewardPlayer && (
            <span className="font-bold text-accent">{sbc.rewardPlayer.overall} OVR</span>
          )}
        </div>

        {internalSolution ? (
          <Link
            href={internalSolution}
            className="mt-1 rounded-lg bg-accent/10 py-1.5 text-center text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            Ver solución →
          </Link>
        ) : externalSolution ? (
          <a
            href={externalSolution}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 rounded-lg bg-surface-light py-1.5 text-center text-xs font-bold text-foreground/70 transition-colors hover:text-accent"
          >
            Ver solución (fut.gg) →
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default async function SbcPage() {
  const sbcs = await getActiveSbcs();
  const nuevos = sbcs.filter((s) => s.isNew);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-black">🧩 Resolver SBC</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Todos los SBC activos de EA FC 26 — costo, premio y vencimiento. Se actualiza solo.
          </p>
        </header>

        {sbcs.length === 0 ? (
          <div className="rounded-xl border border-surface-light bg-surface/30 p-8 text-center text-foreground/50">
            No hay SBC activos ahora mismo.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-foreground/50">
              <span className="rounded-full bg-surface-light px-3 py-1">
                <span className="font-bold text-foreground/80">{sbcs.length}</span> activos
              </span>
              {nuevos.length > 0 && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                  <span className="font-bold">{nuevos.length}</span> nuevos
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sbcs.map((sbc) => (
                <SbcCard key={sbc.id} sbc={sbc} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
