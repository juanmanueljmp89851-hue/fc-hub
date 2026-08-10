"use client";

import { useState } from "react";
import Image from "next/image";
import type { SbcSet } from "@/lib/futgg";
import Link from "next/link";
import { fmtCoins, timeLeft } from "@/lib/format";

const PAGE_SIZE = 12;

function SbcCard({ sbc }: { sbc: SbcSet }) {
  const reqs = [...new Set(sbc.challenges.flatMap((c) => c.requirements))];
  const cheapest = sbc.cheapestTotal;

  return (
    <Link
      href={`/sbc/${sbc.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40"
    >
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        {sbc.isNew && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-background">NUEVO</span>
        )}
        {sbc.isRepeatable && (
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-bold text-foreground/70">
            🔁 Repetible
          </span>
        )}
      </div>

      <div className="flex items-center justify-center bg-gradient-to-b from-surface-light/30 to-transparent px-4 pt-6 pb-2">
        {sbc.imageUrl ?? sbc.iconUrl ? (
          <img
            src={(sbc.imageUrl ?? sbc.iconUrl)!}
            alt={sbc.rewardPlayer?.commonName ?? sbc.name}
            className="h-40 w-auto object-contain drop-shadow-lg"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              const fb = document.createElement("div");
              fb.className = "flex h-40 w-28 items-center justify-center rounded-lg bg-surface-light text-3xl";
              fb.textContent = "🎁";
              el.parentElement?.appendChild(fb);
            }}
          />
        ) : (
          <div className="flex h-40 w-28 items-center justify-center rounded-lg bg-surface-light text-3xl">🎁</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-bold leading-tight">{sbc.name}</h3>

        {reqs.length > 0 && (
          <ul className="space-y-0.5 text-[11px] text-foreground/60">
            {reqs.slice(0, 4).map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-accent">›</span>
                <span className="leading-tight">{r}</span>
              </li>
            ))}
            {reqs.length > 4 && <li className="text-foreground/30">+{reqs.length - 4} más</li>}
          </ul>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-background/50 px-2.5 py-1.5">
            <span className="block text-[10px] uppercase text-foreground/40">Solución + barata</span>
            <span className="font-bold text-gold">{cheapest != null ? fmtCoins(cheapest) : fmtCoins(sbc.cost)}</span>
          </div>
          <div className="rounded-lg bg-background/50 px-2.5 py-1.5">
            <span className="block text-[10px] uppercase text-foreground/40">Vence</span>
            <span className="font-bold text-foreground/80">{timeLeft(sbc.endTime)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-foreground/50">
          <span>
            {sbc.challengesCount} desafío{sbc.challengesCount !== 1 ? "s" : ""}
          </span>
          {sbc.rewardPlayer && (
            <span className="font-bold text-accent">{sbc.rewardPlayer.overall} OVR</span>
          )}
        </div>

        <span className="mt-1 rounded-lg bg-accent/10 py-1.5 text-center text-xs font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-background">
          Ver SBC →
        </span>
      </div>
    </Link>
  );
}

export function SbcGrid({ sbcs }: { sbcs: SbcSet[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = sbcs.slice(0, visibleCount);
  const hasMore = visibleCount < sbcs.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((sbc) => (
          <SbcCard key={sbc.id} sbc={sbc} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-6 w-full rounded-lg border border-surface-light py-3 text-sm font-medium text-foreground/60 hover:border-accent hover:text-accent"
        >
          Ver más SBC ({sbcs.length - visibleCount} restantes)
        </button>
      )}
    </>
  );
}
