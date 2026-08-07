import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { getEvolutions, type Evolution, type EvoPlayer } from "@/lib/easysbc";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evoluciones — EA FC 26 | Modo Fosa",
  description:
    "Todas las Evoluciones activas de EA FC 26 en español: requisitos y mejoras de cada una. Se actualiza solo.",
  alternates: { canonical: "/evoluciones" },
};

function timeLeft(endTime: number | null): string | null {
  if (!endTime) return null;
  const ms = endTime * 1000 - Date.now();
  if (ms <= 0) return "Expira ya";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  if (d >= 1) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function fmtCoins(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return Math.round(n / 1_000).toLocaleString("es-AR") + "K";
  return n.toLocaleString("es-AR");
}

const POS_ES: Record<string, string> = {
  GK: "POR", CB: "DFC", LB: "LI", RB: "LD", LWB: "CAI", RWB: "CAD",
  CDM: "MCD", CM: "MC", CAM: "MCO", LM: "MI", RM: "MD",
  LW: "EI", RW: "ED", LF: "II", RF: "ID", CF: "MP",
  ST: "DC", SW: "LIB",
};
function tPos(pos: string): string {
  return POS_ES[pos] ?? pos;
}

const STAT_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"] as const;
const STAT_LABELS = ["RIT", "TIR", "PAS", "REG", "DEF", "FÍS"];

function BaseCard({ player }: { player: EvoPlayer }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">ANTES</span>
      {player.cardImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.cardImageUrl}
          alt={player.name}
          className="h-[180px] w-auto object-contain drop-shadow-lg sm:h-[210px]"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <FallbackCard player={player} />
      )}
    </div>
  );
}

