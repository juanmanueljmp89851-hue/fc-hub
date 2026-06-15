"use client";

import { useState } from "react";
import { blockUser, unblockUser } from "@/lib/actions/block";
import { reportUser } from "@/lib/actions/report";

export function DmActions({ partnerId, partnerUsername, isBlockedInitial }: {
  partnerId: string;
  partnerUsername: string;
  isBlockedInitial: boolean;
}) {
  const [blocked, setBlocked] = useState(isBlockedInitial);
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [error, setError] = useState("");

  async function handleBlock() {
    if (blocked) {
      await unblockUser(partnerId);
      setBlocked(false);
    } else {
      await blockUser(partnerId);
      setBlocked(true);
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setReporting(true);
    setError("");
    const result = await reportUser(partnerId, reason, description);
    if (result.error) {
      setError(result.error);
    } else {
      setReportSent(true);
      setShowReport(false);
    }
    setReporting(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleBlock}
        className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
          blocked
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-surface-light text-foreground/40 hover:text-red-400"
        }`}
      >
        {blocked ? "🚫 Desbloqueado" : "🚫 Bloquear"}
      </button>

      {!reportSent && (
        <button
          onClick={() => setShowReport(!showReport)}
          className="rounded-lg bg-surface-light px-2 py-1 text-[10px] font-semibold text-foreground/40 hover:text-yellow-400"
        >
          ⚠️ Reportar
        </button>
      )}
      {reportSent && (
        <span className="text-[10px] text-accent">Reporte enviado ✓</span>
      )}

      {showReport && (
        <form onSubmit={handleReport} className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-surface-light bg-surface p-3 shadow-xl">
          <p className="mb-2 text-xs font-bold">Reportar a {partnerUsername}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full rounded-lg border border-surface-light bg-background px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
          >
            <option value="">Seleccionar motivo...</option>
            <option value="Acoso">Acoso</option>
            <option value="Contenido inapropiado">Contenido inapropiado</option>
            <option value="Spam">Spam</option>
            <option value="Intento de estafa">Intento de estafa</option>
            <option value="Compartir datos personales">Compartir datos personales</option>
            <option value="Otro">Otro</option>
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="mb-2 w-full rounded-lg border border-surface-light bg-background px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
          />
          {error && <p className="mb-2 text-[10px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={reporting || !reason}
              className="rounded-lg bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50"
            >
              {reporting ? "..." : "Enviar reporte"}
            </button>
            <button
              type="button"
              onClick={() => setShowReport(false)}
              className="text-xs text-foreground/40 hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
