"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinTournament } from "@/lib/actions/tournament";
import { getCurrentUser } from "@/lib/actions/user";

interface Props {
  tournamentId: string;
  status: string;
  createdById: string;
  currentPlayers: number;
  maxPlayers: number;
  requiresVerification: boolean;
}

export function TournamentCardJoin({ tournamentId, status, createdById, currentPlayers, maxPlayers, requiresVerification }: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getCurrentUser().then((u) => { if (u) setUserId(u.id); });
  }, []);

  if (status !== "REGISTRATION") return null;
  if (!userId) return null;
  if (userId === createdById) return null;

  const isFull = currentPlayers >= maxPlayers;

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setMessage("");
    const result = await joinTournament(tournamentId);
    if (result.error) {
      setMessage(result.error);
    } else if (result.waitlisted) {
      setMessage("En lista de espera");
    } else {
      setMessage(result.status === "PENDING" ? "Solicitud enviada ✓" : "¡Inscripto! ✓");
      router.refresh();
    }
    setLoading(false);
  }

  if (message) {
    return (
      <span className="text-xs font-medium text-accent">{message}</span>
    );
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "..." : isFull ? "Lista de espera" : requiresVerification ? "Solicitar inscripción" : "Inscribirme"}
    </button>
  );
}
