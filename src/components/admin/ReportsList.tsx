"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveReport } from "@/lib/actions/report";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  reporter: { id: string; username: string; avatarUrl: string | null };
  reported: { id: string; username: string; avatarUrl: string | null; banned: boolean };
  resolvedBy: { id: string; username: string } | null;
}

function UserBadge({ user }: { user: { username: string; avatarUrl: string | null } }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface-light">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">👤</span>
        )}
      </div>
      <span className="text-sm font-semibold">{user.username}</span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  REVIEWED: "bg-blue-500/20 text-blue-400",
  ACTIONED: "bg-red-500/20 text-red-400",
  DISMISSED: "bg-foreground/10 text-foreground/40",
};

export function ReportsList({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [resolving, setResolving] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function handleResolve(id: string, status: "REVIEWED" | "ACTIONED" | "DISMISSED") {
    setResolving(id);
    await resolveReport(id, status, note);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, resolutionNote: note || null, resolvedAt: new Date() } : r))
    );
    setResolving(null);
    setNote("");
  }

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <p className="py-12 text-center text-foreground/40">Sin reportes</p>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="rounded-xl border border-surface-light bg-surface p-4">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <UserBadge user={report.reporter} />
              <span className="text-xs text-foreground/30">reportó a</span>
              <UserBadge user={report.reported} />
              {report.reported.banned && (
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">BANEADO</span>
              )}
              <span className={`ml-auto rounded px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[report.status] ?? ""}`}>
                {report.status}
              </span>
            </div>

            <div className="mb-2 rounded-lg bg-surface-light/50 px-3 py-2">
              <p className="text-xs font-semibold text-foreground/60">Motivo: {report.reason}</p>
              {report.description && (
                <p className="mt-1 text-xs text-foreground/50">{report.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-foreground/30">
              <span>{new Date(report.createdAt).toLocaleString("es-AR")}</span>
              {report.resolvedBy && (
                <span>• Resuelto por {report.resolvedBy.username}</span>
              )}
            </div>

            {report.status === "PENDING" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={resolving === report.id ? note : ""}
                  onChange={(e) => { setResolving(report.id); setNote(e.target.value); }}
                  className="flex-1 rounded-lg border border-surface-light bg-background px-2 py-1 text-xs focus:border-accent focus:outline-none"
                />
                <button
                  onClick={() => handleResolve(report.id, "REVIEWED")}
                  disabled={resolving === report.id}
                  className="rounded bg-blue-500/20 px-2 py-1 text-[10px] font-bold text-blue-400 hover:bg-blue-500/30"
                >
                  Revisado
                </button>
                <button
                  onClick={() => handleResolve(report.id, "ACTIONED")}
                  disabled={resolving === report.id}
                  className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/30"
                >
                  Accionar
                </button>
                <button
                  onClick={() => handleResolve(report.id, "DISMISSED")}
                  disabled={resolving === report.id}
                  className="rounded bg-foreground/10 px-2 py-1 text-[10px] font-bold text-foreground/40 hover:bg-foreground/20"
                >
                  Descartar
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
