import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getTournamentMatchDetail } from "@/lib/actions/tournament";
import { ArenaMatchActions } from "@/components/arena/ArenaMatchActions";
import { ArenaChat } from "@/components/arena/ArenaChat";

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Programado", color: "bg-surface-light text-foreground/50" },
    READY_P1: { label: "Jugador 1 listo", color: "bg-gold/20 text-gold" },
    READY_P2: { label: "Jugador 2 listo", color: "bg-gold/20 text-gold" },
    IN_PROGRESS: { label: "En curso", color: "bg-accent/20 text-accent" },
    PENDING_CONFIRMATION: { label: "Resultado cargado — esperando confirmación", color: "bg-orange-500/20 text-orange-400" },
    DISPUTED: { label: "Resultado disputado", color: "bg-red-500/20 text-red-400" },
    FINISHED: { label: "Finalizado", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

interface PageProps {
  params: { matchId: string };
}

export default async function ArenaMatchPage({ params }: PageProps) {
  const match = await getTournamentMatchDetail(params.matchId);

  if (!match) {
    notFound();
  }

  const statusInfo = getStatusLabel(match.status);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Tournament badge */}
        <div className="mb-4 text-center">
          <Link
            href={`/torneos/${match.tournament.id}`}
            className="inline-block rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground/60 transition-colors hover:text-accent"
          >
            🏆 {match.tournament.name}
          </Link>
          {match.round && (
            <span className="ml-2 text-xs text-foreground/40">{match.round}</span>
          )}
        </div>

        <Card>
          {/* Status */}
          <div className="mb-6 text-center">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Playoff rule */}
          {match.tournament.playoffRule && (
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1 rounded-full border border-surface-light bg-surface px-3 py-1 text-xs text-foreground/60">
                ⚽ Regla de desempate:{" "}
                <span className="font-medium text-foreground/80">
                  {match.tournament.playoffRule === "PENALTIES" && "Penales directo"}
                  {match.tournament.playoffRule === "GOLDEN_GOAL" && "Gol de oro"}
                  {match.tournament.playoffRule === "EXTRA_TIME" && "Tiempo extra 120'"}
                </span>
              </span>
            </div>
          )}

          {/* Players */}
          <div className="mb-8 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-surface">
                {match.player1?.avatarUrl ? (
                  <Image src={match.player1.avatarUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-foreground/30">👤</div>
                )}
              </div>
              <p className={`font-bold ${match.winner?.id === match.player1?.id ? "text-accent" : ""}`}>
                {match.player1?.username ?? "BYE"}
              </p>
              {match.player1 && (
                <p className="text-xs text-foreground/50">{match.player1.rankingPoints} pts</p>
              )}
              {/* Gamertags */}
              {match.player1 && (
                <div className="mt-1 space-y-0.5 text-[10px] text-foreground/40">
                  {match.player1.psnUsername && <p>PSN: {match.player1.psnUsername}</p>}
                  {match.player1.xboxUsername && <p>Xbox: {match.player1.xboxUsername}</p>}
                  {match.player1.pcUsername && <p>PC: {match.player1.pcUsername}</p>}
                </div>
              )}
            </div>

            <div className="text-center">
              {match.resultP1 !== null ? (
                <p className="text-4xl font-bold">
                  <span className={match.winner?.id === match.player1?.id ? "text-accent" : ""}>
                    {match.resultP1}
                  </span>
                  <span className="mx-2 text-foreground/30">-</span>
                  <span className={match.winner?.id === match.player2?.id ? "text-accent" : ""}>
                    {match.resultP2}
                  </span>
                </p>
              ) : (
                <p className="text-2xl font-bold text-foreground/30">vs</p>
              )}
            </div>

            <div className="text-center">
              <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-surface">
                {match.player2?.avatarUrl ? (
                  <Image src={match.player2.avatarUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-foreground/30">👤</div>
                )}
              </div>
              <p className={`font-bold ${match.winner?.id === match.player2?.id ? "text-accent" : ""}`}>
                {match.player2?.username ?? "BYE"}
              </p>
              {match.player2 && (
                <p className="text-xs text-foreground/50">{match.player2.rankingPoints} pts</p>
              )}
              {/* Gamertags */}
              {match.player2 && (
                <div className="mt-1 space-y-0.5 text-[10px] text-foreground/40">
                  {match.player2.psnUsername && <p>PSN: {match.player2.psnUsername}</p>}
                  {match.player2.xboxUsername && <p>Xbox: {match.player2.xboxUsername}</p>}
                  {match.player2.pcUsername && <p>PC: {match.player2.pcUsername}</p>}
                </div>
              )}
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
          {match.status !== "FINISHED" && match.status !== "WALKOVER" && match.status !== "CANCELLED" && match.isPlayer && (
            <div className="border-t border-surface-light pt-6">
              <ArenaMatchActions
                matchId={match.id}
                status={match.status}
                player1Id={match.player1Id!}
                player2Id={match.player2Id!}
                resultP1={match.resultP1}
                resultP2={match.resultP2}
                currentUserId={match.currentUserId}
                disputeCountP1={match.disputeCountP1}
                disputeCountP2={match.disputeCountP2}
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

          {/* Chat */}
          <div className="mt-6 border-t border-surface-light pt-6">
            <ArenaChat
              matchId={match.id}
              messages={match.messages}
              currentUserId={match.currentUserId}
              isPlayer={match.isPlayer}
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
