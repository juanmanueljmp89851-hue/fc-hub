import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { getChallengeDetail } from "@/lib/actions/casual";
import { getCurrentUser } from "@/lib/actions/user";
import { DuelActions } from "./DuelActions";

interface PageProps {
  params: { id: string };
}

function GamertagBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-light/50 px-3 py-2">
      <span className="text-xs font-bold text-foreground/40">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default async function DueloPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const match = await getChallengeDetail(params.id);
  if (!match) notFound();

  const isChallenged = match.challengedId === currentUser.id;
  const isChallenger = match.challengerId === currentUser.id;
  const isPending = match.status === "PENDING";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-4xl">⚔️</span>
          <h1 className="mt-2 text-2xl font-black">
            {isPending && isChallenged
              ? "Te desafiaron a un duelo"
              : isPending && isChallenger
                ? "Esperando respuesta..."
                : match.status === "REJECTED"
                  ? "Desafío rechazado"
                  : match.status === "IN_PROGRESS"
                    ? "Duelo en curso"
                    : match.status === "FINISHED"
                      ? "Duelo finalizado"
                      : "Duelo"}
          </h1>
        </div>

        {/* Challenger card */}
        <div className="mb-6 rounded-2xl border border-surface-light bg-surface p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/40">
            {isChallenged ? "Te desafía" : "Retador"}
          </p>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent bg-surface-light">
              {match.challenger.avatarUrl ? (
                <Image
                  src={match.challenger.avatarUrl}
                  alt={match.challenger.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-foreground/30">
                  👤
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{match.challenger.username}</h2>
              <p className="text-sm font-bold text-accent">{match.challenger.rankingPoints?.toLocaleString() ?? 0} pts</p>
            </div>
          </div>

          {/* Gamertags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <GamertagBadge label="🎮 PSN" value={match.challenger.psnUsername} />
            <GamertagBadge label="🟢 Xbox" value={match.challenger.xboxUsername} />
            <GamertagBadge label="💻 PC" value={match.challenger.pcUsername} />
          </div>
          {!match.challenger.psnUsername && !match.challenger.xboxUsername && !match.challenger.pcUsername && (
            <p className="mt-3 text-xs text-foreground/30">No tiene gamertags configurados</p>
          )}
        </div>

        {/* VS divider */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-surface-light" />
          <span className="text-lg font-black text-foreground/30">VS</span>
          <div className="h-px flex-1 bg-surface-light" />
        </div>

        {/* Challenged card */}
        <div className="mb-8 rounded-2xl border border-surface-light bg-surface p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/40">
            {isChallenged ? "Vos" : "Desafiado"}
          </p>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent bg-surface-light">
              {match.challenged.avatarUrl ? (
                <Image
                  src={match.challenged.avatarUrl}
                  alt={match.challenged.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-foreground/30">
                  👤
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{match.challenged.username}</h2>
              <p className="text-sm font-bold text-accent">{match.challenged.rankingPoints?.toLocaleString() ?? 0} pts</p>
            </div>
          </div>

          {/* Gamertags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <GamertagBadge label="🎮 PSN" value={match.challenged.psnUsername} />
            <GamertagBadge label="🟢 Xbox" value={match.challenged.xboxUsername} />
            <GamertagBadge label="💻 PC" value={match.challenged.pcUsername} />
          </div>
          {!match.challenged.psnUsername && !match.challenged.xboxUsername && !match.challenged.pcUsername && (
            <p className="mt-3 text-xs text-foreground/30">No tiene gamertags configurados</p>
          )}
        </div>

        {/* Action buttons */}
        {isPending && isChallenged && (
          <DuelActions matchId={match.id} />
        )}

        {isPending && isChallenger && (
          <div className="text-center">
            <p className="text-sm text-foreground/50">
              Esperando que {match.challenged.username} acepte o rechace...
            </p>
          </div>
        )}

        {match.status === "IN_PROGRESS" && (
          <div className="text-center">
            <a
              href={`/casual/${match.id}`}
              className="inline-block rounded-xl bg-accent px-8 py-3 font-bold text-background transition-opacity hover:opacity-90"
            >
              Ir al partido →
            </a>
          </div>
        )}

        {match.status === "REJECTED" && (
          <div className="text-center">
            <p className="text-sm text-red-400">Este desafío fue rechazado.</p>
          </div>
        )}

        {match.status === "FINISHED" && (
          <div className="text-center">
            <a
              href={`/casual/${match.id}`}
              className="inline-block rounded-xl border border-surface-light px-8 py-3 font-medium text-foreground/60 transition-colors hover:border-accent hover:text-accent"
            >
              Ver resultado →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
