"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { FutCard } from "@/components/jugadores/FutCard";
import { PlayerDetailModal } from "@/components/jugadores/PlayerDetailModal";
import type { FutPlayer } from "@/types/player";

const SORT_OPTIONS = [
  { value: "recent", label: "Reciente" },
  { value: "overall", label: "Rating" },
  { value: "pace", label: "Ritmo" },
  { value: "shooting", label: "Tiro" },
  { value: "passing", label: "Pase" },
  { value: "dribbling", label: "Regate" },
  { value: "defending", label: "Defensa" },
  { value: "physical", label: "Físico" },
  { value: "name", label: "Nombre" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];
type SortDir = "asc" | "desc";
type ViewMode = "promo" | "grid";

const POSITIONS = [
  "ST", "CF", "LW", "RW", "LF", "RF",
  "CAM", "CM", "CDM", "LM", "RM",
  "CB", "LB", "RB", "LWB", "RWB",
  "GK",
];

interface Props {
  players: FutPlayer[];
  promos: string[];
}

export function JugadoresClient({ players, promos }: Props) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [promoFilter, setPromoFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedPlayer, setSelectedPlayer] = useState<FutPlayer | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedPromos, setExpandedPromos] = useState(() => new Set<string>());
  const [visibleSections, setVisibleSections] = useState(3);
  const CARDS_PER_PROMO = 6;

  const filtered = useMemo(() => {
    let result = [...players];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.commonName?.toLowerCase().includes(q) ?? false) ||
          p.club.toLowerCase().includes(q)
      );
    }

    if (posFilter) result = result.filter((p) => p.position === posFilter);
    if (promoFilter) result = result.filter((p) => p.promo === promoFilter);

    if (viewMode === "grid") {
      result.sort((a, b) => {
        if (sortBy === "recent") {
          const oa = a.promoOrder ?? 0;
          const ob = b.promoOrder ?? 0;
          if (oa !== ob) return sortDir === "asc" ? oa - ob : ob - oa;
          return sortDir === "asc" ? a.overall - b.overall : b.overall - a.overall;
        }
        if (sortBy === "name") {
          const na = (a.commonName ?? a.name).toLowerCase();
          const nb = (b.commonName ?? b.name).toLowerCase();
          return sortDir === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
        }
        const va = (a[sortBy] ?? 0) as number;
        const vb = (b[sortBy] ?? 0) as number;
        return sortDir === "asc" ? va - vb : vb - va;
      });
    }

    return result;
  }, [players, search, posFilter, promoFilter, sortBy, sortDir, viewMode]);

  // Group by promo for promo view
  const groupedByPromo = useMemo(() => {
    if (viewMode !== "promo") return [];
    const map: Map<string, FutPlayer[]> = new Map();
    for (const p of filtered) {
      const key = p.promo ?? "Otros";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    // Sort groups by promoOrder (highest first)
    return Array.from(map.entries()).sort((a, b) => {
      const orderA = a[1][0]?.promoOrder ?? 0;
      const orderB = b[1][0]?.promoOrder ?? 0;
      return orderB - orderA;
    });
  }, [filtered, viewMode]);

  const hasFilters = !!(posFilter || promoFilter);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground">
            <span className="text-accent">Base de Jugadores</span> FC 26
          </h1>
          <p className="mt-2 text-sm text-foreground/50">
            Cartas especiales, promos y más.
            <span className="ml-2 rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
              {players.length} cartas
            </span>
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador o club..."
              className="w-full rounded-xl border border-surface-light bg-surface py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="rounded-lg border border-surface-light bg-surface px-3 py-2 text-xs font-medium text-foreground/70 focus:border-accent focus:outline-none"
            >
              <option value="">Posición</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            <select
              value={promoFilter}
              onChange={(e) => setPromoFilter(e.target.value)}
              className="rounded-lg border border-surface-light bg-surface px-3 py-2 text-xs font-medium text-foreground/70 focus:border-accent focus:outline-none"
            >
              <option value="">Promo</option>
              {promos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* View mode toggle */}
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-surface-light bg-surface p-0.5">
              <button
                onClick={() => setViewMode("promo")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "promo"
                    ? "bg-accent text-background"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                Por promo
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-accent text-background"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                Grilla
              </button>
            </div>

            {/* Sort (grid mode only) */}
            {viewMode === "grid" && (
              <>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="rounded-lg border border-surface-light bg-surface px-3 py-2 text-xs font-medium text-foreground/70 focus:border-accent focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                  className="rounded-lg border border-surface-light bg-surface p-2 text-foreground/50 transition-colors hover:border-accent hover:text-accent"
                >
                  {sortDir === "desc" ? "↓" : "↑"}
                </button>
              </>
            )}

            {hasFilters && (
              <button
                onClick={() => { setPosFilter(""); setPromoFilter(""); }}
                className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Results count + hint */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-foreground/40">
            {filtered.length} {filtered.length === 1 ? "carta" : "cartas"}
          </p>
          <p className="text-xs text-foreground/30">
            Hacé clic en una carta para ver el detalle
          </p>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-surface-light bg-surface py-16">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 text-sm font-medium text-foreground/50">
              No se encontraron cartas
            </p>
          </div>
        ) : viewMode === "promo" ? (
          /* PROMO VIEW — grouped sections */
          <div className="space-y-10">
            {groupedByPromo.slice(0, visibleSections).map(([promoName, cards]) => {
              const isExpanded = expandedPromos.has(promoName);
              const visibleCards = isExpanded ? cards : cards.slice(0, CARDS_PER_PROMO);
              const hasMore = cards.length > CARDS_PER_PROMO;

              return (
                <section key={promoName}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-lg font-black uppercase tracking-wide text-foreground">
                      {promoName}
                    </h2>
                    <span className="rounded bg-surface-light px-2 py-0.5 text-xs font-bold text-foreground/40">
                      {cards.length}
                    </span>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    style={{ justifyItems: "center" }}
                  >
                    {visibleCards.map((player) => (
                      <FutCard
                        key={player.id}
                        player={player}
                        onClick={() => setSelectedPlayer(player)}
                      />
                    ))}
                  </div>
                  {hasMore && !isExpanded && (
                    <button
                      onClick={() => setExpandedPromos((prev) => new Set([...prev, promoName]))}
                      className="mt-4 w-full rounded-lg border border-surface-light bg-surface py-2.5 text-xs font-bold text-foreground/50 transition-colors hover:border-accent hover:text-accent"
                    >
                      Ver {cards.length - CARDS_PER_PROMO} cartas más
                    </button>
                  )}
                </section>
              );
            })}
            {visibleSections < groupedByPromo.length && (
              <button
                onClick={() => setVisibleSections((v) => v + 3)}
                className="w-full rounded-xl border border-accent/20 bg-accent/5 py-4 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
              >
                Cargar más promos ({groupedByPromo.length - visibleSections} restantes)
              </button>
            )}
          </div>
        ) : (
          /* GRID VIEW — flat sorted */
          <>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              style={{ justifyItems: "center" }}
            >
              {filtered.slice(0, 60).map((player) => (
                <FutCard
                  key={player.id}
                  player={player}
                  onClick={() => setSelectedPlayer(player)}
                />
              ))}
            </div>
            {filtered.length > 60 && (
              <p className="mt-4 text-center text-xs text-foreground/40">
                Mostrando 60 de {filtered.length} — usá filtros para refinar
              </p>
            )}
          </>
        )}
      </main>

      {/* Detail modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
}

