import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { evoCost, getEvolutionBySlugFromDb } from "@/lib/evolutions-db";
import type { EvoStat } from "@/lib/evolutions-db";
import { timeLeft } from "@/lib/format";

export const revalidate = 300;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const e = await getEvolutionBySlugFromDb(params.slug);
  if (!e) return { title: "Evolución no encontrada | Modo Fosa" };
  return {
    title: `${e.name} — Evolución EA FC 27 | Modo Fosa`,
    description: `Requisitos, mejoras por nivel y costo de la evolución ${e.name} en EA FC 27.`,
    alternates: { canonical: `/evoluciones/${e.slug}` },
  };
}

const DIFFICULTY: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil" };
const KIND_LABEL = { standard: "Evolución", roles: "Roles++", reward: "Recompensa" } as const;

// Caps only mean "can't go above X" for numeric boosts and star ratings.
function showsCap(s: EvoStat) {
  return s.max != null && (s.value.startsWith("+") || s.value.includes("★"));
}

function StatList({ stats }: { stats: EvoStat[] }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {stats.map((s, i) => (
        <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-background/50 px-3 py-1.5 text-sm">
          <span className="text-foreground/70">{s.label}</span>
          <span className="text-right font-bold text-accent">
            {s.value}
            {showsCap(s) && <span className="ml-1 text-[11px] font-normal text-foreground/40">(máx. {s.max})</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function InfoTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${highlight ? "border-gold/20 bg-gold/5" : "border-surface-light bg-surface/30"}`}>
      <span className="block text-[10px] uppercase text-foreground/40">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

export default async function EvolucionDetailPage({ params }: PageProps) {
  const e = await getEvolutionBySlugFromDb(params.slug);
  if (!e) notFound();

  const submitBy = e.endSubmissionTime
    ? new Date(e.endSubmissionTime).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/evoluciones" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a Evoluciones
        </Link>

        <div className="overflow-hidden rounded-2xl border border-surface-light bg-surface/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-light px-5 py-4">
            <div>
              <h1 className="text-xl font-black">{e.name}</h1>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">{KIND_LABEL[e.kind]}</span>
                {e.difficulty && (
                  <span className="rounded bg-surface-light px-2 py-0.5 text-foreground/60">
                    Dificultad: {DIFFICULTY[e.difficulty] ?? e.difficulty}
                  </span>
                )}
                {e.hasChoices && <span className="rounded bg-surface-light px-2 py-0.5 text-foreground/60">Con caminos a elegir</span>}
              </div>
            </div>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-sm font-bold text-gold">{evoCost(e)}</span>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:flex-row">
            {e.example?.cardImageUrl && (
              <div className="flex flex-col items-center gap-2 sm:w-44">
                <Image
                  src={e.example.cardImageUrl}
                  alt={e.example.name}
                  width={160}
                  height={220}
                  className="h-52 w-auto object-contain drop-shadow-lg"
                  unoptimized
                />
                <p className="text-center text-[11px] text-foreground/50">
                  Ejemplo: {e.example.name}
                  {e.example.overallTo > e.example.overallFrom && (
                    <span className="block font-bold text-accent">
                      {e.example.overallFrom} → {e.example.overallTo} de media
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex-1 space-y-4">
              {e.description && <p className="text-sm text-foreground/70">{e.description}</p>}
              {e.unlockedBy && (
                <p className="rounded-lg bg-accent/5 px-3 py-2 text-xs text-foreground/70">
                  Se desbloquea con: <span className="font-bold text-foreground">{e.unlockedBy}</span>
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoTile label="Vence" value={timeLeft(e.endTime)} />
                {submitBy && <InfoTile label="Completar antes del" value={submitBy} />}
                <InfoTile label="Niveles" value={String(e.levels.length)} />
                <InfoTile label="Jugadores elegibles" value={e.numberOfPlayers.toLocaleString("es-AR")} />
              </div>
            </div>
          </div>
        </div>

        {e.requirements.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Requisitos</h2>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {e.requirements.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-2 rounded-lg border border-surface-light bg-surface/30 px-3 py-2 text-sm">
                  <span className="text-foreground/60">{r.label}</span>
                  <span className="font-bold">{r.value}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {e.levels.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Niveles</h2>
            <div className="space-y-4">
              {e.levels.map((l) => (
                <div key={l.idx} className="rounded-xl border border-surface-light bg-surface/30 p-4">
                  <h3 className="mb-2 text-sm font-bold">Nivel {l.idx}</h3>
                  {l.challenges.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {l.challenges.map((c, i) => (
                        <li key={i} className="flex gap-1.5 text-xs text-foreground/70">
                          <span className="text-accent">›</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {l.options.length > 1 ? (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase text-foreground/40">Elegí un camino</p>
                      {l.options.map((opt, i) => (
                        <div key={i}>
                          <p className="mb-1.5 text-xs font-bold text-gold">Opción {String.fromCharCode(65 + i)}</p>
                          <StatList stats={opt} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StatList stats={l.upgrades} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {e.upgrades.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-1 text-lg font-bold">Mejoras totales</h2>
            {e.hasChoices && (
              <p className="mb-3 text-xs text-foreground/40">Siguiendo el camino recomendado en cada elección. Si elegís otro, cambian las mejoras de ese nivel.</p>
            )}
            <StatList stats={e.upgrades} />
          </section>
        )}

        <p className="mt-8 text-center text-[11px] text-foreground/30">Datos de fut.gg. Se actualiza todos los días.</p>
      </main>
    </div>
  );
}
