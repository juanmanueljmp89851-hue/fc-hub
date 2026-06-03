import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getProde, getProdeWeek, getUserPredictions } from "@/lib/actions/prode";
import { PredictionForm } from "@/components/prode/PredictionForm";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { id: string; weekId: string } }): Promise<Metadata> {
  const [prode, week] = await Promise.all([getProde(params.id), getProdeWeek(params.weekId)]);
  if (!prode || !week) return { title: "Fecha no encontrada" };
  return {
    title: `${week.title} — ${prode.name}`,
    description: `Predicciones para ${week.title} en ${prode.name}. Prode del Mundial 2026 en Modo Fosa.`,
  };
}

interface PageProps {
  params: { id: string; weekId: string };
}

export default async function ProdeWeekPage({ params }: PageProps) {
  const [prode, week, userPreds] = await Promise.all([
    getProde(params.id),
    getProdeWeek(params.weekId),
    getUserPredictions(params.id, params.weekId),
  ]);

  if (!prode || !week) {
    notFound();
  }

  // Merge user predictions with matches
  const predMap = new Map(userPreds.map((p) => [p.matchId, p]));

  const serializedMatches = week.matches.map((m) => {
    const pred = predMap.get(m.id);
    return {
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate.toISOString(),
      venue: m.venue,
      stage: m.stage,
      group: m.group,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      predictions: pred
        ? [{ predHomeScore: pred.predHomeScore, predAwayScore: pred.predAwayScore }]
        : undefined,
    };
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href={`/prode/${prode.id}`}
          className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent"
        >
          ← {prode.name}
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{week.title}</h1>
          {(() => {
            const isGroupStage = week.title.toLowerCase().includes("fase de grupos");
            if (isGroupStage && week.status !== "SCORED") {
              return (
                <p className="mt-1 text-sm text-accent">
                  Podés predecir hasta que cada partido empiece
                </p>
              );
            }
            return (
              <p className="mt-1 text-sm text-foreground/60">
                {week.status === "OPEN"
                  ? `Cierre: ${new Date(week.deadline).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`
                  : week.status === "SCORED"
                    ? "Fecha puntuada"
                    : week.status === "CLOSED"
                      ? "Esperando resultados"
                      : "Próximamente"}
              </p>
            );
          })()}
        </div>

        <PredictionForm
          prodeId={prode.id}
          weekId={week.id}
          weekStatus={week.status}
          weekTitle={week.title}
          matches={serializedMatches}
        />
      </main>
    </div>
  );
}
