"use client";

import { useState, useEffect, useTransition } from "react";
import {
  createPeriod,
  updatePeriod,
  finalizePeriod,
  createPeriodPrize,
  invalidateBengala,
  invalidateReferral,
  updateBengalaConfig,
  getAmbassadorActivity,
  getAllPeriodsAdmin,
  getPeriodRanking,
  getConversionsAdmin,
  adminReviewConversion,
} from "@/lib/actions/ambassador";

const REASON_LABELS: Record<string, string> = {
  REFERRAL_ACTIVE: "Referido activo",
  REFERRAL_TOURNAMENT: "Referido participó en torneo",
  REFERRAL_PRODE: "Referido creó Prode",
  REFERRAL_ORGANIZED: "Referido organizó torneo",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Programado", color: "text-foreground/50" },
  ACTIVE: { label: "Activo", color: "text-accent" },
  COMPLETED: { label: "Finalizado", color: "text-gold" },
  CANCELLED: { label: "Cancelado", color: "text-red-400" },
};

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface DashboardData {
  totalAmbassadors: number;
  totalReferrals: number;
  activeReferrals: number;
  totalBengalas: number;
  periodsCount: number;
  activePeriodId: string | null;
  activePeriodName: string | null;
  recentActivity: {
    id: string;
    username: string;
    amount: number;
    reason: string;
    referredUsername: string | null;
    createdAt: string;
  }[];
  topAmbassadors: {
    user: { id: string; username: string; avatarUrl: string | null } | null;
    activeReferrals: number;
    totalReferrals: number;
    totalBengalas: number;
  }[];
}

const CONVERSION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "text-foreground/50" },
  VALIDATED: { label: "Validada", color: "text-accent" },
  UNDER_REVIEW: { label: "En revisión", color: "text-yellow-400" },
  INVALIDATED: { label: "Invalidada", color: "text-red-400" },
};

const CONVERSION_RULE_LABELS: Record<string, string> = {
  DUELS_5_USERS_3: "5 duelos / 3 oponentes",
  TOURNAMENT_PARTICIPATION: "Participó en torneo + 1 partido",
  TOURNAMENT_CREATOR_5P_2M: "Creó torneo + 5 part. + 2 partidos",
  PRODE_CREATOR_5P: "Creó Prode + 5 participantes",
  LEGACY: "Migración anterior",
};

type TabKey = "periodos" | "conversiones" | "activity" | "ranking" | "config";

export function AdminAmbassadorPanel({ dashboard }: { dashboard: DashboardData }) {
  const [tab, setTab] = useState<TabKey>("periodos");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "periodos", label: "Períodos" },
    { key: "conversiones", label: "Conversiones" },
    { key: "activity", label: "Actividad" },
    { key: "ranking", label: "Embajadores" },
    { key: "config", label: "Config" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto border-b border-surface-light pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.key
                ? "border-b-2 border-accent bg-accent/10 text-accent"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "periodos" && <PeriodsTab />}
      {tab === "conversiones" && <ConversionsTab />}
      {tab === "activity" && <ActivityTab activity={dashboard.recentActivity} />}
      {tab === "ranking" && <RankingTab ambassadors={dashboard.topAmbassadors} />}
      {tab === "config" && <ConfigTab />}
    </div>
  );
}

// ─── PERÍODOS ──────────────────────────────────────────────

