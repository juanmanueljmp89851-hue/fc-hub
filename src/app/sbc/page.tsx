import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveSbcs } from "@/lib/futgg";
import { SbcGrid } from "@/components/sbc/SbcGrid";

export const revalidate = 300; // ISR: regenera cada 5 min

export const metadata: Metadata = {
  title: "Resolver SBC — EA FC 26 | Modo Fosa",
  description:
    "Todos los SBC (Squad Building Challenges) activos de EA FC 26: costo, premio y vencimiento. Actualizado automáticamente.",
  alternates: { canonical: "/sbc" },
};

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

            <SbcGrid sbcs={sbcs} />
          </>
        )}
      </main>
    </div>
  );
}
