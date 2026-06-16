"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getDrawData, confirmDraw } from "@/lib/actions/tournament";

interface Participant {
  id: string;
  username: string;
  avatarUrl: string | null;
  teamId: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
  displayName: string;
}

interface TournamentInfo {
  id: string;
  name: string;
  format: string;
  status: string;
  groupCount: number;
  qualifyPerGroup: number;
  hasLosersBracket: boolean;
  knockoutFormat: string;
  leagueLegs: number;
  isTeamTournament: boolean;
}

type DrawMode = "RANDOM" | "SEEDED" | "MANUAL" | "MATCHDAY";

export default function SorteoPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState<DrawMode>("RANDOM");
  const [seeds, setSeeds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [bracketOrder, setBracketOrder] = useState<string[]>([]);
  const [matchdays, setMatchdays] = useState<{ matchday: number; matches: { p1: string; p2: string }[] }[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getDrawData(tournamentId);
      if (!data) {
        router.push(`/torneos/${tournamentId}`);
        return;
      }
      if (data.tournament.status !== "SETUP") {
        router.push(`/torneos/${tournamentId}`);
        return;
      }
      setTournament(data.tournament);
      setParticipants(data.participants);
      setLoading(false);
    }
    load();
  }, [tournamentId, router]);

  const isElim = tournament?.format === "SINGLE_ELIMINATION" || tournament?.format === "DOUBLE_ELIMINATION";
  const isGroupKnockout = tournament?.format === "GROUP_KNOCKOUT";
  const isLeague = tournament?.format === "LEAGUE";

  const availableModes: { value: DrawMode; label: string; desc: string }[] = [];
  if (tournament) {
    availableModes.push({ value: "RANDOM", label: "Sorteo al azar", desc: "Todo se genera automáticamente" });
    if (isGroupKnockout || isElim) {
      availableModes.push({ value: "SEEDED", label: "Cabeza de serie", desc: "Marcás los seeds, el resto al azar" });
    }
    if (isGroupKnockout) {
      availableModes.push({ value: "MANUAL", label: "Grupos manual", desc: "Armás los grupos vos" });
    }
    if (isElim) {
      availableModes.push({ value: "MANUAL", label: "Bracket manual", desc: "Colocás cada jugador en el bracket" });
    }
    if (isLeague) {
      availableModes.push({ value: "MATCHDAY", label: "Fecha por fecha", desc: "Armás cada jornada manualmente" });
    }
  }

  const initGroups = useCallback(() => {
    if (!tournament) return;
    const labels = "ABCDEFGHIJKLMNOP";
    const g: Record<string, string[]> = {};
    for (let i = 0; i < tournament.groupCount; i++) {
      g[labels[i]] = [];
    }
    setGroups(g);
  }, [tournament]);

  const initMatchdays = useCallback(() => {
    if (!tournament) return;
    const n = participants.length;
    const totalMatchdays = n % 2 === 0 ? n - 1 : n;
    const mds: { matchday: number; matches: { p1: string; p2: string }[] }[] = [];
    for (let d = 1; d <= totalMatchdays; d++) {
      mds.push({ matchday: d, matches: [] });
    }
    setMatchdays(mds);
  }, [tournament, participants]);

  useEffect(() => {
    if (mode === "MANUAL" && isGroupKnockout) initGroups();
    if (mode === "MATCHDAY") initMatchdays();
  }, [mode, isGroupKnockout, initGroups, initMatchdays]);

  async function handleConfirm() {
    setConfirming(true);
    setError("");

    const config: {
      mode: DrawMode;
      seeds?: string[];
      groups?: Record<string, string[]>;
      bracket?: string[];
      matchdays?: { matchday: number; matches: { p1: string; p2: string }[] }[];
    } = { mode };

    if (mode === "SEEDED") config.seeds = seeds;
    if (mode === "MANUAL" && isGroupKnockout) config.groups = groups;
    if (mode === "MANUAL" && isElim) config.bracket = bracketOrder;
    if (mode === "MATCHDAY") config.matchdays = matchdays;

    if (mode === "SEEDED" && seeds.length === 0) {
      setError("Seleccioná al menos un cabeza de serie");
      setConfirming(false);
      return;
    }

    if (mode === "MANUAL" && isGroupKnockout) {
      const assigned = Object.values(groups).flat();
      if (assigned.length < participants.length) {
        setError(`Faltan ${participants.length - assigned.length} participantes por asignar a un grupo`);
        setConfirming(false);
        return;
      }
    }

    if (mode === "MANUAL" && isElim && bracketOrder.length < 2) {
      setError("Colocá al menos 2 participantes en el bracket");
      setConfirming(false);
      return;
    }

    if (mode === "MATCHDAY") {
      const totalMatches = matchdays.reduce((sum, md) => sum + md.matches.length, 0);
      const expected = (participants.length * (participants.length - 1)) / 2;
      if (totalMatches < expected) {
        setError(`Faltan ${expected - totalMatches} partidos por armar (total esperado: ${expected})`);
        setConfirming(false);
        return;
      }
    }

    const result = await confirmDraw(tournamentId, config);
    if ("error" in result && result.error) {
      setError(result.error);
      setConfirming(false);
    } else {
      router.push(`/torneos/${tournamentId}`);
    }
  }

  function toggleSeed(id: string) {
    setSeeds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function addToGroup(groupLabel: string, playerId: string) {
    setGroups((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].filter((id) => id !== playerId);
      }
      updated[groupLabel] = [...updated[groupLabel], playerId];
      return updated;
    });
  }

  function removeFromGroup(groupLabel: string, playerId: string) {
    setGroups((prev) => ({
      ...prev,
      [groupLabel]: prev[groupLabel].filter((id) => id !== playerId),
    }));
  }

  function addToBracket(playerId: string) {
    setBracketOrder((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  }

  function addMatchToDay(dayIndex: number, p1: string, p2: string) {
    setMatchdays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        matches: [...updated[dayIndex].matches, { p1, p2 }],
      };
      return updated;
    });
  }

  function removeMatchFromDay(dayIndex: number, matchIndex: number) {
    setMatchdays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        matches: updated[dayIndex].matches.filter((_, i) => i !== matchIndex),
      };
      return updated;
    });
  }

  const getParticipant = (id: string) => participants.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-surface" />
            <div className="h-48 rounded-xl bg-surface" />
          </div>
        </main>
      </div>
    );
  }

  if (!tournament) return null;

  const assignedToGroups = new Set(Object.values(groups).flat());
  const unassignedPlayers = participants.filter((p) => !assignedToGroups.has(p.id));

  const allScheduledPairs = new Set(
    matchdays.flatMap((md) => md.matches.map((m) => [m.p1, m.p2].sort().join("-")))
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">{tournament.name}</h1>
        <p className="mb-6 text-foreground/60">Configurá el sorteo — {participants.length} participantes</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Mode selector */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableModes.map((m) => (
            <button
              key={m.value + m.label}
              onClick={() => setMode(m.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                mode === m.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-surface-light bg-surface/30 text-foreground/60 hover:border-accent/50"
              }`}
            >
              <p className="font-semibold">{m.label}</p>
              <p className="mt-1 text-xs opacity-70">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* RANDOM mode — just confirm */}
        {mode === "RANDOM" && (
          <div className="rounded-xl border border-surface-light bg-surface/30 p-6 text-center">
            <p className="text-lg font-medium">Sorteo automático</p>
            <p className="mt-2 text-foreground/60">
              Se generará todo al azar. Hacé clic en confirmar para comenzar.
            </p>
          </div>
        )}

        {/* SEEDED mode */}
        {mode === "SEEDED" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">
              Seleccioná los cabezas de serie (se distribuyen en grupos/brackets distintos). El resto va al azar.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleSeed(p.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    seeds.includes(p.id)
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-surface-light bg-surface/30 text-foreground/70 hover:border-accent/50"
                  }`}
                >
                  {p.teamLogoUrl || p.avatarUrl ? (
                    <img
                      src={p.teamLogoUrl ?? p.avatarUrl ?? ""}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-xs">
                      {p.displayName[0]}
                    </div>
                  )}
                  <span className="flex-1 font-medium">{p.displayName}</span>
                  {seeds.includes(p.id) && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
                      Seed #{seeds.indexOf(p.id) + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL groups mode (GROUP_KNOCKOUT) */}
        {mode === "MANUAL" && isGroupKnockout && (
          <div className="space-y-4">
            {/* Unassigned pool */}
            {unassignedPlayers.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground/60">
                  Sin asignar ({unassignedPlayers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {unassignedPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg border border-surface-light bg-surface/30 px-3 py-2 text-sm"
                    >
                      <span>{p.displayName}</span>
                      <div className="flex gap-1">
                        {Object.keys(groups).map((label) => (
                          <button
                            key={label}
                            onClick={() => addToGroup(label, p.id)}
                            className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-bold text-accent hover:bg-accent/30"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(groups).map(([label, playerIds]) => (
                <div
                  key={label}
                  className="rounded-xl border border-surface-light bg-surface/30 p-4"
                >
                  <h3 className="mb-2 font-bold">Grupo {label}</h3>
                  {playerIds.length === 0 ? (
                    <p className="text-sm text-foreground/40">Vacío</p>
                  ) : (
                    <div className="space-y-1">
                      {playerIds.map((id) => {
                        const p = getParticipant(id);
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm"
                          >
                            <span>{p?.displayName}</span>
                            <button
                              onClick={() => removeFromGroup(label, id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL bracket mode (SINGLE/DOUBLE_ELIMINATION) */}
        {mode === "MANUAL" && isElim && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">
              Seleccioná participantes en el orden que querés para el bracket. Los primeros se
              enfrentan entre sí en R1 (1 vs 2, 3 vs 4, etc).
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {participants.map((p) => {
                const pos = bracketOrder.indexOf(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToBracket(p.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      pos >= 0
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-surface-light bg-surface/30 text-foreground/70 hover:border-accent/50"
                    }`}
                  >
                    {p.teamLogoUrl || p.avatarUrl ? (
                      <img
                        src={p.teamLogoUrl ?? p.avatarUrl ?? ""}
                        alt=""
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-xs">
                        {p.displayName[0]}
                      </div>
                    )}
                    <span className="flex-1 font-medium">{p.displayName}</span>
                    {pos >= 0 && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                        #{pos + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {bracketOrder.length >= 2 && (
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <h3 className="mb-2 text-sm font-medium text-foreground/60">Preview enfrentamientos R1</h3>
                <div className="space-y-1">
                  {Array.from({ length: Math.floor(bracketOrder.length / 2) }, (_, i) => {
                    const p1 = getParticipant(bracketOrder[i * 2]);
                    const p2 = getParticipant(bracketOrder[i * 2 + 1]);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-foreground/40">M{i + 1}:</span>
                        <span className="font-medium">{p1?.displayName}</span>
                        <span className="text-foreground/40">vs</span>
                        <span className="font-medium">{p2?.displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATCHDAY mode (LEAGUE) */}
        {mode === "MATCHDAY" && (
          <MatchdayEditor
            participants={participants}
            matchdays={matchdays}
            allScheduledPairs={allScheduledPairs}
            addMatchToDay={addMatchToDay}
            removeMatchFromDay={removeMatchFromDay}
            getParticipant={getParticipant}
          />
        )}

        {/* Confirm */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "Generando partidos..." : "Confirmar y comenzar"}
          </button>
          <button
            onClick={() => router.push(`/torneos/${tournamentId}`)}
            className="rounded-lg border border-surface-light px-4 py-3 text-sm text-foreground/60 hover:border-accent hover:text-accent"
          >
            Cancelar
          </button>
        </div>
      </main>
    </div>
  );
}

function MatchdayEditor({
  participants,
  matchdays,
  allScheduledPairs,
  addMatchToDay,
  removeMatchFromDay,
  getParticipant,
}: {
  participants: Participant[];
  matchdays: { matchday: number; matches: { p1: string; p2: string }[] }[];
  allScheduledPairs: Set<string>;
  addMatchToDay: (dayIndex: number, p1: string, p2: string) => void;
  removeMatchFromDay: (dayIndex: number, matchIndex: number) => void;
  getParticipant: (id: string) => Participant | undefined;
}) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedP1, setSelectedP1] = useState("");
  const [selectedP2, setSelectedP2] = useState("");

  function handleAddMatch() {
    if (!selectedP1 || !selectedP2 || selectedP1 === selectedP2) return;
    addMatchToDay(activeDayIndex, selectedP1, selectedP2);
    setSelectedP1("");
    setSelectedP2("");
  }

  const isPairScheduled = (a: string, b: string) =>
    allScheduledPairs.has([a, b].sort().join("-"));

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/60">
        Armá los partidos de cada jornada. Cada par de participantes debe jugar exactamente una vez.
      </p>

      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {matchdays.map((md, i) => (
          <button
            key={md.matchday}
            onClick={() => setActiveDayIndex(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeDayIndex === i
                ? "bg-accent text-background"
                : "bg-surface/50 text-foreground/60 hover:bg-surface"
            }`}
          >
            J{md.matchday} ({md.matches.length})
          </button>
        ))}
      </div>

      {/* Active day */}
      <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
        <h3 className="mb-3 font-bold">Jornada {matchdays[activeDayIndex]?.matchday}</h3>

        {/* Existing matches */}
        <div className="mb-3 space-y-1">
          {matchdays[activeDayIndex]?.matches.map((m, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 text-sm">
              <span className="font-medium">{getParticipant(m.p1)?.displayName}</span>
              <span className="text-foreground/40">vs</span>
              <span className="font-medium">{getParticipant(m.p2)?.displayName}</span>
              <button
                onClick={() => removeMatchFromDay(activeDayIndex, i)}
                className="ml-auto text-xs text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          {matchdays[activeDayIndex]?.matches.length === 0 && (
            <p className="text-sm text-foreground/40">Sin partidos</p>
          )}
        </div>

        {/* Add match */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedP1}
            onChange={(e) => setSelectedP1(e.target.value)}
            className="rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
          >
            <option value="">Local</option>
            {participants
              .filter((p) => p.id !== selectedP2)
              .map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={selectedP2 ? isPairScheduled(p.id, selectedP2) : false}
                >
                  {p.displayName} {selectedP2 && isPairScheduled(p.id, selectedP2) ? "(ya juegan)" : ""}
                </option>
              ))}
          </select>
          <span className="text-foreground/40">vs</span>
          <select
            value={selectedP2}
            onChange={(e) => setSelectedP2(e.target.value)}
            className="rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
          >
            <option value="">Visitante</option>
            {participants
              .filter((p) => p.id !== selectedP1)
              .map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={selectedP1 ? isPairScheduled(p.id, selectedP1) : false}
                >
                  {p.displayName} {selectedP1 && isPairScheduled(p.id, selectedP1) ? "(ya juegan)" : ""}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddMatch}
            disabled={!selectedP1 || !selectedP2 || selectedP1 === selectedP2}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="text-sm text-foreground/60">
        Partidos armados: {matchdays.reduce((sum, md) => sum + md.matches.length, 0)} /{" "}
        {(participants.length * (participants.length - 1)) / 2}
      </div>
    </div>
  );
}
