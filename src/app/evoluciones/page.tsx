import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { getEvolutions, type Evolution } from "@/lib/easysbc";

export const dynamic = "force-dynamic"; // API externa: render por request, sin prerender en build

export const metadata: Metadata = {
  title: "Evoluciones — EA FC 26 | Modo Fosa",
  description:
    "Todas las Evoluciones activas de EA FC 26 en español: requisitos y mejoras de cada una. Se actualiza solo.",
  alternates: { canonical: "/evoluciones" },
};

function timeLeft(endTime: number | null): string | null {
  if (!endTime) return null;
  const ms = endTime * 1000 - Date.now();
  if (ms <= 0) return "Expira ya";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  if (d >= 1) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function EvoCard({ evo }: { evo: Evolution }) {
  const vence = timeLeft(evo.endTime);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40">
      {/* Header */}
      <div className="border-b border-surface-light px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          {evo.isNew && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-background">NUEVA</span>
          )}
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium text-foreground/60">
            {evo.category}
          </span>
        </div>
        <h3 className="text-sm font-bold leading-tight">{evo.name}</h3>
        {vence && (
          <p className="mt-1 text-[11px] text-foreground/40">Vence en {vence}</p>
        )}
      </div>

      <div className="grid flex-1 gap-3 p-4 sm:grid-cols-2">
        {/* Requisitos */}
        <div>
          <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground/40">Requisitos</h4>
          {evo.requirements.length === 0 ? (
            <p className="text-[11px] text-foreground/30">Sin requisitos</p>
          ) : (
            <ul className="space-y-1">
              {evo.requirements.map((r, i) => (
                <li key={i} className="flex justify-between gap-2 text-[11px]">
                  <span className="text-foreground/60">{r.label}</span>
                  <span className="text-right font-medium text-foreground/80">{r.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mejoras */}
        <div>
          <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground/40">Mejoras</h4>
          {evo.upgrades.length === 0 ? (
            <p className="text-[11px] text-foreground/30">—</p>
          ) : (
            <ul className="space-y-1">
              {evo.upgrades.map((u, i) => (
                <li key={i} className="flex justify-between gap-2 text-[11px]">
                  <span className="text-foreground/60">{u.label}</span>
                  <span className="text-right font-bold text-accent">{u.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function EvolucionesPage() {
  const evos = await getEvolutions();
  const nuevas = evos.filter((e) => e.isNew).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-black">🧬 Evoluciones</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Todas las Evoluciones activas de EA FC 26 — requisitos y mejoras, en español. Se actualiza solo.
          </p>
        </header>

        {evos.length === 0 ? (
          <div className="rounded-xl border border-surface-light bg-surface/30 p-8 text-center text-foreground/50">
            No hay Evoluciones activas ahora mismo.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-foreground/50">
              <span className="rounded-full bg-surface-light px-3 py-1">
                <span className="font-bold text-foreground/80">{evos.length}</span> activas
              </span>
              {nuevas > 0 && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                  <span className="font-bold">{nuevas}</span> nuevas
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {evos.map((evo) => (
                <EvoCard key={evo.id} evo={evo} />
              ))}
            </div>

            <p className="mt-6 text-center text-[11px] text-foreground/30">
              Datos de easysbc. Traducidos automáticamente.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
