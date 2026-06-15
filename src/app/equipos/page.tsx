import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { listTeams, getMyTeams } from "@/lib/actions/team";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Equipos — Clubes Pro & Rush",
  description: "Creá tu equipo de Clubes Pro o Rush y competí con tu plantilla.",
};

export default async function EquiposPage() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!authUser;

  const [allTeams, myTeams] = await Promise.all([
    listTeams(),
    isLoggedIn ? getMyTeams() : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Equipos</h1>
            <p className="mt-1 text-foreground/60">
              Clubes Pro (11v11) y Rush (5v5) — armá tu plantilla y competí
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/equipos/crear"
              className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90"
            >
              + Crear Equipo
            </Link>
          )}
        </div>

        {/* Mis equipos */}
        {isLoggedIn && myTeams.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-bold">Mis Equipos</h2>
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </>
        )}

        {/* Todos los equipos */}
        <h2 className="mb-4 text-xl font-bold">Todos los equipos</h2>
        {allTeams.length === 0 ? (
          <Card className="py-12 text-center">
            <span className="mb-4 block text-5xl">⚽</span>
            <p className="text-lg font-medium text-foreground/50">No hay equipos todavía</p>
            <p className="mt-2 text-sm text-foreground/40">Sé el primero en crear un equipo</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    tag: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    mode: string;
    platform: string;
    manager: { id: string; username: string; avatarUrl: string | null };
    _count: { members: number };
  };
}

function TeamCard({ team }: TeamCardProps) {
  const maxMembers = team.mode === "CLUBS_PRO" ? 31 : 11;
  return (
    <Link href={`/equipos/${team.id}`}>
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-accent/50">
        <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-surface-light via-surface to-surface-light">
          {team.bannerUrl ? (
            <Image src={team.bannerUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl opacity-20">⚽</div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              team.mode === "CLUBS_PRO" ? "bg-blue-500/20 text-blue-400" : "bg-gold/20 text-gold"
            }`}>
              {team.mode === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}
            </span>
            <span className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60">
              {team.platform}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-light">
              {team.logoUrl ? (
                <Image src={team.logoUrl} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">🛡️</div>
              )}
            </div>
            <div>
              <h3 className="font-bold">{team.name}</h3>
              {team.tag && <span className="text-xs text-foreground/40">[{team.tag}]</span>}
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3 text-xs text-foreground/50">
            <span>DT: <span className="text-accent">{team.manager.username}</span></span>
            <span>{team._count.members}/{maxMembers} jugadores</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
