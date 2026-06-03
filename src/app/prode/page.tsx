import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdSlot } from "@/components/ads/AdSlot";
import { getMyProdes, getActiveWeek } from "@/lib/actions/prode";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "Predecí los resultados del Mundial 2026. Competí con amigos y ganá premios.",
  alternates: { canonical: "/prode" },
};

function getStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    OPEN: { label: "Abierto", color: "bg-accent/20 text-accent" },
    IN_PROGRESS: { label: "En curso", color: "bg-gold/20 text-gold" },
    FINISHED: { label: "Finalizado", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

export default async function ProdePage() {
  const [myProdes, activeWeek] = await Promise.all([
    getMyProdes(),
    getActiveWeek(),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Prode <span className="text-gold">Mundial 2026</span>
            </h1>
            <p className="mt-1 text-foreground/60">
              Creá tu prode, invitá amigos y competí por premios
            </p>
          </div>
          <Link
            href="/prode/crear"
            className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
          >
            Crear Prode
          </Link>
        </div>

        {/* Scoring info */}
        <div className="mb-6 rounded-xl border border-surface-light bg-surface/30 p-4">
          <h3 className="mb-2 text-sm font-bold text-foreground/70">Sistema de puntos</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-foreground/60 md:grid-cols-4">
            <div>
              <span className="font-bold text-gold">+5</span> Resultado exacto
            </div>
            <div>
              <span className="font-bold text-accent">+3</span> Ganador correcto
            </div>
            <div>
              <span className="font-bold text-gold">+10</span> Grupo perfecto (4/4)
            </div>
            <div>
              <span className="font-bold text-accent">+10</span> Acertar campeón
            </div>
          </div>
        </div>

        {/* Active week banner */}
        {activeWeek && (
          <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-accent">
                  {activeWeek.status === "OPEN" ? "Predicciones abiertas" : "Próxima fecha"}
                </p>
                <p className="mt-1 font-bold">{activeWeek.title}</p>
                <p className="text-sm text-foreground/60">
                  {activeWeek._count.matches} partidos ·
                  Cierre: {new Date(activeWeek.deadline).toLocaleDateString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="text-3xl">⚽</span>
            </div>
          </div>
        )}

        {/* Join by code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Unirte a un Prode</CardTitle>
          </CardHeader>
          <JoinByCodeForm />
        </Card>

        {/* My prodes */}
        <h2 className="mb-4 text-xl font-bold">Mis Prodes</h2>
        {myProdes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-lg font-medium text-foreground/50">No tenés prodes todavía</p>
            <p className="mt-2 text-sm text-foreground/40">
              Creá uno y compartí el link con tus amigos, o pedí que te pasen un código para unirte
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myProdes.map((prode) => {
              const statusInfo = getStatusInfo(prode.status);
              return (
                <Link key={prode.id} href={`/prode/${prode.id}`}>
                  <Card className="h-full overflow-hidden p-0 transition-colors hover:border-accent/50">
                    {prode.bannerUrl && (
                      <div className="h-28 w-full overflow-hidden">
                        <img src={prode.bannerUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className={prode.bannerUrl ? "p-4" : "p-5"}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {prode.visibility === "PRIVATE" && (
                            <span className="text-xs text-foreground/30">🔒</span>
                          )}
                        </div>
                        <span className="text-xs text-foreground/40">
                          {prode._count.participants} participantes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {prode.imageUrl && (
                          <img src={prode.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        )}
                        <h3 className="text-lg font-bold">{prode.name}</h3>
                      </div>
                      <p className="mt-1 text-xs text-foreground/50">
                        Creado por {prode.createdBy.username}
                      </p>
                      {prode.prizeGeneral && (
                        <p className="mt-2 text-sm text-gold">
                          🏆 {prode.prizeGeneral}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Ad */}
        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}

// Client component inline for join-by-code
function JoinByCodeForm() {
  return (
    <form action="/prode/unirse" method="GET" className="flex gap-3">
      <input
        type="text"
        name="code"
        placeholder="Código del prode (ej: AbC12xYz)"
        className="flex-1 rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
        maxLength={8}
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
      >
        Unirme
      </button>
    </form>
  );
}
