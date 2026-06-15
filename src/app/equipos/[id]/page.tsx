import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getTeam } from "@/lib/actions/team";
import { getCurrentUser } from "@/lib/actions/user";
import { TeamRoster } from "@/components/teams/TeamRoster";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const team = await getTeam(params.id);
  if (!team) return { title: "Equipo no encontrado" };
  return { title: `${team.name} — ${team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}` };
}

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const team = await getTeam(params.id);
  if (!team) notFound();

  const currentUser = await getCurrentUser();
  const isManager = currentUser?.id === team.managerId;
  const isAdmin = currentUser?.role === "ADMIN";
  const canManage = isManager || isAdmin;
  const maxMembers = team.mode === "CLUBS_PRO" ? 31 : 11;

  const gamertagField = team.platform === "PS5" ? "psnUsername" : team.platform === "XBOX" ? "xboxUsername" : "pcUsername";
  const gamertagLabel = team.platform === "PS5" ? "PSN" : team.platform === "XBOX" ? "Xbox GT" : "EA ID";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Banner */}
        <div className="relative mb-6 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-surface-light via-surface to-surface-light">
          {team.bannerUrl ? (
            <Image src={team.bannerUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl opacity-20">⚽</div>
          )}
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-surface-light bg-surface-light">
            {team.logoUrl ? (
              <Image src={team.logoUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">🛡️</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {team.tag && <span className="rounded bg-surface-light px-2 py-0.5 text-sm font-bold text-foreground/40">[{team.tag}]</span>}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-foreground/60">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                team.mode === "CLUBS_PRO" ? "bg-blue-500/20 text-blue-400" : "bg-gold/20 text-gold"
              }`}>
                {team.mode === "CLUBS_PRO" ? "Clubes Pro 11v11" : "Rush 5v5"}
              </span>
              <span className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium">{team.platform}</span>
              <span>DT: <span className="text-accent">{team.manager.username}</span></span>
            </div>
          </div>
          {canManage && (
            <Link
              href={`/equipos/${team.id}/gestionar`}
              className="shrink-0 rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
            >
              ⚙️ Gestionar
            </Link>
          )}
        </div>

        {/* Lista de buena fe */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Lista de buena fe ({team.members.length}/{maxMembers})
            </CardTitle>
          </CardHeader>
          <p className="mb-4 text-xs text-foreground/40">
            Cada jugador debe tener su {gamertagLabel} configurado en Modo Fosa. La lista garantiza la identidad de los participantes.
          </p>

          {/* Table header */}
          <div className="mb-2 grid grid-cols-12 gap-2 text-xs font-bold text-foreground/40">
            <span className="col-span-1">#</span>
            <span className="col-span-3">Jugador</span>
            <span className="col-span-3">{gamertagLabel}</span>
            <span className="col-span-2">Posición</span>
            <span className="col-span-2">Rol</span>
            {canManage && <span className="col-span-1"></span>}
          </div>

          <div className="space-y-1">
            {team.members.map((member) => {
              const gamertag = member.user[gamertagField as keyof typeof member.user] as string | null;
              return (
                <div key={member.id} className="grid grid-cols-12 items-center gap-2 rounded-lg bg-background/50 px-2 py-2 text-sm">
                  <span className="col-span-1 text-xs text-foreground/30">
                    {member.shirtNumber ?? "-"}
                  </span>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {member.user.avatarUrl ? (
                        <Image src={member.user.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px]">👤</div>
                      )}
                    </div>
                    <span className="truncate font-medium">{member.user.username}</span>
                  </div>
                  <span className="col-span-3 truncate text-xs text-foreground/60">
                    {gamertag || <span className="text-red-400">Sin configurar</span>}
                  </span>
                  <span className="col-span-2 text-xs text-foreground/50">
                    {member.position || "-"}
                  </span>
                  <span className={`col-span-2 text-xs font-bold ${member.role === "MANAGER" ? "text-gold" : "text-foreground/50"}`}>
                    {member.role === "MANAGER" ? "DT" : "Jugador"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Agregar jugador (solo DT) */}
        {canManage && (
          <TeamRoster teamId={team.id} platform={team.platform} mode={team.mode} currentCount={team.members.length} />
        )}
      </main>
    </div>
  );
}
