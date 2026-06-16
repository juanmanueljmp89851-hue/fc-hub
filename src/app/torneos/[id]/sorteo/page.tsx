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
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

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

  function handleClearAll() {
    setSeeds([]);
    setBracketOrder([]);
    if (isGroupKnockout) initGroups();
    if (isLeague) initMatchdays();
  }

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

    if (mode === "SEEDED" && isGroupKnockout && seeds.length > tournament!.groupCount) {
      setError(`Tenés ${seeds.length} seeds pero solo ${tournament!.groupCount} grupos. Máximo ${tournament!.groupCount} seeds para que no caigan dos en el mismo grupo.`);
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

  function handleDropOnGroup(groupLabel: string) {
    if (draggedPlayer) {
      addToGroup(groupLabel, draggedPlayer);
      setDraggedPlayer(null);
    }
  }

  function addToBracket(playerId: string) {
    setBracketOrder((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  }

  function autoFillLeague() {
    const n = participants.length;
    const ids = participants.map((p) => p.id);
    const isOdd = n % 2 !== 0;
    const list = isOdd ? [...ids, "BYE"] : [...ids];
    const total = list.length;
    const rounds = total - 1;
    const half = total / 2;

    const mds: { matchday: number; matches: { p1: string; p2: string }[] }[] = [];

    for (let r = 0; r < rounds; r++) {
      const dayMatches: { p1: string; p2: string }[] = [];
      for (let i = 0; i < half; i++) {
        const home = list[i];
        const away = list[total - 1 - i];
        if (home !== "BYE" && away !== "BYE") {
          dayMatches.push({ p1: home, p2: away });
        }
      }
      mds.push({ matchday: r + 1, matches: dayMatches });
      // rotate: fix first, rotate rest
      const last = list.pop()!;
      list.splice(1, 0, last);
    }

    setMatchdays(mds);
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

  const hasAnyData =
    seeds.length > 0 ||
    bracketOrder.length > 0 ||
    Object.values(groups).some((g) => g.length > 0) ||
    matchdays.some((md) => md.matches.length > 0);

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
              {isGroupKnockout && (
                <span className="ml-1 text-orange-400">
                  Máximo {tournament.groupCount} seeds ({tournament.groupCount} grupos).
                </span>
              )}
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
                  <ParticipantAvatar p={p} />
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
                  Sin asignar ({unassignedPlayers.length}) — arrastrá a un grupo o usá los botones
                </p>
                <div className="flex flex-wrap gap-2">
                  {unassignedPlayers.map((p) => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => setDraggedPlayer(p.id)}
                      onDragEnd={() => setDraggedPlayer(null)}
                      className="flex cursor-grab items-center gap-2 rounded-lg border border-surface-light bg-surface/30 px-3 py-2 text-sm active:cursor-grabbing"
                    >
                      <ParticipantAvatar p={p} size="sm" />
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
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnGroup(label)}
                  className={`rounded-xl border p-4 transition-colors ${
                    draggedPlayer
                      ? "border-accent/50 bg-accent/5"
                      : "border-surface-light bg-surface/30"
                  }`}
                >
                  <h3 className="mb-2 font-bold">Grupo {label} <span className="text-sm font-normal text-foreground/40">({playerIds.length})</span></h3>
                  {playerIds.length === 0 ? (
                    <p className="py-4 text-center text-sm text-foreground/40">
                      {draggedPlayer ? "Soltá acá" : "Vacío"}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {playerIds.map((id) => {
                        const p = getParticipant(id);
                        return (
                          <div
                            key={id}
                            draggable
                            onDragStart={() => setDraggedPlayer(id)}
                            onDragEnd={() => setDraggedPlayer(null)}
                            className="flex cursor-grab items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-2">
                              {p && <ParticipantAvatar p={p} size="sm" />}
                              <span>{p?.displayName}</span>
                            </div>
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
              enfrentan entre sí en R1 (1 vs 2, 3 vs 4, etc). Los no seleccionados se ubican al azar al final.
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
                    <ParticipantAvatar p={p} />
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

            {/* Bracket preview */}
            {bracketOrder.length >= 2 && (
              <BracketPreview
                bracketOrder={bracketOrder}
                allPlayers={participants}
                getParticipant={getParticipant}
              />
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
            onAutoFill={autoFillLeague}
          />
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "Generando partidos..." : "Confirmar y comenzar"}
          </button>
          {hasAnyData && (
            <button
              onClick={handleClearAll}
              className="rounded-lg border border-red-500/30 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              Limpiar todo
            </button>
          )}
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

function ParticipantAvatar({ p, size = "md" }: { p: Participant; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-6 w-6 rounded text-[10px]" : "h-8 w-8 rounded-lg text-xs";
  if (p.teamLogoUrl || p.avatarUrl) {
    return <img src={p.teamLogoUrl ?? p.avatarUrl ?? ""} alt="" className={`${cls} object-cover`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-surface ${cls}`}>
      {p.displayName[0]}
    </div>
  );
}

function BracketPreview({
  bracketOrder,
  allPlayers,
  getParticipant,
}: {
  bracketOrder: string[];
  allPlayers: Participant[];
  getParticipant: (id: string) => Participant | undefined;
}) {
  const ordered = [...bracketOrder];
  const unordered = allPlayers.filter((p) => !bracketOrder.includes(p.id));
  const full = [...ordered, ...unordered.map((p) => p.id)];
  const totalRounds = Math.ceil(Math.log2(full.length));
  const bracketSize = Math.pow(2, totalRounds);

  const r1Matches: { p1: string | null; p2: string | null }[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    r1Matches.push({
      p1: full[i * 2] ?? null,
      p2: full[i * 2 + 1] ?? null,
    });
  }

  const r2Winners: (string | null)[] = r1Matches.map((m) => {
    if (!m.p1 && !m.p2) return null;
    if (!m.p1) return m.p2;
    if (!m.p2) return m.p1;
    return null; // undecided
  });

  const getName = (id: string | null) => {
    if (!id) return "—";
    const p = getParticipant(id);
    return p?.displayName ?? "?";
  };

  return (
    <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
      <h3 className="mb-3 text-sm font-medium text-foreground/60">Preview bracket</h3>
      <div className="flex gap-8 overflow-x-auto pb-2">
        {/* R1 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground/40">Ronda 1</p>
          {r1Matches.map((m, i) => (
            <div key={i} className="flex flex-col rounded-lg border border-surface-light bg-background/50 text-xs">
              <div className={`px-3 py-1.5 ${!m.p2 ? "font-bold text-accent" : ""}`}>
                {getName(m.p1)}
              </div>
              <div className="border-t border-surface-light" />
              <div className={`px-3 py-1.5 ${!m.p1 ? "font-bold text-accent" : ""}`}>
                {getName(m.p2)}
              </div>
            </div>
          ))}
        </div>

        {/* R2 */}
        {totalRounds >= 2 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/40">
              {totalRounds === 2 ? "Final" : totalRounds === 3 ? "Semifinal" : "Ronda 2"}
            </p>
            {Array.from({ length: Math.ceil(r2Winners.length / 2) }, (_, i) => (
              <div key={i} className="flex flex-col rounded-lg border border-surface-light bg-background/50 text-xs">
                <div className="px-3 py-1.5 text-foreground/50">
                  {r2Winners[i * 2] ? getName(r2Winners[i * 2]) : `G M${i * 2 + 1}`}
                </div>
                <div className="border-t border-surface-light" />
                <div className="px-3 py-1.5 text-foreground/50">
                  {r2Winners[i * 2 + 1] ? getName(r2Winners[i * 2 + 1]) : `G M${i * 2 + 2}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  onAutoFill,
}: {
  participants: Participant[];
  matchdays: { matchday: number; matches: { p1: string; p2: string }[] }[];
  allScheduledPairs: Set<string>;
  addMatchToDay: (dayIndex: number, p1: string, p2: string) => void;
  removeMatchFromDay: (dayIndex: number, matchIndex: number) => void;
  getParticipant: (id: string) => Participant | undefined;
  onAutoFill: () => void;
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

  const totalMatches = matchdays.reduce((sum, md) => sum + md.matches.length, 0);
  const expected = (participants.length * (participants.length - 1)) / 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/60">
          Armá los partidos de cada jornada. Cada par de participantes debe jugar exactamente una vez.
        </p>
        <button
          onClick={onAutoFill}
          className="shrink-0 rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          Auto-rellenar
        </button>
      </div>

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
        Partidos armados: {totalMatches} / {expected}
        {totalMatches === expected && (
          <span className="ml-2 text-accent">✓ Completo</span>
        )}
      </div>
    </div>
  );
}
