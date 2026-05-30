"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { createTournament } from "@/lib/actions/tournament";
import { uploadTournamentBanner } from "@/lib/actions/upload";
import type { TournamentFormat, Platform, TeamType, TournamentVisibility, KnockoutSeeding, DrawUntilStage } from "@prisma/client";

const FORMATS: { value: TournamentFormat; label: string; description: string }[] = [
  { value: "SINGLE_ELIMINATION", label: "Eliminación Simple", description: "El perdedor queda eliminado. Bracket tipo árbol." },
  { value: "DOUBLE_ELIMINATION", label: "Doble Eliminación", description: "Bracket principal + repechaje. Se necesitan 2 derrotas para ser eliminado." },
  { value: "LEAGUE", label: "Liga (Todos contra todos)", description: "Cada participante juega contra todos. Tabla de posiciones." },
  { value: "GROUP_KNOCKOUT", label: "Fase de Grupos + Eliminación", description: "Grupos con liga interna, los mejores pasan a eliminación." },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC" },
];

const TEAM_TYPES: { value: TeamType; label: string; description: string }[] = [
  { value: "ULTIMATE_TEAM", label: "Ultimate Team", description: "Equipos armados en UT" },
  { value: "REAL_TEAMS", label: "Equipos reales", description: "Selecciones o clubes del juego" },
  { value: "FUT_CHAMPIONS", label: "Alineación FUT Champions", description: "Alineación tipo FUT Champions" },
];

const VISIBILITY_OPTIONS: { value: TournamentVisibility; label: string; description: string }[] = [
  { value: "PUBLIC", label: "Público", description: "Cualquiera puede ver e inscribirse" },
  { value: "PRIVATE_LINK", label: "Privado (por link)", description: "Solo accesible con link de invitación" },
  { value: "INVITE_ONLY", label: "Solo por invitación", description: "El organizador envía invitaciones" },
];