function EvoCardPlayer({ player, base }: { player: EvoPlayer; base: EvoPlayer }) {
  const stats = STAT_KEYS.map((k) => ({ val: player[k], diff: player[k] - base[k] }));
  const ovrDiff = player.overall - base.overall;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-accent">DESPUÉS</span>
      <div className="relative flex w-[140px] flex-col items-center rounded-xl border-2 border-accent/30 bg-gradient-to-b from-accent/10 via-surface/40 to-surface/20 p-3 shadow-[0_0_20px_rgba(0,255,135,0.08)] sm:w-[155px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={player.imageUrl}
          alt={player.name}
          className="h-[80px] w-auto object-contain drop-shadow-md sm:h-[90px]"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl font-black leading-none text-accent">{player.overall}</span>
          {ovrDiff > 0 && (
            <span className="text-[10px] font-bold text-green-400">+{ovrDiff}</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-foreground/60">{tPos(player.position)}</span>
        <span className="mt-0.5 max-w-full truncate text-[10px] font-bold text-foreground/80">{player.name}</span>

        <div className="mt-2 grid w-full grid-cols-3 gap-x-3 gap-y-1">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[8px] text-foreground/30">{STAT_LABELS[i]}</span>
              <div className="flex items-baseline gap-0.5">
                <span className={`text-[11px] font-bold ${s.diff > 0 ? "text-accent" : "text-foreground/80"}`}>
                  {s.val}
                </span>
                {s.diff > 0 && (
                  <span className="text-[8px] font-bold text-green-400">+{s.diff}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex gap-3 text-[9px]">
          <span className={player.skillMoves > base.skillMoves ? "font-bold text-accent" : "text-foreground/40"}>
            R {player.skillMoves}
            {player.skillMoves > base.skillMoves && <span className="text-green-400"> +{player.skillMoves - base.skillMoves}</span>}
          </span>
          <span className={player.weakFoot > base.weakFoot ? "font-bold text-accent" : "text-foreground/40"}>
            ★ {player.weakFoot}
            {player.weakFoot > base.weakFoot && <span className="text-green-400"> +{player.weakFoot - base.weakFoot}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

function FallbackCard({ player }: { player: EvoPlayer }) {
  return (
    <div className="flex w-[140px] flex-col items-center rounded-xl border border-surface-light bg-gradient-to-b from-surface-light/40 to-surface/20 p-3 sm:w-[155px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={player.imageUrl}
        alt={player.name}
        className="h-[80px] w-auto object-contain drop-shadow-md sm:h-[90px]"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <span className="mt-1 text-xl font-black leading-none text-foreground/80">{player.overall}</span>
      <span className="text-[10px] font-bold text-foreground/60">{tPos(player.position)}</span>
      <span className="mt-0.5 max-w-full truncate text-[10px] font-bold text-foreground/80">{player.name}</span>
      <div className="mt-2 grid w-full grid-cols-3 gap-x-3 gap-y-1">
        {STAT_KEYS.map((k, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[8px] text-foreground/30">{STAT_LABELS[i]}</span>
            <span className="text-[11px] font-bold text-foreground/80">{player[k]}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3 text-[9px] text-foreground/40">
        <span>R {player.skillMoves}</span>
        <span>★ {player.weakFoot}</span>
      </div>
    </div>
  );
}

function EvoCard({ evo }: { evo: Evolution }) {
  const vence = timeLeft(evo.endTime);
  const hasPlayers = evo.basePlayer && evo.evoPlayer;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40">
      {/* Header */}
      <div className="border-b border-surface-light px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          {evo.isNew && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-background">NUEVA</span>
          )}
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium text-foreground/60">
            {evo.category}
          </span>
        </div>
        <h3 className="text-sm font-bold leading-tight">{evo.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
          {vence && (
            <span className="text-foreground/40">⏱ {vence}</span>
          )}
          {(evo.costCoins > 0 || evo.costXp > 0) && (
            <div className="flex items-center gap-2">
              {evo.costCoins > 0 && (
                <span className="font-bold text-gold">{fmtCoins(evo.costCoins)}</span>
              )}
              {evo.costXp > 0 && (
                <span className="font-bold text-blue-400">{evo.costXp.toLocaleString("es-AR")} XP</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player cards: before → after */}
      {hasPlayers && (
        <div className="flex items-center justify-center gap-2 border-b border-surface-light bg-gradient-to-b from-surface-light/10 to-transparent px-2 py-5 sm:gap-4 sm:px-4">
          <BaseCard player={evo.basePlayer!} />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-accent">→</span>
          </div>
          <EvoCardPlayer player={evo.evoPlayer!} base={evo.basePlayer!} />
        </div>
      )}

      {/* Requirements + Upgrades */}
      <div className="grid flex-1 gap-3 p-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground/40">Requisitos</h4>
          {evo.requirements.length === 0 ? (
            <p className="text-[11px] text-foreground/30">Sin requisitos</p>
          ) : (
            <ul className="space-y-1">
              {evo.requirements.map((r, i) => (
                <li key={i} className="flex justify-between gap-2 text-[11px]">
                  <span className="text-foreground/60">{r.label}</span>
                  <span className="text-right font-medium text-foreground/80">{r.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground/40">Mejoras</h4>
          {evo.upgrades.length === 0 ? (
            <p className="text-[11px] text-foreground/30">—</p>
          ) : (
            <ul className="space-y-1">
              {evo.upgrades.map((u, i) => (
                <li key={i} className="flex justify-between gap-2 text-[11px]">
                  <span className="text-foreground/60">{u.label}</span>
                  <span className="text-right font-bold text-accent">{u.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function EvolucionesPage() {
  const evos = await getEvolutions();
  const nuevas = evos.filter((e) => e.isNew).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-black">🧬 Evoluciones</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Todas las Evoluciones activas de EA FC 26 — requisitos y mejoras, en español. Se actualiza solo.
          </p>
        </header>

        {evos.length === 0 ? (
          <div className="rounded-xl border border-surface-light bg-surface/30 p-8 text-center text-foreground/50">
            No hay Evoluciones activas ahora mismo.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-foreground/50">
              <span className="rounded-full bg-surface-light px-3 py-1">
                <span className="font-bold text-foreground/80">{evos.length}</span> activas
              </span>
              {nuevas > 0 && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                  <span className="font-bold">{nuevas}</span> nuevas
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {evos.map((evo) => (
                <EvoCard key={evo.id} evo={evo} />
              ))}
            </div>

            <p className="mt-6 text-center text-[11px] text-foreground/30">
              Datos de easysbc. Traducidos automáticamente.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
