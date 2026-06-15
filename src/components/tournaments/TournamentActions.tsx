"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinTournament, joinTournamentAsTeam, leaveTournament, startTournament } from "@/lib/actions/tournament";
import { getMyTeams } from "@/lib/actions/team";
import { getCurrentUser } from "@/lib/actions/user";

interface TournamentActionsProps {
  tournamentId: string;
  status: string;
  createdById: string;
  participants: { userId: string; teamId?: string | null; status: string }[];
  maxPlayers: number;
  teamType: string;
}

export function TournamentActions({
  tournamentId,
  status,
  createdById,
  participants,
  maxPlayers,
  teamType,
}: TournamentActionsProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isDT, setIsDT] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [myTeams, setMyTeams] = useState<{ id: string; name: string; mode: string; managerId: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  const isTeamTournament = teamType === "CLUBS_PRO" || teamType === "RUSH";

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        setIsDT(user.isDT);
        if (isTeamTournament) {
          const teams = await getMyTeams();
          const managed = teams.filter((t: { managerId: string; mode: string }) => t.managerId === user.id && t.mode === teamType);
          setMyTeams(managed);
          if (managed.length === 1) setSelectedTeam(managed[0].id);
        }
      }
    }
    load();
  }, [isTeamTournament, teamType]);

  const isOrganizer = userId === createdById;
  const isRegistered = isTeamTournament
    ? myTeams.some((t) => participants.some((p) => p.teamId === t.id))
    : participants.some((p) => p.userId === userId);
  const confirmedCount = participants.filter((p) => p.status === "CONFIRMED").length;
  const isFull = confirmedCount >= maxPlayers;

  async function handleJoin() {
    setLoading(true);
    setMessage("");
    if (isTeamTournament) {
      if (!selectedTeam) {
        setMessage("Seleccioná un equipo");
        setLoading(false);
        return;
      }
      const result = await joinTournamentAsTeam(tournamentId, selectedTeam);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(result.status === "PENDING" ? "Inscripción pendiente de aprobación" : "¡Equipo inscripto!");
        router.refresh();
      }
    } else {
      const result = await joinTournament(tournamentId);
      if (result.error) {
        setMessage(result.error);
      } else if (result.waitlisted) {
        setMessage("Estás en lista de espera. Te avisamos cuando se libere un cupo.");
      } else {
        setMessage(result.status === "PENDING" ? "Inscripción pendiente de aprobación" : "¡Te inscribiste correctamente!");
        router.refresh();
      }
    }
    setLoading(false);
  }

  async function handleLeave() {
    setLoading(true);
    setMessage("");
    const result = await leaveTournament(tournamentId);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Cancelaste tu inscripción");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleStart() {
    setLoading(true);
    setMessage("");
    const result = await startTournament(tournamentId);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("¡Torneo iniciado!");
      router.refresh();
    }
    setLoading(false);
  }

  if (!userId) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === "REGISTRATION" && (
        <>
          {isRegistered ? (
            <button
              onClick={handleLeave}
              disabled={loading || isOrganizer}
              className="rounded-lg border border-red-500/50 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              {loading ? "Cancelando..." : "Cancelar inscripción"}
            </button>
          ) : (
            <>
              {isTeamTournament && isDT && myTeams.length > 1 && (
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="rounded-lg border border-surface-light bg-surface px-3 py-2.5 text-sm"
                >
                  <option value="">Seleccionar equipo</option>
                  {myTeams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              {isTeamTournament && !isDT ? (
                <p className="text-sm text-foreground/50">Solo el DT puede inscribir al equipo</p>
              ) : isTeamTournament && myTeams.length === 0 ? (
                <p className="text-sm text-foreground/50">No tenés equipos de {teamType === "CLUBS_PRO" ? "Clubes Pro" : "Rush"}</p>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Inscribiendo..." : isFull ? "Lista de espera" : isTeamTournament ? "Inscribir equipo" : "Inscribirme"}
                </button>
              )}
            </>
          )}

          {isOrganizer && confirmedCount >= 2 && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="rounded-lg bg-gold px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Iniciando..." : "Iniciar Torneo"}
            </button>
          )}
        </>
      )}

      {message && (
        <p className={`text-sm ${message.includes("error") || message.includes("Error") || message.includes("no") || message.includes("Necesitás") || message.includes("Solo") ? "text-red-400" : "text-accent"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
