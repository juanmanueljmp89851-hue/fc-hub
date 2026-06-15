"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { createTeam } from "@/lib/actions/team";
import type { Platform, TeamMode } from "@prisma/client";

export default function CrearEquipoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [mode, setMode] = useState<TeamMode>("CLUBS_PRO");
  const [platform, setPlatform] = useState<Platform>("PS5");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createTeam({ name, tag: tag || undefined, mode, platform });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.teamId) {
      router.push(`/equipos/${result.teamId}`);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Crear Equipo</h1>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">Nombre del equipo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Los Capos FC"
                maxLength={40}
                required
                className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">Tag (abreviatura)</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="Ej: LCF"
                maxLength={5}
                className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">Modo de juego *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode("CLUBS_PRO")}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-bold transition-colors ${
                    mode === "CLUBS_PRO"
                      ? "border-blue-400 bg-blue-500/10 text-blue-400"
                      : "border-surface-light text-foreground/50 hover:border-foreground/20"
                  }`}
                >
                  ⚽ Clubes Pro
                  <p className="mt-1 text-xs font-normal opacity-60">11 vs 11</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("RUSH")}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-bold transition-colors ${
                    mode === "RUSH"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-surface-light text-foreground/50 hover:border-foreground/20"
                  }`}
                >
                  ⚡ Rush
                  <p className="mt-1 text-xs font-normal opacity-60">5 vs 5</p>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">Plataforma *</label>
              <div className="flex gap-3">
                {(["PS5", "XBOX", "PC"] as Platform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors ${
                      platform === p
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-surface-light text-foreground/50 hover:border-foreground/20"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-foreground/40">
                Todos los jugadores deben tener gamertag de {platform} en su perfil
              </p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-lg bg-accent py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Equipo"}
            </button>
          </form>
        </Card>

        <div className="mt-4 rounded-xl border border-surface-light bg-surface/30 p-4">
          <h3 className="mb-2 text-sm font-bold text-foreground/70">Lista de buena fe</h3>
          <p className="text-xs text-foreground/50">
            Cada jugador que se sume al equipo debe tener su gamertag de {platform} configurado en su perfil de Modo Fosa.
            Esto garantiza la identidad de los jugadores y evita cambios de lista.
          </p>
          <p className="mt-2 text-xs text-foreground/50">
            Clubes Pro: hasta 30 jugadores + DT. Rush: hasta 10 jugadores + DT.
          </p>
        </div>
      </main>
    </div>
  );
}
