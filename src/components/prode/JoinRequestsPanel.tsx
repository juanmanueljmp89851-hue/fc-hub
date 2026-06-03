"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getJoinRequests, resolveJoinRequest } from "@/lib/actions/prode";

interface JoinRequest {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
  resolvedBy: { username: string } | null;
}

export function JoinRequestsPanel({ prodeId }: { prodeId: string }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getJoinRequests(prodeId);
      setRequests(data as unknown as JoinRequest[]);
      setLoading(false);
    }
    load();
  }, [prodeId]);

  async function handleResolve(requestId: string, action: "ACCEPTED" | "REJECTED") {
    setActionLoading(requestId);
    const result = await resolveJoinRequest(requestId, action);
    if (result.success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: action } : r)),
      );
    }
    setActionLoading(null);
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const resolved = requests.filter((r) => r.status !== "PENDING");

  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl bg-surface" />;
  }

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <>
          <h4 className="text-sm font-bold text-foreground/70">
            Solicitudes pendientes ({pending.length})
          </h4>
          {pending.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-surface">
                  {req.user.avatarUrl ? (
                    <Image src={req.user.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-foreground/30">
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{req.user.username}</p>
                  <p className="text-xs text-foreground/40">
                    {new Date(req.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve(req.id, "ACCEPTED")}
                  disabled={actionLoading === req.id}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleResolve(req.id, "REJECTED")}
                  disabled={actionLoading === req.id}
                  className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-opacity hover:bg-red-400/10 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {resolved.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-foreground/40 hover:text-foreground/60">
            {resolved.length} solicitudes resueltas
          </summary>
          <div className="mt-2 space-y-1">
            {resolved.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg bg-surface/30 px-3 py-2"
              >
                <span className="text-foreground/60">{req.user.username}</span>
                <span
                  className={`text-xs font-medium ${
                    req.status === "ACCEPTED" ? "text-accent" : "text-red-400"
                  }`}
                >
                  {req.status === "ACCEPTED" ? "Aceptado" : "Rechazado"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
