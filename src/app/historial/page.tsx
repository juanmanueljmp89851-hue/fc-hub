import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/actions/user";
import { getUserStats } from "@/lib/actions/stats";

export const metadata: Metadata = {
  title: "Historial de duelos",
};

export default async function HistorialPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getUserStats(user.id);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Historial de duelos</h1>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Partidos" value={stats.totalPlayed} />
          <StatCard label="Victorias" value={stats.totalWins} accent />
          <StatCard label="Derrotas" value={stats.totalLosses} />
          <StatCard label="Empates" value={stats.totalDraws} />
          <StatCard label="Win Rate" value={`${stats.winRate}%`} accent />
          <StatCard label="Goles a favor" value={stats.totalGoalsFor} />
          <StatCard label="Goles en contra" value={stats.totalGoalsAgainst} />
          <StatCard label="Dif. goles" value={stats.goalDiff > 0 ? `+${stats.goalDiff}` : `${stats.goalDiff}`} />
          <StatCard label="Prom. goles/partido" value={stats.avgGoalsFor} />
          <StatCard label="Racha actual" value={`${stats.currentStreak}${stats.currentStreakType ?? ""}`} />
          <StatCard label="Mejor racha W" value={stats.bestWinStreak} accent />
          <StatCard label="Torneos ganados" value={`${stats.tournamentsWon}/${stats.tournamentsPlayed}`} />
        </div>

        {/* Recent matches */}
        <h2 className="mb-4 text-lg font-bold">Últimos partidos</h2>
        {stats.recentMatches.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/40">Sin partidos registrados</p>
        ) : (
          <div className="space-y-2">
            {stats.recentMatches.map((match, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  match.result === "W"
                    ? "border-accent/30 bg-accent/5"
                    : match.result === "L"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-surface-light bg-surface"
                }`}
              >
                <span className={`text-lg font-black ${
                  match.result === "W" ? "text-accent" : match.result === "L" ? "text-red-400" : "text-foreground/40"
                }`}>
                  {match.result}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-bold">
                    {match.goalsFor} - {match.goalsAgainst}
                  </span>
                  {match.context && (
                    <span className="ml-2 text-xs text-foreground/40">{match.context}</span>
                  )}
                </div>
                <span className="text-xs text-foreground/30">
                  {match.type === "tournament" ? "🏆" : "⚔️"}{" "}
                  {new Date(match.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-surface-light bg-surface p-3 text-center">
      <p className={`text-xl font-black ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] font-medium text-foreground/40">{label}</p>
    </div>
  );
}
