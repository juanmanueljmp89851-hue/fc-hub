"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/actions/user";
import type { User } from "@/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface p-3 text-center">
      <p className="text-lg font-bold text-accent">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-base">{icon}</span>
      <span className="text-foreground/50">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const dbUser = await getCurrentUser();
      if (!dbUser) {
        router.push("/auth/login");
        return;
      }
      setUser(dbUser);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-surface" />
              <div className="space-y-2">
                <div className="h-6 w-40 animate-pulse rounded bg-surface" />
                <div className="h-4 w-24 animate-pulse rounded bg-surface" />
              </div>
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-surface" />
            <div className="h-32 animate-pulse rounded-xl bg-surface" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-surface-light">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface text-3xl text-foreground/30">
                  👤
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-foreground">
                {user.username}
              </h1>
              <p className="text-sm text-foreground/50">{user.email}</p>
              {user.bio && (
                <p className="mt-2 text-sm text-foreground/70">{user.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {user.nationality && (
                  <span className="rounded-full bg-surface px-3 py-0.5 text-xs text-foreground/60">
                    📍 {user.nationality}
                  </span>
                )}
                {user.favoriteTeam && (
                  <span className="rounded-full bg-surface px-3 py-0.5 text-xs text-foreground/60">
                    ⚽ {user.favoriteTeam}
                  </span>
                )}
                {user.location && (
                  <span className="rounded-full bg-surface px-3 py-0.5 text-xs text-foreground/60">
                    🏠 {user.location}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <Link
              href="/perfil/editar"
              className="shrink-0 rounded-lg border border-surface-light px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
            >
              Editar perfil
            </Link>
          </div>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/50">
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Reputación" value={user.reputationPoints} />
            <StatCard label="Ranking" value={user.rankingPoints} />
            <StatCard
              label="Miembro desde"
              value={new Date(user.createdAt).toLocaleDateString("es-AR", {
                month: "short",
                year: "numeric",
              })}
            />
            <StatCard label="Rol" value={user.role === "ADMIN" ? "Admin" : "Jugador"} />
          </div>
        </Card>

        {/* Cuentas de juego */}
        {(user.psnUsername || user.xboxUsername || user.pcUsername) && (
          <Card className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Cuentas de juego
            </h3>
            <div className="space-y-2">
              <InfoRow icon="🎮" label="PSN" value={user.psnUsername} />
              <InfoRow icon="🟢" label="Xbox" value={user.xboxUsername} />
              <InfoRow icon="💻" label="PC" value={user.pcUsername} />
            </div>
          </Card>
        )}

        {/* Contacto */}
        {user.phone && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Contacto
            </h3>
            <InfoRow icon="📱" label="Teléfono" value={user.phone} />
          </Card>
        )}
      </main>
    </div>
  );
}
