import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { evoCost, getActiveEvolutionsFromDb } from "@/lib/evolutions-db";
import type { Evolution, EvoKind } from "@/lib/evolutions-db";
import { timeLeft } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Evoluciones — EA FC 27 | Modo Fosa",
  description:
    "Todas las Evoluciones activas de EA FC 27 en español: requisitos, mejoras por nivel, costo y vencimiento. Se actualiza todos los días.",
  alternates: { canonical: "/evoluciones" },
};

const SECTIONS: { kind: EvoKind; title: string; subtitle: string }[] = [
  { kind: "standard", title: "Evoluciones", subtitle: "Disponibles para cualquier jugador que cumpla los requisitos" },
  { kind: "roles", title: "Roles++", subtitle: "Suben un Rol+ a Rol++ según la posición" },
  { kind: "reward", title: "Recompensas", subtitle: "Se desbloquean con objetivos o el Pase de temporada" },
];

const NEW_WINDOW_MS = 3 * 86_400_000;

function EvoCard({ e }: { e: Evolution }) {
  const isNew = Date.now() - new Date(e.createdAt).getTime() < NEW_WINDOW_MS;
  const free = !e.coinsCost && !e.pointsCost;

  return (
    <Link
      href={`/evoluciones/${e.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40"
    >
      <div className="relative flex items-center justify-center bg-gradient-to-b from-surface-light/30 to-transparent px-4 pb-2 pt-6">
        <div className="absolute left-3 top-3 flex gap-1.5">
          {isNew && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-background">NUEVA</span>}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${free ? "bg-green-500/15 text-green-400" : "bg-gold/10 text-gold"}`}>
            {evoCost(e)}
          </span>
        </div>
        {e.example?.cardImageUrl ? (
          <Image
            src={e.example.cardImageUrl}
            alt={e.example.name}
            width={120}
            height={160}
            className="h-40 w-auto object-contain drop-shadow-lg"
            unoptimized
          />
        ) : (
          <div className="flex h-40 w-28 items-center justify-center rounded-lg bg-surface-light text-3xl">🧬</div>
        )}
        {e.example && e.example.overallTo > e.example.overallFrom && (
          <span className="absolute bottom-2 right-3 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold text-accent">
            {e.example.overallFrom} → {e.example.overallTo}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-bold leading-tight">{e.name}</h3>

        {e.requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {e.requirements.slice(0, 3).map((r) => (
              <span key={r.label} className="rounded bg-surface-light px-2 py-0.5 text-[10px] text-foreground/60">
                {r.label}: <span className="font-semibold text-foreground/80">{r.value}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-background/50 px-2 py-1.5">
            <span className="block text-[10px] uppercase text-foreground/40">Niveles</span>
            <span className="text-sm font-bold">{e.levels.length}</span>
          </div>
          <div className="rounded-lg bg-background/50 px-2 py-1.5">
            <span className="block text-[10px] uppercase text-foreground/40">Vence</span>
            <span className="text-sm font-bold">{timeLeft(e.endTime)}</span>
          </div>
        </div>

        <div className="rounded-lg bg-accent/10 py-1.5 text-center text-xs font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-background">
          Ver evolución →
        </div>
      </div>
    </Link>
  );
}

export default async function EvolucionesPage() {
  const evolutions = await getActiveEvolutionsFromDb();
  const nuevas = evolutions.filter((e) => Date.now() - new Date(e.createdAt).getTime() < NEW_WINDOW_MS).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-black">🧬 Evoluciones</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Evoluciones activas de EA FC 27: requisitos, mejoras por nivel y vencimiento. Se actualiza todos los días.
          </p>
        </header>

        {evolutions.length === 0 ? (
          <div className="rounded-xl border border-surface-light bg-surface/30 p-8 text-center text-foreground/50">
            No hay evoluciones activas ahora mismo.
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-3 text-xs text-foreground/50">
              <span className="rounded-full bg-surface-light px-3 py-1">
                <span className="font-bold text-foreground/80">{evolutions.length}</span> activas
              </span>
              {nuevas > 0 && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                  <span className="font-bold">{nuevas}</span> nuevas
                </span>
              )}
            </div>

            <div className="space-y-10">
              {SECTIONS.map(({ kind, title, subtitle }) => {
                const list = evolutions.filter((e) => e.kind === kind);
                if (list.length === 0) return null;
                return (
                  <section key={kind}>
                    <div className="mb-4">
                      <h2 className="text-lg font-bold">
                        {title} <span className="text-sm font-normal text-foreground/40">({list.length})</span>
                      </h2>
                      <p className="text-xs text-foreground/40">{subtitle}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {list.map((e) => (
                        <EvoCard key={e.id} e={e} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
