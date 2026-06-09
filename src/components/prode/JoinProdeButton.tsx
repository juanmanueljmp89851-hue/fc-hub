"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJoinProde } from "@/lib/actions/prode";

interface JoinProdeButtonProps {
  prodeId: string;
  userStatus: "joined" | "pending" | "rejected" | "available" | "guest";
  isPrivate: boolean;
}

export function JoinProdeButton({ prodeId, userStatus, isPrivate }: JoinProdeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(userStatus);
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (status === "guest") {
      router.push("/auth/register");
      return;
    }

    if (status !== "available") return;

    setLoading(true);
    setMessage("");

    const result = await requestJoinProde(prodeId);

    if (result.error) {
      if (result.requireAuth) {
        router.push("/auth/register");
        return;
      }
      setMessage(result.error);
    } else if (result.pending) {
      setStatus("pending");
      setMessage("Solicitud enviada ✓");
    } else if (result.prodeId) {
      setStatus("joined");
      router.push(`/prode/${result.prodeId}`);
      return;
    }

    setLoading(false);
  }

  if (status === "joined") {
    return (
      <button
        onClick={() => router.push(`/prode/${prodeId}`)}
        className="w-full rounded-lg border border-accent/30 bg-accent/10 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/20"
      >
        Ver Prode →
      </button>
    );
  }

  if (status === "pending") {
    return (
      <div className="space-y-1">
        <button
          disabled
          className="w-full rounded-lg border border-gold/30 bg-gold/10 py-2 text-sm font-bold text-gold cursor-default"
        >
          ⏳ Solicitud pendiente
        </button>
        {message && <p className="text-xs text-accent text-center">{message}</p>}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <button
        disabled
        className="w-full rounded-lg border border-red-400/30 bg-red-400/10 py-2 text-sm font-bold text-red-400 cursor-default"
      >
        Solicitud rechazada
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg bg-accent py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Enviando..."
          : status === "guest"
            ? "Registrate para unirte"
            : isPrivate
              ? "Solicitar inscripción"
              : "Inscribirse"}
      </button>
      {message && <p className="text-xs text-red-400 text-center">{message}</p>}
    </div>
  );
}
