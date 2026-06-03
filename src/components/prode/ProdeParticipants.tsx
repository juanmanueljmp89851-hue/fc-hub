"use client";

import { useState } from "react";
import Image from "next/image";
import { setParticipantRole } from "@/lib/actions/prode";

interface Participant {
  id: string;
  userId: string;
  role: string;
  user: { id: string; username: string; avatarUrl: string | null };
}

interface Props {
  prodeId: string;
  createdById: string;
  participants: Participant[];
  isCreator: boolean;
}

export function ProdeParticipants({ prodeId, createdById, participants, isCreator }: Props) {
  const [parts, setParts] = useState(participants);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    setLoading(userId);

    const result = await setParticipantRole(prodeId, userId, newRole as "ADMIN" | "MEMBER");
    if (result.success) {
      setParts((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, role: newRole } : p))
      );
    }
    setLoading(null);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {parts.map((p) => {
        const isOwner = p.userId === createdById;
        const isAdmin = p.role === "ADMIN";

        return (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2"
          >
            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface">
              {p.user.avatarUrl ? (
                <Image src={p.user.avatarUrl} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">👤</div>
              )}
            </div>
            <span className="min-w-0 truncate text-sm">{p.user.username}</span>

            {/* Role badges */}
            {isOwner && (
              <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold" title="Creador">
                👑
              </span>
            )}
            {isAdmin && !isOwner && (
              <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent" title="Admin">
                ⭐
              </span>
            )}

            {/* Promote/demote button — only creator can do this */}
            {isCreator && !isOwner && (
              <button
                onClick={() => toggleRole(p.userId, p.role)}
                disabled={loading === p.userId}
                className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] text-foreground/40 transition-colors hover:bg-surface-light hover:text-accent"
                title={isAdmin ? "Quitar admin" : "Hacer admin"}
              >
                {loading === p.userId ? "..." : isAdmin ? "Quitar" : "Admin"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