function PeriodsTab() {
  const [periods, setPeriods] = useState<Awaited<ReturnType<typeof getAllPeriodsAdmin>>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAllPeriodsAdmin().then((p) => {
      setPeriods(p);
      setLoading(false);
    });
  }, []);

  async function handleActivate(id: string) {
    if (!confirm("¿Activar este período? Solo puede haber uno activo.")) return;
    startTransition(async () => {
      const res = await updatePeriod(id, { status: "ACTIVE" });
      if ("error" in res) { alert(res.error); return; }
      const refreshed = await getAllPeriodsAdmin();
      setPeriods(refreshed);
    });
  }

  async function handleFinalize(id: string) {
    if (!confirm("¿Finalizar este período? Se determinarán los ganadores por ranking.")) return;
    startTransition(async () => {
      const res = await finalizePeriod(id);
      if ("error" in res) { alert(res.error); return; }
      alert("Período finalizado. Ganadores registrados.");
      const refreshed = await getAllPeriodsAdmin();
      setPeriods(refreshed);
    });
  }

  async function handleCancel(id: string) {
    if (!confirm("¿Cancelar este período? No se puede deshacer.")) return;
    startTransition(async () => {
      await updatePeriod(id, { status: "CANCELLED" });
      const refreshed = await getAllPeriodsAdmin();
      setPeriods(refreshed);
    });
  }

  if (loading) return <div className="p-8 text-center text-foreground/50">Cargando períodos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background hover:opacity-90"
        >
          + Crear período
        </button>
      </div>

      {showCreate && <CreatePeriodForm onCreated={async () => {
        setShowCreate(false);
        const refreshed = await getAllPeriodsAdmin();
        setPeriods(refreshed);
      }} />}

      {periods.length === 0 ? (
        <div className="rounded-xl border border-surface-light bg-background p-8 text-center text-foreground/50">
          No hay períodos creados
        </div>
      ) : (
        periods.map((period) => {
          const status = STATUS_LABELS[period.status] ?? { label: period.status, color: "text-foreground/50" };
          return (
            <div key={period.id} className="rounded-xl border border-surface-light bg-background p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{period.name}</h3>
                  <p className="text-xs text-foreground/40">
                    {new Date(period.startDate).toLocaleDateString("es-AR")} — {new Date(period.endDate).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
              </div>

              {/* Prizes */}
              {period.prizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {period.prizes.map((p) => (
                    <span key={p.id} className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      {p.position === 1 ? "🥇" : p.position === 2 ? "🥈" : "🥉"} {p.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Winners */}
              {period.winners.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {period.winners.map((w) => (
                    <span key={`${period.id}-${w.position}`} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                      {w.position === 1 ? "🥇" : w.position === 2 ? "🥈" : "🥉"} {w.username} — {w.activeReferrals} ref
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {period.status === "SCHEDULED" && (
                  <>
                    <button
                      onClick={() => handleActivate(period.id)}
                      disabled={isPending}
                      className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
                    >
                      Activar
                    </button>
                    <AddPrizeButton periodId={period.id} onAdded={async () => {
                      const refreshed = await getAllPeriodsAdmin();
                      setPeriods(refreshed);
                    }} />
                    <button
                      onClick={() => handleCancel(period.id)}
                      disabled={isPending}
                      className="rounded-lg border border-red-400/30 px-4 py-2 text-xs font-bold text-red-400 hover:border-red-400 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {period.status === "ACTIVE" && (
                  <>
                    <PeriodRankingButton periodId={period.id} />
                    <AddPrizeButton periodId={period.id} onAdded={async () => {
                      const refreshed = await getAllPeriodsAdmin();
                      setPeriods(refreshed);
                    }} />
                    <button
                      onClick={() => handleFinalize(period.id)}
                      disabled={isPending}
                      className="rounded-lg bg-gold px-4 py-2 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
                    >
                      🏆 Finalizar y determinar ganador
                    </button>
                    <button
                      onClick={() => handleCancel(period.id)}
                      disabled={isPending}
                      className="rounded-lg border border-red-400/30 px-4 py-2 text-xs font-bold text-red-400 hover:border-red-400 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function CreatePeriodForm({ onCreated }: { onCreated: () => void }) {
  const now = new Date();
  const pad = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  };
  const startDefault = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDefault = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [form, setForm] = useState({
    name: `Embajador de ${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`,
    startDate: pad(startDefault),
    endDate: pad(endDefault),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) {
      setError("Fecha fin debe ser posterior a fecha inicio");
      setSaving(false);
      return;
    }

    const month = start.getMonth() + 1;
    const year = start.getFullYear();

    const res = await createPeriod({
      name: form.name,
      month,
      year,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    setSaving(false);
    if ("error" in res && typeof res.error === "string") {
      setError(res.error);
    } else {
      onCreated();
    }
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <h3 className="mb-3 font-bold text-accent">Crear período</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Inicio</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Fin</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
              className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-6 py-2 font-bold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear"}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function AddPrizeButton({ periodId, onAdded }: { periodId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ position: 1, name: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createPeriodPrize(periodId, {
      position: form.position,
      name: form.name,
      description: form.description || undefined,
    });
    setSaving(false);
    setOpen(false);
    setForm({ position: 1, name: "", description: "" });
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-2 text-xs font-bold text-gold hover:border-gold/60"
      >
        🏆 Agregar premio
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-gold/30 bg-gold/5 p-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Posición</label>
          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            className="rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
          >
            <option value={1}>🥇 1er puesto</option>
            <option value={2}>🥈 2do puesto</option>
            <option value={3}>🥉 3er puesto</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-foreground/50">Premio</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="EA SPORTS FC 27"
            className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-gold px-4 py-2 text-xs font-bold text-background disabled:opacity-50">
          {saving ? "..." : "Agregar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-foreground/40">Cancelar</button>
      </form>
    </div>
  );
}

function PeriodRankingButton({ periodId }: { periodId: string }) {
  const [open, setOpen] = useState(false);
  const [ranking, setRanking] = useState<Awaited<ReturnType<typeof getPeriodRanking>>>([]);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    const r = await getPeriodRanking(periodId, 20);
    setRanking(r);
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={handleOpen} className="rounded-lg border border-surface-light px-4 py-2 text-xs font-bold text-foreground/60 hover:border-accent hover:text-accent">
        📊 Ver ranking
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-surface-light bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold">Ranking actual</span>
        <button onClick={() => setOpen(false)} className="text-xs text-foreground/40">Cerrar</button>
      </div>
      {loading ? (
        <p className="text-xs text-foreground/40">Cargando...</p>
      ) : ranking.length === 0 ? (
        <p className="text-xs text-foreground/40">Sin participantes</p>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {ranking.map((r) => (
            <div key={r.user?.id} className="flex items-center justify-between py-1 text-sm">
              <span>
                <span className="font-bold text-foreground/50">{r.position}.</span>{" "}
                <span className="font-medium">{r.user?.username}</span>
              </span>
              <span>
                <span className="font-bold text-accent">{r.activeReferrals}</span>
                <span className="ml-2 text-xs text-gold">{r.bengalas} beng</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CONVERSIONES ──────────────────────────────────────────

function ConversionsTab() {
  const [conversions, setConversions] = useState<Awaited<ReturnType<typeof getConversionsAdmin>>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getConversionsAdmin().then((c) => {
      setConversions(c);
      setLoading(false);
    });
  }, []);

  function applyFilter(status: string) {
    setFilter(status);
    setLoading(true);
    const filters = status === "ALL" ? undefined : { status };
    getConversionsAdmin(filters).then((c) => {
      setConversions(c);
      setLoading(false);
    });
  }

  async function handleReview(referralId: string, action: "VALIDATE" | "INVALIDATE") {
    const label = action === "VALIDATE" ? "aprobar" : "rechazar";
    const note = prompt(`Nota para ${label} (opcional):`);
    if (note === null) return;

    startTransition(async () => {
      const res = await adminReviewConversion(referralId, action, note || undefined);
      if ("error" in res) { alert(res.error); return; }
      applyFilter(filter);
    });
  }

  if (loading) return <div className="p-8 text-center text-foreground/50">Cargando conversiones...</div>;

  const filterButtons = [
    { key: "ALL", label: "Todas" },
    { key: "PENDING", label: "Pendientes" },
    { key: "VALIDATED", label: "Validadas" },
    { key: "UNDER_REVIEW", label: "En revisión" },
    { key: "INVALIDATED", label: "Invalidadas" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((f) => (
          <button
            key={f.key}
            onClick={() => applyFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === f.key
                ? "bg-accent text-background"
                : "bg-surface-light/50 text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {conversions.length === 0 ? (
        <div className="rounded-xl border border-surface-light bg-background p-8 text-center text-foreground/50">
          Sin conversiones{filter !== "ALL" ? ` con estado "${filterButtons.find((f) => f.key === filter)?.label}"` : ""}
        </div>
      ) : (
        <div className="space-y-3">
          {conversions.map((c) => {
            const status = CONVERSION_STATUS_LABELS[c.conversionStatus] ?? { label: c.conversionStatus, color: "text-foreground/50" };
            return (
              <div key={c.id} className="rounded-xl border border-surface-light bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{c.referred.username}</span>
                      <span className="text-xs text-foreground/30">→</span>
                      <span className="text-sm text-foreground/60">emb: {c.ambassador.username}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.color} bg-current/10`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-foreground/40">
                      <span>Registro: {new Date(c.createdAt).toLocaleDateString("es-AR")}</span>
                      {c.conversionRule && (
                        <span className="font-medium text-foreground/60">
                          Regla: {CONVERSION_RULE_LABELS[c.conversionRule] ?? c.conversionRule}
                        </span>
                      )}
                      {c.convertedAt && (
                        <span>Validado: {new Date(c.convertedAt).toLocaleDateString("es-AR")}</span>
                      )}
                    </div>

                    {/* Gaming IDs */}
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-foreground/30">
                      {c.referred.psnUsername && <span>PSN: {c.referred.psnUsername}</span>}
                      {c.referred.xboxUsername && <span>Xbox: {c.referred.xboxUsername}</span>}
                      {c.referred.pcUsername && <span>PC: {c.referred.pcUsername}</span>}
                    </div>

                    {/* Risk */}
                    {c.riskScore > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          c.riskScore >= 40 ? "bg-red-500/20 text-red-400" :
                          c.riskScore >= 20 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-foreground/10 text-foreground/40"
                        }`}>
                          Riesgo: {c.riskScore}/100
                        </span>
                        {Array.isArray(c.riskFlags) && c.riskFlags.map((flag, i) => (
                          <span key={i} className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review note */}
                    {c.reviewNote && (
                      <p className="mt-1 text-xs italic text-foreground/40">Nota: {c.reviewNote}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {(c.conversionStatus === "UNDER_REVIEW" || c.conversionStatus === "PENDING") && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleReview(c.id, "VALIDATE")}
                        disabled={isPending}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReview(c.id, "INVALIDATE")}
                        disabled={isPending}
                        className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:border-red-400 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>

                {/* Logs */}
                {c.logs.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] font-bold text-foreground/30 hover:text-foreground/50">
                      Historial ({c.logs.length})
                    </summary>
                    <div className="mt-1 space-y-1">
                      {c.logs.map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-[10px] text-foreground/30">
                          <span>{log.previousStatus} → {log.newStatus}</span>
                          {log.rule && <span className="text-foreground/40">[{log.rule}]</span>}
                          <span>{log.changedBy === "SYSTEM" ? "Sistema" : "Admin"}</span>
                          <span>{new Date(log.createdAt).toLocaleString("es-AR")}</span>
                          {log.reason && <span className="italic">{log.reason}</span>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVIDAD ─────────────────────────────────────────────

function ActivityTab({ activity }: { activity: DashboardData["recentActivity"] }) {
  const [invalidating, setInvalidating] = useState<string | null>(null);

  async function handleInvalidate(id: string) {
    if (!confirm("¿Invalidar esta bengala?")) return;
    setInvalidating(id);
    await invalidateBengala(id);
    setInvalidating(null);
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-surface-light bg-background">
      <div className="border-b border-surface-light px-4 py-3">
        <h3 className="font-bold">Actividad reciente</h3>
      </div>
      {activity.length === 0 ? (
        <div className="p-8 text-center text-foreground/50">Sin actividad</div>
      ) : (
        <div className="divide-y divide-surface-light/50">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className="font-bold text-accent">+{a.amount}</span>
                <span className="ml-2 font-medium">{a.username}</span>
                <span className="ml-2 text-foreground/50">
                  {REASON_LABELS[a.reason] ?? a.reason}
                </span>
                {a.referredUsername && (
                  <span className="ml-1 text-foreground/30">({a.referredUsername})</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground/30">
                  {new Date(a.createdAt).toLocaleDateString("es-AR")}
                </span>
                <button
                  onClick={() => handleInvalidate(a.id)}
                  disabled={invalidating === a.id}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {invalidating === a.id ? "..." : "Invalidar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RANKING + DETALLE EMBAJADOR ───────────────────────────

function RankingTab({ ambassadors }: { ambassadors: DashboardData["topAmbassadors"] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-light bg-background">
        <div className="border-b border-surface-light px-4 py-3">
          <h3 className="font-bold">Top 10 Embajadores (histórico)</h3>
          <p className="text-xs text-foreground/30">Click en embajador para ver detalle</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-light text-xs uppercase text-foreground/40">
                <th className="px-3 py-2 text-center">#</th>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-center">Referidos</th>
                <th className="px-3 py-2 text-center">Activos</th>
                <th className="px-3 py-2 text-center">Bengalas</th>
              </tr>
            </thead>
            <tbody>
              {ambassadors.map((a, idx) => (
                <tr
                  key={a.user?.id}
                  className={`border-b border-surface-light/50 cursor-pointer transition-colors hover:bg-accent/5 ${
                    selectedId === a.user?.id ? "bg-accent/10" : ""
                  }`}
                  onClick={() => setSelectedId(selectedId === a.user?.id ? null : (a.user?.id ?? null))}
                >
                  <td className="px-3 py-2.5 text-center font-bold text-foreground/50">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{a.user?.username}</td>
                  <td className="px-3 py-2.5 text-center text-foreground/60">{a.totalReferrals}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-accent">{a.activeReferrals}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-gold">{a.totalBengalas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && <AmbassadorDetail userId={selectedId} />}
    </div>
  );
}

function AmbassadorDetail({ userId }: { userId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAmbassadorActivity>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidatingRef, setInvalidatingRef] = useState<string | null>(null);

  useEffect(() => {
    getAmbassadorActivity(userId).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [userId]);

  async function handleInvalidateReferral(id: string) {
    if (!confirm("¿Invalidar referido? Se invalidan también sus bengalas asociadas.")) return;
    setInvalidatingRef(id);
    await invalidateReferral(id);
    setInvalidatingRef(null);
    const refreshed = await getAmbassadorActivity(userId);
    setData(refreshed);
  }

  if (loading) return <div className="p-4 text-center text-foreground/50">Cargando...</div>;
  if (!data) return <div className="p-4 text-center text-red-400">Error cargando datos</div>;

  return (
    <div className="space-y-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👤</span>
        <div>
          <h3 className="font-bold text-accent">{data.ambassador?.username}</h3>
          <p className="text-xs text-foreground/40">Código: {data.ambassador?.referralCode}</p>
        </div>
      </div>

      <div className="rounded-lg border border-surface-light bg-background">
        <div className="border-b border-surface-light px-4 py-2">
          <h4 className="text-sm font-bold">Referidos ({data.referrals.length})</h4>
        </div>
        {data.referrals.length === 0 ? (
          <div className="p-4 text-center text-sm text-foreground/40">Sin referidos</div>
        ) : (
          <div className="divide-y divide-surface-light/50">
            {data.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{r.referredUsername}</span>
                  {r.isActive ? (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">ACTIVO</span>
                  ) : r.invalidated ? (
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">INVALIDADO</span>
                  ) : (
                    <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground/40">PENDIENTE</span>
                  )}
                  {r.activatedAt && (
                    <span className="text-[10px] text-foreground/30">
                      Activo: {new Date(r.activatedAt).toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>
                {!r.invalidated && (
                  <button
                    onClick={() => handleInvalidateReferral(r.id)}
                    disabled={invalidatingRef === r.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {invalidatingRef === r.id ? "..." : "Invalidar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-surface-light bg-background">
        <div className="border-b border-surface-light px-4 py-2">
          <h4 className="text-sm font-bold">Bengalas ({data.bengalas.length})</h4>
        </div>
        {data.bengalas.length === 0 ? (
          <div className="p-4 text-center text-sm text-foreground/40">Sin bengalas</div>
        ) : (
          <div className="max-h-64 divide-y divide-surface-light/50 overflow-y-auto">
            {data.bengalas.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <span className={`font-bold ${b.invalidated ? "text-foreground/30 line-through" : "text-accent"}`}>
                    +{b.amount}
                  </span>
                  <span className="ml-2 text-foreground/50">{REASON_LABELS[b.reason] ?? b.reason}</span>
                  {b.referredUsername && (
                    <span className="ml-1 text-foreground/30">({b.referredUsername})</span>
                  )}
                </div>
                <span className="text-xs text-foreground/30">
                  {new Date(b.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONFIGURACIÓN ─────────────────────────────────────────

function ConfigTab() {
  const [configs, setConfigs] = useState([
    { key: "bengala_referral_active", label: "Referido activo", value: 5 },
    { key: "bengala_referral_tournament", label: "Participó en torneo", value: 10 },
    { key: "bengala_referral_prode", label: "Creó Prode", value: 5 },
    { key: "bengala_referral_organized", label: "Organizó torneo", value: 15 },
  ]);
  const [saving, setSaving] = useState<string | null>(null);

  async function saveConfig(key: string, amount: number) {
    setSaving(key);
    await updateBengalaConfig(key, { amount });
    setSaving(null);
  }

  return (
    <div className="rounded-xl border border-surface-light bg-background p-4">
      <h3 className="mb-4 font-bold">Valores de bengalas</h3>
      <div className="space-y-3">
        {configs.map((c) => (
          <div key={c.key} className="flex items-center gap-3">
            <span className="flex-1 text-sm text-foreground/70">{c.label}</span>
            <input
              type="number"
              min={0}
              value={c.value}
              onChange={(e) =>
                setConfigs(configs.map((x) => (x.key === c.key ? { ...x, value: Number(e.target.value) } : x)))
              }
              className="w-20 rounded-lg border border-surface-light bg-background px-2 py-1 text-center text-sm focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => saveConfig(c.key, c.value)}
              disabled={saving === c.key}
              className="rounded bg-accent/10 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/20 disabled:opacity-50"
            >
              {saving === c.key ? "..." : "Guardar"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-foreground/30">
        Cambiar valores afecta solo bengalas futuras, no las ya otorgadas.
      </p>
    </div>
  );
}
