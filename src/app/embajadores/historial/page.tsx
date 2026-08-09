import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { getPeriodHistory } from "@/lib/actions/ambassador";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Salón de Embajadores | Modo Fosa",
  description: "Los jugadores que ayudaron a encender la Fosa.",
  alternates: { canonical: "/embajadores/historial" },
};

export default async function HistorialPage() {
  const history = await getPeriodHistory();

  const byYear = new Map<number, typeof history>();
  for (const p of history) {
    const arr = byYear.get(p.year) ?? [];
    arr.push(p);
    byYear.set(p.year, arr);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/embajadores"
          className="mb-4 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-accent"
        >
          ← Embajadores
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black">🔥 SALÓN DE EMBAJADORES</h1>
          <p className="mt-2 text-foreground/50">Los jugadores que ayudaron a encender la Fosa.</p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-surface-light bg-background p-12 text-center">
            <span className="mb-4 block text-4xl">🏆</span>
            <p className="text-foreground/50">Todavía no hay embajadores del mes</p>
          </div>
        ) : (
          [...byYear.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([year, periods]) => (
              <div key={year} className="mb-8">
                <h2 className="mb-4 text-xl font-black text-foreground/40">{year}</h2>
                <div className="space-y-4">
                  {periods.map((period) => (
                    <Link
                      key={period.id}
                      href={`/embajadores/periodo/${period.id}`}
                      className="group block rounded-xl border border-surface-light bg-background p-4 transition-colors hover:border-accent/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold group-hover:text-accent">{period.name}</h3>
                          {period.prizes.length > 0 && (
                            <p className="text-sm text-foreground/50">
                              Premio: {period.prizes[0].name}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-foreground/30">
                          {new Date(period.endDate).toLocaleDateString("es-AR")}
                        </span>
                      </div>

                      {period.winners.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {period.winners.map((w) => (
                            <div key={`${period.id}-${w.position}`} className="flex items-center gap-3">
                              <span className="text-lg">
                                {w.position === 1 ? "🥇" : w.position === 2 ? "🥈" : "🥉"}
                              </span>
                              {w.user.avatarUrl ? (
                                <Image
                                  src={w.user.avatarUrl}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                                  {w.user.username?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold">{w.user.username}</span>
                              <span className="text-sm text-accent">{w.activeReferrals} referidos</span>
                              <span className="text-sm text-gold">{w.bengalasEarned} bengalas</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))
        )}
      </main>
    </div>
  );
}
