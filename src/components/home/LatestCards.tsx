"use client";

import { useState } from "react";
import Link from "next/link";
import { FutCard } from "@/components/jugadores/FutCard";
import { PlayerDetailModal } from "@/components/jugadores/PlayerDetailModal";
import type { FutPlayer } from "@/types/player";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "justo ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

interface LatestCardsProps {
  cards: FutPlayer[];
  lastUpdated?: string | null;
}

export function LatestCards({ cards, lastUpdated }: LatestCardsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<FutPlayer | null>(null);

  if (!cards.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Cartas Nuevas
            </h2>
            <p className="text-xs text-foreground/40">
              Últimas incorporaciones en FC 26
            </p>
          </div>
          {lastUpdated && (
            <span className="rounded-full bg-surface-light px-2.5 py-0.5 text-[10px] font-medium text-foreground/40">
              {timeAgo(lastUpdated)}
            </span>
          )}
        </div>
        <Link
          href="/jugadores"
          className="text-xs font-semibold text-accent hover:underline"
        >
          Ver todas &rarr;
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-light touch-pan-x">
          {cards.map((card) => (
            <div key={card.id} className="flex-shrink-0 snap-start">
              <FutCard player={card} size="sm" onClick={() => setSelectedPlayer(card)} />
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      </div>

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </section>
  );
}
