"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinTournament, leaveTournament, startTournament } from "@/lib/actions/tournament";
import { getCurrentUser } from "@/lib/actions/user";

interface TournamentActionsProps {
  tournamentId: string;
  status: string;
  createdById: string;
  participants: { userId: string; status: string }[];
  maxPlayers: number;
}

export function TournamentActions({
  tournamentId,
  status,
  createdById,
  participants,
  maxPlayers,
}: TournamentActionsProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);
    }
    load();
  }, []);

  const isOrganizer = userId === createdById;
  const isRegistered = participants.some((p) => p.userId === userId);
  const confirmedCount = participants.filter((p) => p.status === "CONFIRMED").length;
  const isFull = confirmedCount >= maxPlayers;

  async function handleJoin() {
    setLoading(true);
    setMessage("");
    const result = await joinTournament(tournamentId);
    if (result.error) {
      setMessage(result.error);
    } else if (result.waitlisted) {
      setMessage("Estás en lista de espera. Te avisamos cuando se libere un cupo.");
    } else {
      setMessage(result.status === "PENDING" ? "Inscripción pendiente de aprobación" : "¡Te inscribiste correctamente!");
      router.refresh();
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
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Inscribiendo..." : isFull ? "Lista de espera" : "Inscribirme"}
            </button>
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
        <p className={`text-sm ${message.includes("error") || message.includes("Error") || message.includes("no") ? "text-red-400" : "text-accent"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
