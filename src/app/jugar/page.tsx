import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getTopRanking, getActiveMatches } from "@/lib/actions/lobby";
import { LobbyChat } from "@/components/jugar/LobbyChat";
import Link from "next/link";

function getMedalEmoji(pos: number) {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return `${pos}.`;
}

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "text-gold" },
    ACCEPTED: { label: "Aceptado", color: "text-blue-400" },
    IN_PROGRESS: { label: "En curso", color: "text-accent" },
    PENDING_CONFIRMATION: { label: "Confirmar", color: "text-orange-400" },
  };
  return map[status] ?? { label: status, color: "text-foreground/50" };
}

export default async function JugarPage() {
  const [ranking, activeMatches] = await Promise.all([
    getTopRanking(5),
    getActiveMatches(),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Jugar</h1>
          <p className="mt-1 text-foreground/60">
            Chateá, desafiá rivales y subí en el ranking
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Ranking + Active matches */}
          <div className="space-y-6 lg:col-span-1">
            {/* Compact Ranking */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">🏆 Ranking</h3>
                <Link
                  href="/ranking"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Ver completo →
                </Link>
              </div>
              {ranking.length === 0 ? (
                <p className="text-sm text-foreground/40">
                  Sin jugadores todavía
                </p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((user, i) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-light/50 transition-colors"
                    >
                      <span className="w-6 text-center text-sm">
                        {getMedalEmoji(i + 1)}
                      </span>
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface-light">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">
                            👤
                          </div>
                        )}
                      </div>
                      <span className="flex-1 truncate text-sm font-medium">
                        {user.username}
                      </span>
                      <span className="text-xs font-bold text-accent">
                        {user.rankingPoints}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active matches */}
            <Card>
              <h3 className="mb-3 font-bold">⚔️ Mis partidos</h3>
              {activeMatches.length === 0 ? (
                <p className="text-sm text-foreground/40">
                  Sin partidos activos. ¡Desafiá a alguien desde el chat!
                </p>
              ) : (
                <div className="space-y-2">
                  {activeMatches.map((match) => {
                    const st = getStatusLabel(match.status);
                    return (
                      <Link
                        key={match.id}
                        href={`/casual/${match.id}`}
                        className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background px-3 py-2 text-sm transition-colors hover:border-accent/50"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate max-w-[60px]">
                            {match.challenger.username}
                          </span>
                          <span className="text-foreground/30 text-xs">vs</span>
                          <span className="font-medium truncate max-w-[60px]">
                            {match.challenged.username}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold ${st.color}`}>
                          {st.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
              <Link
                href="/casual"
                className="mt-3 block text-center text-xs text-foreground/50 hover:text-accent transition-colors"
              >
                Ver historial completo →
              </Link>
            </Card>
          </div>

          {/* Right column: Chat Lobby */}
          <div className="lg:col-span-2">
            <LobbyChat />
          </div>
        </div>
      </main>
    </div>
  );
}
