"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { acceptParticipant, rejectParticipant } from "@/lib/actions/tournament";

interface PendingParticipant {
  id: string;
  userId: string;
  user: {
    username: string;
    avatarUrl: string | null;
  };
  joinedAt: string;
}

interface PendingParticipantsProps {
  tournamentId: string;
  participants: PendingParticipant[];
}

export function PendingParticipants({ tournamentId, participants }: PendingParticipantsProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (participants.length === 0) return null;

  async function handleAccept(userId: string) {
    setLoadingId(userId);
    setMessage("");
    const result = await acceptParticipant(tournamentId, userId);
    if (result.error) {
      setMessage(result.error);
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  async function handleReject(userId: string) {
    setLoadingId(userId);
    setMessage("");
    const result = await rejectParticipant(tournamentId, userId);
    if (result.error) {
      setMessage(result.error);
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  function handleAcceptAll() {
    participants.forEach((p) => handleAccept(p.userId));
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gold">
          Solicitudes pendientes ({participants.length})
        </h3>
        {participants.length > 1 && (
          <button
            onClick={handleAcceptAll}
            className="rounded-lg bg-accent/20 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
          >
            Aceptar todas
          </button>
        )}
      </div>

      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg bg-background/50 px-3 py-2"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-surface">
              {p.user.avatarUrl ? (
                <Image src={p.user.avatarUrl} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-foreground/30">
                  👤
                </div>
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">
                {p.user.username}
              </span>
              <span className="ml-2 text-xs text-foreground/40">
                {new Date(p.joinedAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(p.userId)}
                disabled={loadingId === p.userId}
                className="rounded-lg bg-accent px-3 py-1 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loadingId === p.userId ? "..." : "Aceptar"}
              </button>
              <button
                onClick={() => handleReject(p.userId)}
                disabled={loadingId === p.userId}
                className="rounded-lg border border-red-500/50 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <p className="mt-2 text-xs text-red-400">{message}</p>
      )}
    </div>
  );
}
