import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getCasualMatch, getMatchMessages } from "@/lib/actions/casual";
import { CasualMatchActions } from "@/components/casual/CasualMatchActions";
import { CasualMatchChat } from "@/components/casual/CasualMatchChat";
import { getCurrentUser } from "@/lib/actions/user";

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente de aceptación", color: "bg-gold/20 text-gold" },
    ACCEPTED: { label: "Aceptado", color: "bg-blue-500/20 text-blue-400" },
    IN_PROGRESS: { label: "En curso — esperando resultado", color: "bg-accent/20 text-accent" },
    PENDING_CONFIRMATION: { label: "Resultado cargado — esperando confirmación", color: "bg-orange-500/20 text-orange-400" },
    DISPUTED: { label: "Resultado disputado", color: "bg-red-500/20 text-red-400" },
    FINISHED: { label: "Finalizado", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

interface PageProps {
  params: { id: string };
}

export default async function CasualMatchPage({ params }: PageProps) {
  const [match, messages, currentUser] = await Promise.all([
    getCasualMatch(params.id),
    getMatchMessages(params.id),
    getCurrentUser(),
  ]);

  if (!match) {
    notFound();
  }

  const statusInfo = getStatusLabel(match.status);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          {/* Status */}
          <div className="mb-6 text-center">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Players */}
          <div className="mb-8 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-surface">
                {match.challenger.avatarUrl ? (
                  <Image src={match.challenger.avatarUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-foreground/30">👤</div>
                )}
              </div>
              <p className={`font-bold ${match.winner?.id === match.challenger.id ? "text-accent" : ""}`}>
                {match.challenger.username}
              </p>
              <p className="text-xs text-foreground/50">{match.challenger.rankingPoints} pts</p>
            </div>

            <div className="text-center">
              {match.resultChallenger !== null ? (
                <p className="text-4xl font-bold">
                  <span className={match.winner?.id === match.challenger.id ? "text-accent" : ""}>
                    {match.resultChallenger}
                  </span>
                  <span className="mx-2 text-foreground/30">-</span>
                  <span className={match.winner?.id === match.challenged.id ? "text-accent" : ""}>
                    {match.resultChallenged}
                  </span>
                </p>
              ) : (
                <p className="text-2xl font-bold text-foreground/30">vs</p>
              )}
            </div>

            <div className="text-center">
              <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-surface">
                {match.challenged.avatarUrl ? (
                  <Image src={match.challenged.avatarUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-foreground/30">👤</div>
                )}
              </div>
              <p className={`font-bold ${match.winner?.id === match.challenged.id ? "text-accent" : ""}`}>
                {match.challenged.username}
              </p>
              <p className="text-xs text-foreground/50">{match.challenged.rankingPoints} pts</p>
            </div>
          </div>

          {/* Proof image */}
          {match.proofImageUrl && (
            <div className="mb-6 border-t border-surface-light pt-6">
              <p className="mb-2 text-xs font-medium text-foreground/50">📷 Foto de prueba:</p>
              <img
                src={match.proofImageUrl}
                alt="Prueba del resultado"
                className="max-h-64 w-full rounded-lg object-contain border border-surface-light bg-background"
              />
            </div>
          )}

          {/* Actions */}
          {match.status !== "FINISHED" && match.status !== "CANCELLED" && match.status !== "REJECTED" && (
            <div className="border-t border-surface-light pt-6">
              <CasualMatchActions
                matchId={match.id}
                status={match.status}
                challengerId={match.challengerId}
                challengedId={match.challengedId}
                resultChallenger={match.resultChallenger}
                resultChallenged={match.resultChallenged}
              />
            </div>
          )}

          {/* Winner */}
          {match.status === "FINISHED" && match.winner && (
            <div className="border-t border-surface-light pt-6 text-center">
              <p className="text-sm text-foreground/50">Ganador</p>
              <p className="text-xl font-bold text-accent">{match.winner.username}</p>
            </div>
          )}

          {match.status === "FINISHED" && !match.winner && (
            <div className="border-t border-surface-light pt-6 text-center">
              <p className="text-lg font-bold text-foreground/50">Empate</p>
            </div>
          )}

          {/* Date */}
          <div className="mt-6 text-center text-xs text-foreground/40">
            Creado: {new Date(match.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            {match.confirmedAt && (
              <> · Finalizado: {new Date(match.confirmedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</>
            )}
          </div>

          {/* Chat */}
          {currentUser && (
            <div className="mt-6 border-t border-surface-light pt-6">
              <CasualMatchChat
                matchId={match.id}
                messages={messages}
                currentUserId={currentUser.id}
              />
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
