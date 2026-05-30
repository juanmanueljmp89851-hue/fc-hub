"use client";

import type { FutPlayer } from "@/types/player";

function formatPrice(price?: number): string {
  if (!price) return "—";
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
  return String(price);
}

interface Props {
  player: FutPlayer;
  onClose: () => void;
}

export function PlayerDetailModal({ player, onClose }: Props) {
  const isGK = player.position === "GK";

  const mainStats = isGK
    ? [
        { label: "Estirada", value: player.gkDiving ?? 0 },
        { label: "Manejo", value: player.gkHandling ?? 0 },
        { label: "Saque", value: player.gkKicking ?? 0 },
        { label: "Reflejos", value: player.gkReflexes ?? 0 },
        { label: "Velocidad", value: player.gkSpeed ?? 0 },
        { label: "Posición", value: player.gkPositioning ?? 0 },
      ]
    : [
        { label: "Ritmo", value: player.pace },
        { label: "Tiro", value: player.shooting },
        { label: "Pase", value: player.passing },
        { label: "Regate", value: player.dribbling },
        { label: "Defensa", value: player.defending },
        { label: "Físico", value: player.physical },
      ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl border border-surface-light bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-foreground/40 transition-colors hover:text-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-black text-foreground">
            {player.commonName ?? player.name}
          </h2>
          {player.commonName && (
            <p className="text-sm text-foreground/50">{player.name}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
              {player.overall} OVR
            </span>
            <span className="rounded bg-surface-light px-2 py-0.5 text-xs font-medium text-foreground/60">
              {player.position}
            </span>
            {player.alternatePositions?.map((pos) => (
              <span
                key={pos}
                className="rounded bg-surface-light px-1.5 py-0.5 text-[10px] font-medium text-foreground/40"
              >
                {pos}
              </span>
            ))}
            {player.promo && (
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400">
                {player.promo}
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-foreground/50">
          {player.height && <span>📏 {player.height}cm</span>}
          {player.foot && <span>🦶 {player.foot}</span>}
          {player.skillMoves != null && <span>⭐ {player.skillMoves} Skill</span>}
          {player.weakFoot != null && <span>🦶 {player.weakFoot}★ WF</span>}
        </div>

        {/* Prices */}
        {(player.pricePs || player.pricePc) && (
          <div className="mb-4 flex gap-4 rounded-lg bg-surface-light/50 p-3">
            {player.pricePs && (
              <div>
                <span className="text-[10px] font-bold uppercase text-foreground/40">PS</span>
                <p className="text-sm font-black text-foreground">{formatPrice(player.pricePs)}</p>
              </div>
            )}
            {player.pricePc && (
              <div>
                <span className="text-[10px] font-bold uppercase text-foreground/40">PC</span>
                <p className="text-sm font-black text-foreground">{formatPrice(player.pricePc)}</p>
              </div>
            )}
            {player.futbinRating && (
              <div className="ml-auto">
                <span className="text-[10px] font-bold uppercase text-foreground/40">FUTBIN</span>
                <p className="text-sm font-black text-green-400">{player.futbinRating}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats bars */}
        <div className="space-y-2">
          {mainStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="w-20 text-xs font-bold uppercase text-foreground/40">
                {stat.label}
              </span>
              <span className="w-8 text-right text-sm font-black tabular-nums text-foreground">
                {stat.value}
              </span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-surface-light">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stat.value}%`,
                      background:
                        stat.value >= 90
                          ? "#22c55e"
                          : stat.value >= 80
                            ? "#a3e635"
                            : stat.value >= 70
                              ? "#fbbf24"
                              : stat.value >= 60
                                ? "#fb923c"
                                : "#ef4444",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* External links */}
        <div className="mt-4 flex gap-2">
          <a
            href={`https://www.futbin.com/players?search=${encodeURIComponent(player.commonName ?? player.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-[#1a2332] px-3 py-2 text-center text-xs font-bold text-[#57c7ff] transition-opacity hover:opacity-80"
          >
            Ver en FUTBIN →
          </a>
          <a
            href={`https://www.fut.gg/players/?q=${encodeURIComponent(player.commonName ?? player.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-[#0f1923] px-3 py-2 text-center text-xs font-bold text-[#00ff87] transition-opacity hover:opacity-80"
          >
            Ver en FUT.GG →
          </a>
        </div>
      </div>
    </div>
  );
}
