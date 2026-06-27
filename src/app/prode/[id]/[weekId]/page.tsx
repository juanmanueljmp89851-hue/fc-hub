import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getProde, getProdeWeek, getUserPredictions, getAllPredictionsForWeek } from "@/lib/actions/prode";
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
  const [prode, week, userPreds, allPreds] = await Promise.all([
    getProde(params.id),
    getProdeWeek(params.weekId),
    getUserPredictions(params.id, params.weekId),
    getAllPredictionsForWeek(params.id, params.weekId),
  ]);

  if (!prode || !week) {
    notFound();
  }

  // Merge user predictions with matches
  const predMap = new Map(userPreds.map((p) => [p.matchId, p]));

  // Group all participants' predictions by matchId
  const allPredsMap = new Map<string, { username: string; avatarUrl: string | null; predHomeScore: number; predAwayScore: number }[]>();
  for (const p of allPreds) {
    if (!allPredsMap.has(p.matchId)) allPredsMap.set(p.matchId, []);
    allPredsMap.get(p.matchId)!.push({
      username: p.user.username,
      avatarUrl: p.user.avatarUrl,
      predHomeScore: p.predHomeScore,
      predAwayScore: p.predAwayScore,
    });
  }

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
      extraTime: m.extraTime,
      penalties: m.penalties,
      winnerTeam: m.winnerTeam,
      predictions: pred
        ? [{
            predHomeScore: pred.predHomeScore,
            predAwayScore: pred.predAwayScore,
            predExtraTime: pred.predExtraTime,
            predPenalties: pred.predPenalties,
            predWinner: pred.predWinner,
          }]
        : undefined,
      allPredictions: allPredsMap.get(m.id) ?? [],
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
            if (week.status === "SCORED") {
              return <p className="mt-1 text-sm text-foreground/60">Fecha puntuada</p>;
            }
            if (week.status === "CLOSED") {
              return <p className="mt-1 text-sm text-foreground/60">Esperando resultados</p>;
            }
            if (week.status === "OPEN" || week.status === "UPCOMING") {
              return (
                <p className="mt-1 text-sm text-accent">
                  Podés predecir hasta que cada partido empiece
                </p>
              );
            }
            return null;
          })()}
        </div>

        <PredictionForm
          prodeId={prode.id}
          weekId={week.id}
          weekStatus={week.status}

          matches={serializedMatches}
        />
      </main>
    </div>
  );
}
