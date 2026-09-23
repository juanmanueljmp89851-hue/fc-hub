import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { getTournamentsFromDb } from "@/lib/tournaments-db";
import type { Tournament, TournamentStatus } from "@/lib/tournaments-db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Competitivo — EA FC 27 | Modo Fosa",
  description:
    "Escena competitiva de EA FC 27: FC Pro, Red Bull Wings Cup, UEFA eEURO, CONMEBOL eLibertadores, VPN Argentina, IESA y más.",
  alternates: { canonical: "/escena" },
};

const STATUS_STYLES: Record<TournamentStatus, string> = {
  live: "bg-green-500/20 text-green-400 animate-pulse",
  upcoming: "bg-accent/10 text-accent",
  completed: "bg-surface-light text-foreground/50",
  tba: "bg-surface-light text-foreground/40",
};

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
      {/* Header: logo + name + status */}
      <div className="mb-3 flex items-start gap-3">
        {t.logoUrl ? (
          <Image
            src={t.logoUrl}
            alt={t.name}
            width={48}
            height={48}
            className="h-12 w-12 flex-shrink-0 rounded-lg object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xl">
            🏆
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-tight">{t.name}</h3>
            <StatusBadge status={t.status} label={t.statusLabel} />
          </div>
          <p className="text-[11px] text-foreground/40">{t.org}</p>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-foreground/60">{t.description}</p>

      <div className="mt-auto space-y-2">
        {/* Tags: modo, region */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">{t.mode}</span>
          <span className="rounded bg-surface-light px-2 py-0.5 text-foreground/50">{t.region}</span>
        </div>

        {/* Info: fecha, premio */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/40">
          <span>📅 {t.dates}</span>
          {t.prizePool && <span className="font-bold text-gold">💰 {t.prizePool}</span>}
        </div>

        {/* CTA: siempre ver detalle interno */}
        <div className="rounded-lg bg-accent/10 py-1.5 text-center text-xs font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-background">
          Ver cobertura →
        </div>

        {t.updatedAt && (
          <p className="pt-1 text-[10px] text-foreground/30">
            Actualizado: {new Date(t.updatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );

  return <Link href={`/escena/${t.slug}`}>{inner}</Link>;
}

export default async function EscenaPage() {
  const all = await getTournamentsFromDb();

  const sorted = [...all].sort((a, b) => {
    const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return db - da;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-black">Competitivo</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Torneos y ligas de EA FC 27 — cubiertos por Modo Fosa.
          </p>
        </header>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-surface-light bg-surface/30 p-12 text-center">
            <span className="mb-4 block text-5xl">🏆</span>
            <h2 className="text-xl font-bold text-foreground/80">Próximamente</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50">
              Estamos recopilando información sobre torneos activos de EA FC 27.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t) => (
              <TournamentCard key={t.slug} t={t} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-foreground/30">
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
