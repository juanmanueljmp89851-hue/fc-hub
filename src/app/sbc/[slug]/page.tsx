import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getSbcBySlug, type SbcSet, type SbcChallenge } from "@/lib/futgg";
import { fmtCoins, timeLeft } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const sbc = await getSbcBySlug(params.slug);
  if (!sbc) return { title: "SBC no encontrado | Modo Fosa" };
  return {
    title: `${sbc.name} — SBC EA FC 26 | Modo Fosa`,
    description: sbc.description || `Requisitos, premios y solución más barata del SBC ${sbc.name}.`,
    alternates: { canonical: `/sbc/${params.slug}` },
  };
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/50 px-3 py-2 text-center">
      <span className="block text-[10px] uppercase tracking-wide text-foreground/40">{label}</span>
      <span className="text-sm font-bold text-foreground/90">{value}</span>
    </div>
  );
}

function ChallengeCard({ ch, index }: { ch: SbcChallenge; index: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30">
      <div className="flex items-center justify-between border-b border-surface-light px-4 py-3">
        <h3 className="text-sm font-bold">{ch.name || `Desafío ${index + 1}`}</h3>
        {ch.cheapestCoins != null && (
          <span className="text-sm font-bold text-gold">{fmtCoins(ch.cheapestCoins)}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {ch.description && <p className="text-xs text-foreground/70">{ch.description}</p>}

        {ch.requirements.length > 0 && (
          <div>
            <h4 className="mb-1 text-[10px] font-bold uppercase text-foreground/40">Requisitos</h4>
            <ul className="space-y-0.5">
              {ch.requirements.map((r, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] text-foreground/70">
                  <span className="text-accent">›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ch.awards.length > 0 && (
          <div>
            <h4 className="mb-1 text-[10px] font-bold uppercase text-foreground/40">Recompensa</h4>
            <ul className="space-y-0.5">
              {ch.awards.map((a, i) => (
                <li key={i} className="text-[11px] font-medium text-foreground/80">🎁 {a}</li>
              ))}
            </ul>
          </div>
        )}

        {ch.solutionUuid && (
          <Link
            href={`/sbc/solucion/${ch.solutionUuid}`}
            className="mt-auto rounded-lg bg-accent/10 py-1.5 text-center text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            Ver solución →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function SbcDetailPage({ params }: { params: { slug: string } }) {
  const sbc: SbcSet | null = await getSbcBySlug(params.slug);
  if (!sbc) notFound();

  const total = sbc.cheapestTotal ?? sbc.cost;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/sbc" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a SBC
        </Link>

        {/* Header consolidado */}
        <div className="overflow-hidden rounded-2xl border border-surface-light bg-surface/30">
          <div className="flex items-center justify-between border-b border-surface-light px-5 py-4">
            <h1 className="text-xl font-black">{sbc.name}</h1>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-sm font-bold text-gold">
              {fmtCoins(total)}
            </span>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row">
            {(sbc.imageUrl ?? sbc.iconUrl) && (
              <Image
                src={(sbc.imageUrl ?? sbc.iconUrl)!}
                alt={sbc.name}
                width={176}
                height={176}
                className="mx-auto h-44 w-auto object-contain drop-shadow-lg sm:mx-0"
                unoptimized
              />
            )}
            <div className="flex-1">
              {sbc.description && <p className="mb-4 text-sm text-foreground/70">{sbc.description}</p>}
              <div className="grid grid-cols-2 gap-2">
                <InfoTile label="Desafíos" value={String(sbc.challengesCount)} />
                <InfoTile label="Expira" value={timeLeft(sbc.endTime)} />
                <InfoTile label="Repetible" value={sbc.isRepeatable ? (sbc.numberOfRepeats ? `${sbc.numberOfRepeats}x` : "Sí") : "No"} />
                <InfoTile label="Refresca" value={sbc.repeatRefreshText ?? "—"} />
              </div>
            </div>
          </div>
        </div>

        {/* Desafíos */}
        <h2 className="mb-3 mt-8 text-lg font-bold">Desafíos</h2>
        {sbc.challenges.length === 0 ? (
          <p className="text-sm text-foreground/50">Sin desafíos disponibles.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sbc.challenges.map((ch, i) => (
              <ChallengeCard key={i} ch={ch} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
