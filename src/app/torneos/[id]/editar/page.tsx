"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getTournamentForEdit, updateTournament } from "@/lib/actions/tournament";
import { uploadTournamentBanner } from "@/lib/actions/upload";
import type { TournamentFormat, Platform, TeamType, TournamentVisibility, TournamentStatus } from "@prisma/client";

const FORMATS: { value: TournamentFormat; label: string }[] = [
  { value: "SINGLE_ELIMINATION", label: "Eliminación Simple" },
  { value: "DOUBLE_ELIMINATION", label: "Doble Eliminación" },
  { value: "LEAGUE", label: "Liga" },
  { value: "GROUP_KNOCKOUT", label: "Grupos + Eliminación" },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC" },
];

const TEAM_TYPES: { value: TeamType; label: string }[] = [
  { value: "ULTIMATE_TEAM", label: "Ultimate Team" },
  { value: "REAL_TEAMS", label: "Equipos reales" },
  { value: "FUT_CHAMPIONS", label: "Alineación FUT Champions" },
];

const STATUSES: { value: TournamentStatus; label: string }[] = [
  { value: "DRAFT", label: "Borrador" },
  { value: "REGISTRATION", label: "Inscripciones abiertas" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function EditarTorneoPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [prize, setPrize] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("SINGLE_ELIMINATION");
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [teamType, setTeamType] = useState<TeamType>("ULTIMATE_TEAM");
  const [visibility, setVisibility] = useState<TournamentVisibility>("PUBLIC");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [controls, setControls] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [stadium, setStadium] = useState("");
  const [status, setStatus] = useState<TournamentStatus>("REGISTRATION");

  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await getTournamentForEdit(tournamentId);
      if (!t) {
        router.push("/torneos");
        return;
      }
      setName(t.name);
      setDescription(t.description ?? "");
      setRules(t.rules ?? "");
      setPrize(t.prize ?? "");
      setFormat(t.format);
      setMaxPlayers(t.maxPlayers);
      setSelectedPlatforms(t.platforms);
      setTeamType(t.teamType);
      setVisibility(t.visibility);
      setRequiresVerification(t.requiresVerification);
      setStartDate(t.startDate ? new Date(t.startDate).toISOString().slice(0, 16) : "");
      setRegistrationOpen(t.registrationOpen ? new Date(t.registrationOpen).toISOString().slice(0, 16) : "");
      setRegistrationDeadline(t.registrationDeadline ? new Date(t.registrationDeadline).toISOString().slice(0, 16) : "");
      setMatchTime(t.matchTime ?? "");
      setDifficulty(t.difficulty ?? "");
      setControls(t.controls ?? "");
      setGameMode(t.gameMode ?? "");
      setStadium(t.stadium ?? "");
      setStatus(t.status);
      setLogoUrl(t.logoUrl ?? "");
      setBannerUrl(t.bannerUrl ?? "");
      setLoaded(true);
    }
    load();
  }, [tournamentId, router]);

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await updateTournament({
      tournamentId,
      name,
      description,
      rules,
      prize,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      maxPlayers,
      platforms: selectedPlatforms,
      teamType,
      visibility,
      requiresVerification,
      registrationOpen: registrationOpen || null,
      registrationDeadline: registrationDeadline || null,
      startDate: startDate || null,
      matchTime,
      difficulty,
      controls,
      gameMode,
      stadium,
      status,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push(`/torneos/${tournamentId}`), 1500);
  }

  const inputClass =
    "w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none";

  if (!loaded) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-surface" />
            <div className="h-64 rounded-xl bg-surface" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Editar Torneo</h1>
          <p className="mt-1 text-foreground/60">Modificá la configuración del torneo</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
              Torneo actualizado. Redirigiendo...
            </div>
          )}

          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del torneo</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    status === s.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-surface-light hover:border-accent/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Info básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Nombre *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Reglamento</label>
                <textarea
                  rows={3}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Premio</label>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Logo + Banner */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Logo</label>
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-light">
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1 text-[10px] text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer rounded-lg border border-dashed border-surface-light px-3 py-2 text-sm text-foreground/50 hover:border-accent hover:text-accent">
                      {logoUploading ? "Subiendo..." : logoUrl ? "Cambiar" : "Subir logo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={logoUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setLogoUploading(true);
                          const fd = new FormData();
                          fd.append("file", file);
                          const result = await uploadTournamentBanner(fd);
                          if (result.url) setLogoUrl(result.url);
                          else setError(result.error ?? "Error al subir");
                          setLogoUploading(false);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-foreground/40">Cuadrado (500×500 recomendado). JPG, PNG o WebP. Máx 5MB.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Banner</label>
                  <div className="flex items-center gap-3">
                    {bannerUrl && (
                      <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-surface-light">
                        <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBannerUrl("")}
                          className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1 text-[10px] text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer rounded-lg border border-dashed border-surface-light px-3 py-2 text-sm text-foreground/50 hover:border-accent hover:text-accent">
                      {bannerUploading ? "Subiendo..." : bannerUrl ? "Cambiar" : "Subir banner"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={bannerUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBannerUploading(true);
                          const fd = new FormData();
                          fd.append("file", file);
                          const result = await uploadTournamentBanner(fd);
                          if (result.url) setBannerUrl(result.url);
                          else setError(result.error ?? "Error al subir");
                          setBannerUploading(false);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-foreground/40">Panorámico (1200×400 recomendado). JPG, PNG o WebP. Máx 5MB.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Formato</label>
                  <select value={format} onChange={(e) => setFormat(e.target.value as TournamentFormat)} className={inputClass}>
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Max jugadores</label>
                  <input
                    type="number"
                    min={2}
                    max={128}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground/70">Plataformas</label>
                <div className="flex gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePlatform(p.value)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        selectedPlatforms.includes(p.value)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-surface-light hover:border-accent"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Tipo de equipos</label>
                  <select value={teamType} onChange={(e) => setTeamType(e.target.value as TeamType)} className={inputClass}>
                    {TEAM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Visibilidad</label>
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value as TournamentVisibility)} className={inputClass}>
                    <option value="PUBLIC">Público</option>
                    <option value="PRIVATE_LINK">Privado (link)</option>
                    <option value="INVITE_ONLY">Solo invitación</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={requiresVerification}
                  onChange={(e) => setRequiresVerification(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm">Requiere verificación de participante</span>
              </label>
            </div>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Apertura inscripciones</label>
                <input type="datetime-local" value={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Cierre inscripciones</label>
                <input type="datetime-local" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Inicio torneo</label>
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
            </div>
          </Card>

          {/* Reglas de juego */}
          <Card>
            <CardHeader>
              <CardTitle>Reglas de juego</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Tiempo partido</label>
                <select value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className={inputClass}>
                  <option value="">Sin definir</option>
                  <option value="4 minutos">4 minutos</option>
                  <option value="5 minutos">5 minutos</option>
                  <option value="6 minutos">6 minutos</option>
                  <option value="8 minutos">8 minutos</option>
                  <option value="10 minutos">10 minutos</option>
                  <option value="12 minutos">12 minutos</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Dificultad</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                  <option value="">Cualquiera</option>
                  <option value="Profesional">Profesional</option>
                  <option value="Clase Mundial">Clase Mundial</option>
                  <option value="Leyenda">Leyenda</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Controles</label>
                <select value={controls} onChange={(e) => setControls(e.target.value)} className={inputClass}>
                  <option value="">Cualquiera</option>
                  <option value="Clásico">Clásico</option>
                  <option value="Alternativo">Alternativo</option>
                  <option value="Competitivo">Competitivo</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Modo de juego</label>
                <select value={gameMode} onChange={(e) => setGameMode(e.target.value)} className={inputClass}>
                  <option value="">Sin especificar</option>
                  <option value="1vs1">1vs1</option>
                  <option value="2vs2">2vs2</option>
                  <option value="3vs3">3vs3</option>
                  <option value="4vs4">4vs4</option>
                  <option value="Clubes Pro">Clubes Pro</option>
                  <option value="Rush">Rush</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Estadio</label>
                <input type="text" value={stadium} onChange={(e) => setStadium(e.target.value)} className={inputClass} />
              </div>
            </div>
          </Card>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-lg bg-accent py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </main>
    </div>
  );
}
