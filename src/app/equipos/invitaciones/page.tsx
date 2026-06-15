import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getMyInvites } from "@/lib/actions/team";
import { InviteActions } from "@/components/teams/InviteActions";

export const metadata: Metadata = {
  title: "Invitaciones de equipo",
};

export default async function InvitacionesPage() {
  const invites = await getMyInvites();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Invitaciones de equipo</h1>

        {invites.length === 0 ? (
          <Card className="py-12 text-center">
            <span className="mb-4 block text-5xl">📩</span>
            <p className="text-lg font-medium text-foreground/50">No tenés invitaciones pendientes</p>
            <p className="mt-2 text-sm text-foreground/40">
              Cuando un DT te invite a su equipo, vas a verlo acá
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <Card key={invite.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-light">
                    {invite.team.logoUrl ? (
                      <Image src={invite.team.logoUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">🛡️</div>
                    )}
                  </div>
                  <div>
                    <Link href={`/equipos/${invite.team.id}`} className="font-bold hover:text-accent">
                      {invite.team.name}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        invite.team.mode === "CLUBS_PRO" ? "bg-blue-500/20 text-blue-400" : "bg-gold/20 text-gold"
                      }`}>
                        {invite.team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}
                      </span>
                      <span>{invite.team.platform}</span>
                      <span>·</span>
                      <span>DT: {invite.team.manager.username}</span>
                      <span>·</span>
                      <span>{invite.team._count.members} jugadores</span>
                    </div>
                  </div>
                </div>
                <InviteActions inviteId={invite.id} />
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
