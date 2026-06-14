"use client";

import { useEffect, useState, useCallback } from "react";

interface TickerMatch {
  id: string;
  league: string;
  leagueFlag: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "live" | "finished" | "upcoming";
  minute: string | null;
  type: "real" | "fc26";
}

const NO_REAL_MATCHES_PLACEHOLDER: TickerMatch = {
  id: "no-real",
  league: "",
  leagueFlag: "😴",
  homeTeam: "Sin partidos de fútbol",
  awayTeam: "jugate un fifita, tranqui",
  homeScore: null,
  awayScore: null,
  status: "finished",
  minute: null,
  type: "real",
};

function StatusBadge({ match }: { match: TickerMatch }) {
  if (match.status === "live") {
    return (
      <span className="flex items-center gap-1 text-[9px] font-bold text-accent">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        {match.minute ?? "VIVO"}
      </span>
    );
  }
  if (match.status === "finished") {
    return <span className="text-[9px] font-medium text-foreground/30">FT</span>;
  }
  return <span className="text-[9px] font-medium text-foreground/30">PRÓ</span>;
}

function getMatchUrl(match: TickerMatch): string | null {
  if (match.id === "no-real") return null;
  if (match.type === "fc26") return null;
  const q = encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam} resultado`);
  return `https://www.google.com/search?q=${q}`;
}

export function LiveTicker() {
  const [matches, setMatches] = useState<TickerMatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch("/api/ticker", { cache: "no-store" });
      if (!res.ok) return;
      const data: TickerMatch[] = await res.json();
      const realMatches = data.filter((m) => m.type === "real");
      const fc26Matches = data.filter((m) => m.type === "fc26");

      const finalMatches =
        realMatches.length > 0
          ? [...realMatches, ...fc26Matches]
          : [NO_REAL_MATCHES_PLACEHOLDER, ...fc26Matches];

      setMatches(finalMatches);
    } catch {
      setMatches([NO_REAL_MATCHES_PLACEHOLDER]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTicker]);

  if (!loaded) {
    return (
      <div className="border-y border-surface-light bg-surface/50 py-1.5">
        <div className="flex items-center justify-center">
          <span className="animate-pulse text-[10px] text-foreground/30">Cargando resultados...</span>
        </div>
      </div>
    );
  }

  const tickerItems = [...matches, ...matches];
  const duration = Math.max(matches.length * 2, 15);

  return (
    <div className="group/ticker relative overflow-hidden border-y border-surface-light bg-surface/50 touch-manipulation">
      {/* Fixed label */}
      <div className="absolute left-0 top-0 z-20 flex h-full items-center border-r border-surface-light bg-background pl-2 pr-2 sm:pl-3 sm:pr-3">
        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-red-500 sm:gap-1.5 sm:text-[10px]">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 sm:h-1.5 sm:w-1.5" />
          <span className="hidden sm:inline">EN VIVO</span>
          <span className="sm:hidden">LIVE</span>
        </span>
      </div>

      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex whitespace-nowrap py-1.5 pl-[68px] sm:pl-[95px] animate-[ticker_var(--ticker-duration)_linear_infinite] group-hover/ticker:[animation-play-state:paused] group-active/ticker:[animation-play-state:paused]"
        style={{
          "--ticker-duration": `${duration}s`,
        } as React.CSSProperties}
      >
        {tickerItems.map((match, i) => {
          const isPlaceholder = match.id === "no-real";
          const matchUrl = getMatchUrl(match);

          const content = isPlaceholder ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">😴</span>
              <span className="text-[10px] font-medium text-foreground/40">
                Sin partidos — jugate un fifita
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{match.leagueFlag}</span>
                {match.league && (
                  <span className="text-[10px] font-medium text-foreground/40">{match.league}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-foreground/80">{match.homeTeam}</span>
                {match.homeScore !== null ? (
                  <span className={`text-[10px] font-black ${match.status === "live" ? "text-accent" : "text-foreground"}`}>
                    {match.homeScore}-{match.awayScore}
                  </span>
                ) : (
                  <span className="text-[10px] text-foreground/30">vs</span>
                )}
                <span className="text-[10px] font-bold text-foreground/80">{match.awayTeam}</span>
                <StatusBadge match={match} />
              </div>
            </div>
          );

          const itemClass = `mx-1.5 inline-flex shrink-0 items-center rounded-md px-2 py-1 ${
            isPlaceholder
              ? "border border-surface-light/50 bg-surface/50"
              : match.type === "fc26"
                ? "border border-accent/20 bg-accent/5"
                : "border border-surface-light bg-surface"
          }`;

          if (matchUrl) {
            return (
              <a
                key={`${match.id}-${i}`}
                href={matchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${itemClass} cursor-pointer transition-colors hover:border-accent hover:bg-accent/10`}
              >
                {content}
              </a>
            );
          }

          return (
            <div key={`${match.id}-${i}`} className={itemClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
