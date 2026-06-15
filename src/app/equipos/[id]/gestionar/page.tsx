import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getTeam, getTeamInvites, getTeamJoinRequests } from "@/lib/actions/team";
import { getCurrentUser } from "@/lib/actions/user";
import { PlayerSearch } from "@/components/teams/PlayerSearch";
import { JoinRequestActions } from "@/components/teams/JoinRequestActions";
import { TeamLogoUpload } from "@/components/teams/TeamLogoUpload";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const team = await getTeam(params.id);
  if (!team) return { title: "Equipo no encontrado" };
  return { title: `Gestionar ${team.name}` };
}

export default async function GestionarEquipoPage({ params }: { params: { id: string } }) {
  const team = await getTeam(params.id);
  if (!team) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const isManager = currentUser.id === team.managerId;
  const isAdmin = currentUser.role === "ADMIN";
  if (!isManager && !isAdmin) redirect(`/equipos/${params.id}`);

  const invites = await getTeamInvites(params.id);
  const joinRequests = await getTeamJoinRequests(params.id);
  const maxMembers = team.mode === "CLUBS_PRO" ? 31 : 11;
  const gamertagField = team.platform === "PS5" ? "psnUsername" : team.platform === "XBOX" ? "xboxUsername" : "pcUsername";
  const gamertagLabel = team.platform === "PS5" ? "PSN" : team.platform === "XBOX" ? "Xbox GT" : "EA ID";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href={`/equipos/${team.id}`} className="text-sm text-foreground/40 hover:text-accent">
              ← Volver al equipo
            </Link>
            <h1 className="mt-1 text-2xl font-bold">Gestionar {team.name}</h1>
            <p className="text-sm text-foreground/60">
              {team.mode === "CLUBS_PRO" ? "Clubes Pro 11v11" : "Rush 5v5"} · {team.platform} · {team.members.length}/{maxMembers} jugadores
            </p>
          </div>
        </div>

        {/* Logo del equipo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Escudo del equipo</CardTitle>
          </CardHeader>
          <TeamLogoUpload teamId={team.id} currentUrl={team.logoUrl ?? null} />
        </Card>

        {/* Invitar jugador */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invitar jugador</CardTitle>
          </CardHeader>
          <p className="mb-4 text-xs text-foreground/40">
            Buscá usuarios registrados en Modo Fosa para invitarlos a tu equipo. Deben tener su {gamertagLabel} configurado.
          </p>
          <PlayerSearch teamId={team.id} platform={team.platform} />
        </Card>

        {/* Invitaciones pendientes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invitaciones enviadas ({invites.filter(i => i.status === "PENDING").length} pendientes)</CardTitle>
          </CardHeader>
          {invites.length === 0 ? (
            <p className="text-sm text-foreground/40">No hay invitaciones enviadas</p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {invite.invited.avatarUrl ? (
                        <Image src={invite.invited.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs">👤</div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{invite.invited.username}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    invite.status === "PENDING" ? "bg-gold/20 text-gold" :
                    invite.status === "ACCEPTED" ? "bg-accent/20 text-accent" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {invite.status === "PENDING" ? "Pendiente" : invite.status === "ACCEPTED" ? "Aceptada" : "Rechazada"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Solicitudes de unión */}
        {joinRequests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Solicitudes de unión ({joinRequests.length})</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {joinRequests.map((req) => {
                const gt = req.requester[gamertagField as keyof typeof req.requester] as string | null;
                return (
                  <div key={req.id} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-light">
                        {req.requester.avatarUrl ? (
                          <Image src={req.requester.avatarUrl} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs">👤</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{req.requester.username}</span>
                        <span className="ml-2 text-xs text-foreground/40">
                          {gt ? `${gamertagLabel}: ${gt}` : `Sin ${gamertagLabel}`}
                        </span>
                      </div>
                    </div>
                    <JoinRequestActions requestId={req.id} />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Lista de buena fe */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lista de buena fe ({team.members.length}/{maxMembers})</CardTitle>
          </CardHeader>
          <div className="space-y-1">
            {team.members.map((member) => {
              const gamertag = member.user[gamertagField as keyof typeof member.user] as string | null;
              return (
                <div key={member.id} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs text-foreground/30">{member.shirtNumber ?? "-"}</span>
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {member.user.avatarUrl ? (
                        <Image src={member.user.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs">👤</div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{member.user.username}</span>
                    <span className="text-xs text-foreground/40">{gamertag || "Sin GT"}</span>
                  </div>
                  <span className={`text-xs font-bold ${member.role === "MANAGER" ? "text-gold" : "text-foreground/50"}`}>
                    {member.role === "MANAGER" ? "DT" : "Jugador"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Torneos (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Torneos</CardTitle>
          </CardHeader>
          <p className="text-sm text-foreground/40">Próximamente: torneos en los que participa y se puede inscribir el equipo.</p>
        </Card>
      </main>
    </div>
  );
}
