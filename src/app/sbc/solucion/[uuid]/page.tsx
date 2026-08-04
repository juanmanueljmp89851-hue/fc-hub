import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { FutCard } from "@/components/jugadores/FutCard";
import { getSbcSolution } from "@/lib/futgg";
import type { FutPlayer } from "@/types/player";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Solución de SBC | Modo Fosa",
  description: "Solución más barata para completar el SBC, con los 11 jugadores y el costo total.",
  robots: { index: false },
};

function fmtCoins(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default async function SolucionPage({ params }: { params: { uuid: string } }) {
  const sol = await getSbcSolution(params.uuid);
  if (!sol || sol.players.length === 0) notFound();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/sbc" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a SBC
        </Link>

        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">🧩 Solución más barata</h1>
            <p className="mt-1 text-sm text-foreground/50">
              {sol.players.length} jugadores{sol.formation ? ` · Formación ${sol.formation}` : ""}
            </p>
          </div>
          {sol.total != null && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2 text-right">
              <span className="block text-[10px] uppercase text-foreground/40">Costo total</span>
              <span className="text-xl font-black text-gold">{fmtCoins(sol.total)}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sol.players.map((p) => {
            const fp: FutPlayer = {
              id: String(p.eaId),
              eaId: p.eaId,
              name: p.name,
              commonName: p.commonName,
              position: p.position,
              alternatePositions: [],
              overall: p.overall,
              pace: p.pace,
              shooting: p.shooting,
              passing: p.passing,
              dribbling: p.dribbling,
              defending: p.defending,
              physical: p.physical,
              club: p.club,
              league: p.league,
              nation: p.nation,
              cardType: "special",
              cardFullUrl: p.cardFullUrl,
              imageUrl: p.imageUrl,
              skillMoves: p.skillMoves,
              weakFoot: p.weakFoot,
            };
            return (
              <div key={p.eaId} className="flex flex-col items-center gap-1.5">
                <FutCard player={fp} size="sm" />
                <span className="text-xs font-medium text-gold">
                  {p.price != null ? fmtCoins(p.price) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[11px] text-foreground/30">
          Solución calculada por fut.gg. Precios aproximados, pueden variar.
        </p>
      </main>
    </div>
  );
}
