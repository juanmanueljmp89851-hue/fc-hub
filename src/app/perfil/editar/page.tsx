"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { getCurrentUser, updateProfile } from "@/lib/actions/user";
import { NATIONALITIES, POPULAR_TEAMS } from "@/lib/constants";
import type { User } from "@/types";

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("bienvenida") === "1";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [psnUsername, setPsnUsername] = useState("");
  const [xboxUsername, setXboxUsername] = useState("");
  const [pcUsername, setPcUsername] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    async function loadUser() {
      const dbUser = await getCurrentUser();
      if (!dbUser) {
        router.push("/auth/login");
        return;
      }
      setUser(dbUser);
      setUsername(dbUser.username);
      setBio(dbUser.bio ?? "");
      setPsnUsername(dbUser.psnUsername ?? "");
      setXboxUsername(dbUser.xboxUsername ?? "");
      setPcUsername(dbUser.pcUsername ?? "");
      setFavoriteTeam(dbUser.favoriteTeam ?? "");
      setNationality(dbUser.nationality ?? "");
      setPhone(dbUser.phone ?? "");
      setLocation(dbUser.location ?? "");
      setLoading(false);
    }
    loadUser();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const formData = new FormData();
    formData.set("username", username);
    formData.set("bio", bio);
    formData.set("psnUsername", psnUsername);
    formData.set("xboxUsername", xboxUsername);
    formData.set("pcUsername", pcUsername);
    formData.set("favoriteTeam", favoriteTeam);
    formData.set("nationality", nationality);
    formData.set("phone", phone);
    formData.set("location", location);

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);

    if (isWelcome) {
      setTimeout(() => router.push("/"), 1500);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
          <div className="h-[600px] animate-pulse rounded-xl bg-surface" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const inputClass =
    "w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-foreground/70";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {isWelcome && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 px-6 py-4">
          <h2 className="mb-1 text-lg font-bold text-accent">
            ¡Bienvenido a Modo Fosa! 🎮
          </h2>
          <p className="text-sm text-foreground/60">
            Personalizá tu perfil para que otros jugadores te conozcan.
            Podés completar esto después si preferís.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isWelcome ? "Configurá tu perfil" : "Editar perfil"}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
              ¡Perfil actualizado correctamente!
              {isWelcome && " Redirigiendo..."}
            </div>
          )}

          {/* Avatar */}
          <AvatarUpload currentUrl={user.avatarUrl} userId={user.id} />

          {/* Info básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Información básica
            </h3>

            <div>
              <label className={labelClass}>Nombre de usuario *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: ElPibe10"
                maxLength={20}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground/40">
                Se muestra en torneos, ranking y perfil público. Solo letras,
                números y guión bajo.
              </p>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className={`${inputClass} cursor-not-allowed opacity-50`}
              />
              <p className="mt-1 text-xs text-foreground/40">
                No se puede cambiar el email
              </p>
            </div>

            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contá algo sobre vos..."
                maxLength={200}
                rows={3}
                className={`${inputClass} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-foreground/40">
                {bio.length}/200
              </p>
            </div>
          </div>

          {/* Cuentas de juego */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Cuentas de juego
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>
                  <span className="mr-1.5 inline-block">🎮</span>
                  PSN (PlayStation)
                </label>
                <input
                  type="text"
                  value={psnUsername}
                  onChange={(e) => setPsnUsername(e.target.value)}
                  placeholder="Tu PSN ID"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="mr-1.5 inline-block">🟢</span>
                  Xbox Gamertag
                </label>
                <input
                  type="text"
                  value={xboxUsername}
                  onChange={(e) => setXboxUsername(e.target.value)}
                  placeholder="Tu Gamertag"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="mr-1.5 inline-block">💻</span>
                  PC (EA App / Origin)
                </label>
                <input
                  type="text"
                  value={pcUsername}
                  onChange={(e) => setPcUsername(e.target.value)}
                  placeholder="Tu ID de EA"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Datos personales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Datos personales
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Equipo preferido</label>
                <select
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccioná un equipo</option>
                  {POPULAR_TEAMS.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nacionalidad</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccioná tu país</option>
                  {NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Teléfono celular
                  <span className="ml-1 text-foreground/40">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Ubicación</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Buenos Aires, Argentina"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-accent py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {!isWelcome && (
              <button
                type="button"
                onClick={() => router.push("/perfil")}
                className="rounded-lg border border-surface-light px-6 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
              >
                Cancelar
              </button>
            )}
            {isWelcome && (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg border border-surface-light px-6 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
              >
                Después
              </button>
            )}
          </div>
        </form>
      </Card>
    </main>
  );
}

export default function EditProfilePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Suspense
        fallback={
          <main className="mx-auto max-w-2xl px-4 py-8">
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
              <div className="h-[600px] animate-pulse rounded-xl bg-surface" />
            </div>
          </main>
        }
      >
        <EditProfileContent />
      </Suspense>
    </div>
  );
}
