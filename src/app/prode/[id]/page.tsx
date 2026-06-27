import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getProde, getProdeWeeks } from "@/lib/actions/prode";
import { getCurrentUser } from "@/lib/actions/user";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const prode = await getProde(params.id);
  if (!prode) return { title: "Prode no encontrado" };
  return {
    title: prode.name,
    description: prode.description || `Prode ${prode.name} — Predecí resultados y competí con amigos en Modo Fosa.`,
    alternates: { canonical: `/prode/${prode.id}` },
    openGraph: {
      title: `${prode.name} | Modo Fosa`,
      description: prode.description || `Prode de fútbol en Modo Fosa`,
      ...(prode.bannerUrl && { images: [{ url: prode.bannerUrl }] }),
    },
  };
}
import { ShareCodeCopy } from "@/components/prode/ShareCodeCopy";
import { DeleteProdeButton } from "@/components/prode/DeleteProdeButton";
import { JoinRequestsPanel } from "@/components/prode/JoinRequestsPanel";
import { ProdeChat } from "@/components/prode/ProdeChat";
import { ProdeLeaderboard } from "@/components/prode/ProdeLeaderboard";
import { ProdeParticipants } from "@/components/prode/ProdeParticipants";
import { Suspense } from "react";
import { GroupPredictionsSection } from "@/components/prode/GroupPredictionsSection";

function getWeekStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    UPCOMING: { label: "Próxima", color: "bg-surface-light text-foreground/50" },
    OPEN: { label: "Abierta", color: "bg-accent/20 text-accent" },
    CLOSED: { label: "Cerrada", color: "bg-gold/20 text-gold" },
    SCORED: { label: "Puntuada", color: "bg-foreground/10 text-foreground/50" },
  };
  return map[status] ?? { label: status, color: "bg-surface-light text-foreground/50" };
}

interface PageProps {
  params: { id: string };
}

export default async function ProdeDetailPage({ params }: PageProps) {
  const [prode, weeks] = await Promise.all([
    getProde(params.id),
    getProdeWeeks(),
  ]);

  if (!prode) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const isCreator = currentUser && currentUser.id === prode.createdById;
  const isProdeAdmin = currentUser && prode.participants.some(
    (p) => p.userId === currentUser.id && p.role === "ADMIN"
  );
  const canEdit = currentUser && (isCreator || isProdeAdmin || currentUser.role === "ADMIN");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/prode" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Mis Prodes
        </Link>

        {/* Banner */}
        {prode.bannerUrl && (
          <div className="relative mb-4 aspect-[3/1] overflow-hidden rounded-xl">
            <Image src={prode.bannerUrl} alt={prode.name} fill className="object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {prode.imageUrl && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-surface-light">
                <Image src={prode.imageUrl} alt="" fill className="object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold sm:text-2xl">{prode.name}</h1>
              {prode.visibility === "PRIVATE" && (
                <span className="mt-1 inline-block rounded-full bg-surface-light px-2.5 py-0.5 text-xs font-medium text-foreground/50">
                  🔒 Privado
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link
                href={`/prode/${prode.id}/editar`}
                className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-accent hover:text-accent"
              >
                Editar
              </Link>
              <DeleteProdeButton prodeId={prode.id} prodeName={prode.name} />
            </div>
          )}
          {prode.description && (
            <p className="mt-1 text-foreground/60 whitespace-pre-wrap">
              <Linkify text={prode.description} />
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-foreground/50">
            <span>Creado por <span className="text-accent">{prode.createdBy.username}</span></span>
            <span>·</span>
            <span>{prode.participants.length} participantes</span>
          </div>
        </div>

        {/* Prizes */}
        {(prode.prizeGeneral || prode.prizePerWeek || prode.prizeGroupOrder || prode.prizeRounds) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Premios</CardTitle>
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {prode.prizeGeneral && (
                <div className="rounded-lg bg-gold/5 p-3">
                  <p className="text-xs font-bold text-gold">🏆 General</p>
                  <p className="mt-1 text-sm">{prode.prizeGeneral}</p>
                </div>
              )}
              {prode.prizePerWeek && (
                <div className="rounded-lg bg-accent/5 p-3">
                  <p className="text-xs font-bold text-accent">📅 Por fecha</p>
                  <p className="mt-1 text-sm">{prode.prizePerWeek}</p>
                </div>
              )}
              {prode.prizeGroupOrder && (
                <div className="rounded-lg bg-blue-500/5 p-3">
                  <p className="text-xs font-bold text-blue-400">📊 Orden de grupo</p>
                  <p className="mt-1 text-sm">{prode.prizeGroupOrder}</p>
                </div>
              )}
              {prode.prizeRounds && (
                <div className="rounded-lg bg-purple-500/5 p-3">
                  <p className="text-xs font-bold text-purple-400">🔮 Equipos que pasan</p>
                  <p className="mt-1 text-sm">{prode.prizeRounds}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Top 5 leaderboard */}
        <ProdeLeaderboard prodeId={prode.id} maxRows={5} />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left: Weeks + predictions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Weeks list */}
            <Card>
              <CardHeader>
                <CardTitle>Fechas del Mundial</CardTitle>
              </CardHeader>
              {weeks.length === 0 ? (
                <p className="text-sm text-foreground/50">No hay fechas cargadas todavía</p>
              ) : (
                <div className="space-y-2">
                  {weeks.map((week) => {
                    const isGroupStage = week.title.toLowerCase().includes("fase de grupos");
                    const displayStatus = isGroupStage && week.status !== "SCORED" ? "OPEN" : week.status;
                    const statusInfo = getWeekStatusInfo(displayStatus);
                    return (
                      <Link
                        key={week.id}
                        href={`/prode/${prode.id}/${week.id}`}
                        className="flex items-center justify-between rounded-lg border border-surface-light/50 bg-background p-3 transition-colors hover:border-accent/50"
                      >
                        <div>
                          <p className="font-medium">{week.title}</p>
                          <p className="text-xs text-foreground/50">
                            {week._count.matches} partidos ·{" "}
                            {new Date(week.deadline).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Leaderboard */}
            <ProdeLeaderboard prodeId={prode.id} />

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participantes ({prode.participants.length})</CardTitle>
              </CardHeader>
              <ProdeParticipants
                prodeId={prode.id}
                createdById={prode.createdById}
                participants={prode.participants.map((p) => ({
                  id: p.id,
                  userId: p.userId,
                  role: p.role,
                  user: p.user,
                }))}
                isCreator={!!isCreator}
              />
            </Card>

            {/* Share code */}
            <ShareCodeCopy shareCode={prode.shareCode} />

            {/* Join requests (private prodes, creator/admin only) */}
            {prode.visibility === "PRIVATE" && canEdit && (
              <JoinRequestsPanel prodeId={prode.id} />
            )}
          </div>

          {/* Right: Chat */}
          <div>
            {currentUser && (
              <div className="sticky top-20">
                <ProdeChat prodeId={prode.id} currentUserId={currentUser.id} />
              </div>
            )}
          </div>
        </div>

        {/* Group predictions comparison */}
        <div className="mt-6">
          <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-surface" />}>
            <GroupPredictionsSection prodeId={prode.id} />
          </Suspense>
        </div>

        {/* Ad */}
        <div className="mt-8">
          <AdSlot format="horizontal" />
        </div>
      </main>
    </div>
  );
}

/** Converts URLs in text to clickable links */
function Linkify({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:opacity-80 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
