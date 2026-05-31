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

// No real match placeholder
const NO_REAL_MATCHES_PLACEHOLDER: TickerMatch = {
  id: "no-real",
  league: "",
  leagueFlag: "😴",
  homeTeam: "Sin partidos de fútbol",
  awayTeam: "nadie importante está jugando",
  homeScore: null,
  awayScore: null,
  status: "finished",
  minute: null,
  type: "real",
};

function StatusBadge({ match }: { match: TickerMatch }) {
  if (match.status === "live") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-accent">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        {match.minute ?? "VIVO"}
      </span>
    );
  }
  if (match.status === "finished") {
    return <span className="text-[10px] font-medium text-foreground/30">FT</span>;
  }
  return <span className="text-[10px] font-medium text-foreground/30">PRÓ</span>;
}

function getMatchUrl(match: TickerMatch): string | null {
  if (match.id === "no-real") return null;
  if (match.type === "fc26") return null; // No external link for FC26 matches
  // Google search with team names → shows live match card with events
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

      // If no real football matches, add placeholder
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
    const interval = setInterval(fetchTicker, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTicker]);

  // Don't render until data loads
  if (!loaded) {
    return (
      <div className="border-y border-surface-light bg-surface/50 py-2">
        <div className="flex items-center justify-center">
          <span className="text-xs text-foreground/30 animate-pulse">Cargando resultados...</span>
        </div>
      </div>
    );
  }

  // Duplicate for seamless loop
  const tickerItems = [...matches, ...matches];
  // Faster: ~2s per item instead of 4s
  const duration = Math.max(matches.length * 2, 15);

  return (
    <div className="relative overflow-hidden border-y border-surface-light bg-surface/50">
      {/* Fixed "Resultados en vivo" label — always visible on the left */}
      <div className="absolute left-0 top-0 z-20 flex h-full items-center bg-gradient-to-r from-background via-background to-transparent pl-3 pr-8">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-red-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Resultados en vivo
        </span>
      </div>

      {/* Right fade edge */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex whitespace-nowrap py-2 animate-[ticker_var(--ticker-duration)_linear_infinite]"
        style={{
          "--ticker-duration": `${duration}s`,
          paddingLeft: "200px", // offset for fixed label
        } as React.CSSProperties}
      >
        {tickerItems.map((match, i) => {
          // Placeholder message (no score, special render)
          const isPlaceholder = match.id === "no-real";
          const matchUrl = getMatchUrl(match);

          const content = isPlaceholder ? (
            <>
              <span className="text-[11px]">😴</span>
              <span className="font-medium text-foreground/40">
                Sin partidos de fútbol — nadie importante está jugando
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px]">{match.leagueFlag}</span>
              {match.league && (
                <span className="font-medium text-foreground/40">{match.league}</span>
              )}
              <span className="font-bold text-foreground/80">{match.homeTeam}</span>
              {match.homeScore !== null ? (
                <span className={`font-black ${match.status === "live" ? "text-accent" : "text-foreground"}`}>
                  {match.homeScore} - {match.awayScore}
                </span>
              ) : (
                <span className="text-foreground/30">vs</span>
              )}
              <span className="font-bold text-foreground/80">{match.awayTeam}</span>
              <StatusBadge match={match} />
            </>
          );

          const className = `mx-2 inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
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
                className={`${className} cursor-pointer transition-colors hover:border-accent hover:bg-accent/10`}
              >
                {content}
              </a>
            );
          }

          return (
            <div key={`${match.id}-${i}`} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
