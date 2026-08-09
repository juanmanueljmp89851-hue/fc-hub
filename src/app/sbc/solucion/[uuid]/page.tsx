import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { SolutionPitch } from "@/components/sbc/SolutionPitch";
import { getSbcSolution, type SbcSolution } from "@/lib/futgg";
import { fmtCoins } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Solución de SBC | Modo Fosa",
  description: "Solución más barata para completar el SBC, con los jugadores y el costo total.",
  robots: { index: false },
};

export default async function SolucionPage({ params }: { params: { uuid: string } }) {
  const uuids = decodeURIComponent(params.uuid).split(",").map((u) => u.trim()).filter(Boolean);
  const sols = (await Promise.all(uuids.map((u) => getSbcSolution(u)))).filter(
    (s): s is SbcSolution => !!s && s.players.length > 0,
  );
  if (sols.length === 0) notFound();

  const multi = sols.length > 1;
  const grandTotal = sols.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const anyPrice = sols.some((s) => s.total != null);

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
              {multi ? `${sols.length} desafíos` : `${sols[0].players.length} jugadores`}
            </p>
          </div>
          {anyPrice && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2 text-right">
              <span className="block text-[10px] uppercase text-foreground/40">
                {multi ? "Costo total (todos)" : "Costo total"}
              </span>
              <span className="text-xl font-black text-gold">{fmtCoins(grandTotal)}</span>
            </div>
          )}
        </header>

        {multi ? (
          <div className="space-y-8">
            {sols.map((sol, i) => (
              <section key={sol.uuid}>
                <div className="mb-3 flex items-center justify-between border-b border-surface-light pb-2">
                  <h2 className="text-sm font-bold">
                    Desafío {i + 1}
                    <span className="ml-2 font-normal text-foreground/40">
                      {sol.formation ? `Formación ${sol.formation}` : ""}
                    </span>
                  </h2>
                  {sol.total != null && (
                    <span className="text-sm font-bold text-gold">{fmtCoins(sol.total)}</span>
                  )}
                </div>
                <SolutionPitch players={sol.players} />
              </section>
            ))}
          </div>
        ) : (
          <SolutionPitch players={sols[0].players} />
        )}

        <p className="mt-6 text-center text-[11px] text-foreground/30">
          Solución calculada por fut.gg. Precios aproximados, pueden variar.
        </p>
      </main>
    </div>
  );
}