export default function CrearTorneoPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [prize, setPrize] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("SINGLE_ELIMINATION");
  const [leagueLegs, setLeagueLegs] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [teamType, setTeamType] = useState<TeamType>("ULTIMATE_TEAM");
  const [visibility, setVisibility] = useState<TournamentVisibility>("PUBLIC");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [controls, setControls] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [stadium, setStadium] = useState("");
  const [groupCount, setGroupCount] = useState(4);
  const [qualifyPerGroup, setQualifyPerGroup] = useState(2);
  const [knockoutSeeding, setKnockoutSeeding] = useState<KnockoutSeeding>("RANDOM");
  const [randomDrawUntil, setRandomDrawUntil] = useState<DrawUntilStage>("FINAL");
  const [hasLosersBracket, setHasLosersBracket] = useState(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");

  const isLeague = format === "LEAGUE";
  const isGroupKnockout = format === "GROUP_KNOCKOUT";
  const hasElimination = format !== "LEAGUE";

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createTournament({
      name,
      description,
      rules,
      prize,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      format,
      leagueLegs: isLeague ? leagueLegs : undefined,
      maxPlayers,
      platforms: selectedPlatforms,
      teamType,
      visibility,
      requiresVerification,
      registrationOpen: registrationOpen || undefined,
      registrationDeadline: registrationDeadline || undefined,
      startDate: startDate || undefined,
      matchTime: matchTime || undefined,
      difficulty: difficulty || undefined,
      controls: controls || undefined,
      gameMode: gameMode || undefined,
      stadium: stadium || undefined,
      groupCount: isGroupKnockout ? groupCount : undefined,
      qualifyPerGroup: isGroupKnockout ? qualifyPerGroup : undefined,
      knockoutSeeding: hasElimination ? knockoutSeeding : undefined,
      randomDrawUntil: hasElimination && knockoutSeeding === "RANDOM" ? randomDrawUntil : undefined,
      hasLosersBracket: hasElimination ? hasLosersBracket : undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setCreatedId(result.tournamentId!);
    setSuccess(true);
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Crear Torneo</h1>
          <p className="mt-1 text-foreground/60">
            Configurá tu torneo y empezá a recibir inscripciones
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Info básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Nombre del torneo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Copa Modo Fosa — Temporada 2"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describí el torneo..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Reglamento
                </label>
                <textarea
                  rows={3}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Reglas específicas del torneo..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Premio
                </label>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="Ej: $10.000 ARS + Badge exclusivo"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Logo (cuadrado) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">
                    Logo del torneo
                  </label>
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-light">
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1 text-[10px] text-red-400 hover:bg-background"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer rounded-lg border border-dashed border-surface-light px-3 py-2 text-sm text-foreground/50 transition-colors hover:border-accent hover:text-accent">
                      {logoUploading ? "Subiendo..." : logoUrl ? "Cambiar" : "🏆 Subir logo"}
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
                          else setError(result.error ?? "Error al subir logo");
                          setLogoUploading(false);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-foreground/40">Cuadrado. JPG/PNG/WebP. Max 5MB.</p>
                </div>

                {/* Banner (panorámico) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">
                    Banner del torneo
                  </label>
                  <div className="flex items-center gap-3">
                    {bannerUrl && (
                      <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-surface-light">
                        <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBannerUrl("")}
                          className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1 text-[10px] text-red-400 hover:bg-background"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer rounded-lg border border-dashed border-surface-light px-3 py-2 text-sm text-foreground/50 transition-colors hover:border-accent hover:text-accent">
                      {bannerUploading ? "Subiendo..." : bannerUrl ? "Cambiar" : "🖼️ Subir banner"}
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
                          else setError(result.error ?? "Error al subir banner");
                          setBannerUploading(false);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-foreground/40">Panorámico (ej. 1200×400). Max 5MB.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Formato */}
          <Card>
            <CardHeader>
              <CardTitle>Formato del torneo</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      format === f.value
                        ? "border-accent bg-accent/10"
                        : "border-surface-light hover:border-accent/50"
                    }`}
                  >
                    <p className={`text-sm font-bold ${format === f.value ? "text-accent" : ""}`}>
                      {f.label}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/50">{f.description}</p>
                  </button>
                ))}
              </div>

              {isLeague && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">
                    Cantidad de vueltas
                  </label>
                  <div className="flex gap-3">
                    {[1, 2].map((legs) => (
                      <button
                        key={legs}
                        type="button"
                        onClick={() => setLeagueLegs(legs)}
                        className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                          leagueLegs === legs
                            ? "border-accent text-accent"
                            : "border-surface-light hover:border-accent hover:text-accent"
                        }`}
                      >
                        {legs === 1 ? "Una vuelta" : "Ida y vuelta"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isGroupKnockout && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">
                      Cantidad de grupos
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={16}
                      value={groupCount}
                      onChange={(e) => setGroupCount(parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">
                      Clasifican por grupo
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={qualifyPerGroup}
                      onChange={(e) => setQualifyPerGroup(parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {hasElimination && (
                <div className="space-y-4 rounded-lg border border-surface-light p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/70">
                      Enfrentamientos en playoff
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setKnockoutSeeding("RANDOM")}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          knockoutSeeding === "RANDOM"
                            ? "border-accent bg-accent/10"
                            : "border-surface-light hover:border-accent/50"
                        }`}
                      >
                        <p className={`text-sm font-bold ${knockoutSeeding === "RANDOM" ? "text-accent" : ""}`}>
                          Sorteo / Azar
                        </p>
                        <p className="mt-0.5 text-xs text-foreground/50">
                          Cruces se arman aleatoriamente
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKnockoutSeeding("TRADITIONAL")}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          knockoutSeeding === "TRADITIONAL"
                            ? "border-accent bg-accent/10"
                            : "border-surface-light hover:border-accent/50"
                        }`}
                      >
                        <p className={`text-sm font-bold ${knockoutSeeding === "TRADITIONAL" ? "text-accent" : ""}`}>
                          Tradicional
                        </p>
                        <p className="mt-0.5 text-xs text-foreground/50">
                          1ro Grupo A vs 2do Grupo B, etc.
                        </p>
                      </button>
                    </div>
                  </div>

                  {knockoutSeeding === "RANDOM" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground/70">
                        Sorteo aplica hasta
                      </label>
                      <p className="mb-2 text-xs text-foreground/40">
                        En cada ronda se re-sortean los cruces hasta la etapa elegida. Después, bracket fijo.
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {([
                          { value: "INITIAL_ONLY", label: "Solo inicial", desc: "Bracket fijo desde R1" },
                          { value: "QUARTERFINALS", label: "Hasta cuartos", desc: "Sorteo hasta cuartos" },
                          { value: "SEMIFINALS", label: "Hasta semis", desc: "Sorteo hasta semis" },
                          { value: "FINAL", label: "Toda la llave", desc: "Sorteo cada ronda" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRandomDrawUntil(opt.value)}
                            className={`rounded-lg border p-2 text-center transition-colors ${
                              randomDrawUntil === opt.value
                                ? "border-accent bg-accent/10"
                                : "border-surface-light hover:border-accent/50"
                            }`}
                          >
                            <p className={`text-xs font-bold ${randomDrawUntil === opt.value ? "text-accent" : ""}`}>
                              {opt.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-foreground/40">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {format !== "DOUBLE_ELIMINATION" && (
                    <label className="flex items-center gap-3 rounded-lg border border-surface-light p-3">
                      <input
                        type="checkbox"
                        checked={hasLosersBracket}
                        onChange={(e) => setHasLosersBracket(e.target.checked)}
                        className="h-4 w-4 accent-accent"
                      />
                      <div>
                        <p className="text-sm font-medium">Llave de perdedores (repechaje)</p>
                        <p className="text-xs text-foreground/50">
                          Los eliminados pasan a un bracket secundario. Se necesitan 2 derrotas para quedar afuera.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Cantidad de participantes *
                </label>
                <input
                  type="number"
                  required
                  min={2}
                  max={128}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className={`${inputClass} sm:max-w-[200px]`}
                />
                <p className="mt-1 text-xs text-foreground/40">
                  {isLeague ? "Mínimo 2" : "Mínimo 2. Potencias de 2 recomendadas (8, 16, 32, 64)"}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground/70">
                  Plataformas *
                </label>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePlatform(p.value)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
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

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground/70">
                  Tipo de equipos *
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TEAM_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTeamType(t.value)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        teamType === t.value
                          ? "border-accent bg-accent/10"
                          : "border-surface-light hover:border-accent/50"
                      }`}
                    >
                      <p className={`text-sm font-bold ${teamType === t.value ? "text-accent" : ""}`}>
                        {t.label}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground/50">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Apertura inscripciones
                </label>
                <input
                  type="datetime-local"
                  value={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Cierre inscripciones
                </label>
                <input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Inicio del torneo
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          {/* Visibilidad */}
          <Card>
            <CardHeader>
              <CardTitle>Visibilidad</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {VISIBILITY_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVisibility(v.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      visibility === v.value
                        ? "border-accent bg-accent/10"
                        : "border-surface-light hover:border-accent/50"
                    }`}
                  >
                    <p className={`text-sm font-bold ${visibility === v.value ? "text-accent" : ""}`}>
                      {v.label}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/50">{v.description}</p>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-surface-light p-3">
                <input
                  type="checkbox"
                  checked={requiresVerification}
                  onChange={(e) => setRequiresVerification(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                <div>
                  <p className="text-sm font-medium">Requiere verificación de participante</p>
                  <p className="text-xs text-foreground/50">Los inscriptos deben ser aprobados manualmente</p>
                </div>
              </label>
            </div>
          </Card>

          {/* Reglas de juego */}
          <Card>
            <CardHeader>
              <CardTitle>Reglas de juego</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Tiempo de partido
                </label>
                <select
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className={inputClass}
                >
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
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Dificultad
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Cualquiera</option>
                  <option value="Profesional">Profesional</option>
                  <option value="Clase Mundial">Clase Mundial</option>
                  <option value="Leyenda">Leyenda</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Controles
                </label>
                <select
                  value={controls}
                  onChange={(e) => setControls(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Cualquiera</option>
                  <option value="Clásico">Clásico</option>
                  <option value="Alternativo">Alternativo</option>
                  <option value="Competitivo">Competitivo</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Modo de juego
                </label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className={inputClass}
                >
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
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Estadio
                </label>
                <input
                  type="text"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  placeholder="Cualquiera / A definir"
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creando torneo..." : "Crear Torneo"}
          </button>
        </form>

        {/* Success modal */}
        {success && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="max-w-md text-center">
              <span className="mb-4 block text-5xl">🏆</span>
              <h2 className="mb-2 text-xl font-bold">¡Torneo creado!</h2>
              <p className="mb-6 text-sm text-foreground/60">
                Tu torneo fue creado exitosamente. Compartí el link para que se inscriban los jugadores.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/torneos/${createdId}`)}
                  className="flex-1 rounded-lg bg-accent py-2.5 font-bold text-background"
                >
                  Ir al torneo
                </button>
                <button
                  onClick={() => router.push("/torneos")}
                  className="rounded-lg border border-surface-light px-4 py-2.5 text-sm text-foreground/70"
                >
                  Ver todos
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
