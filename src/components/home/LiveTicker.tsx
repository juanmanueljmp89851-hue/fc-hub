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

// Fallback when no API key / no data
const FALLBACK_MATCHES: TickerMatch[] = [
  { id: "f1", league: "Liga Argentina", leagueFlag: "🇦🇷", homeTeam: "Boca", awayTeam: "River", homeScore: 1, awayScore: 2, status: "finished", minute: null, type: "real" },
  { id: "f2", league: "La Liga", leagueFlag: "🇪🇸", homeTeam: "Barcelona", awayTeam: "Real Madrid", homeScore: 3, awayScore: 1, status: "finished", minute: null, type: "real" },
  { id: "f3", league: "Premier League", leagueFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", homeTeam: "Arsenal", awayTeam: "Man City", homeScore: 2, awayScore: 0, status: "finished", minute: null, type: "real" },
  { id: "f4", league: "Champions League", leagueFlag: "🏆", homeTeam: "Liverpool", awayTeam: "Bayern", homeScore: 1, awayScore: 0, status: "finished", minute: null, type: "real" },
  { id: "f5", league: "Libertadores", leagueFlag: "🏆", homeTeam: "Flamengo", awayTeam: "Racing", homeScore: 2, awayScore: 1, status: "finished", minute: null, type: "real" },
  { id: "f6", league: "Serie A", leagueFlag: "🇮🇹", homeTeam: "Inter", awayTeam: "Milan", homeScore: 2, awayScore: 2, status: "finished", minute: null, type: "real" },
  { id: "f7", league: "Mundial 2026", leagueFlag: "🌍", homeTeam: "Argentina", awayTeam: "Francia", homeScore: null, awayScore: null, status: "upcoming", minute: null, type: "real" },
];

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

export function LiveTicker() {
  const [matches, setMatches] = useState<TickerMatch[]>(FALLBACK_MATCHES);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch("/api/ticker", { cache: "no-store" });
      if (!res.ok) return;
      const data: TickerMatch[] = await res.json();
      if (data.length > 0) {
        setMatches(data);
      }
    } catch {
      // Keep fallback
    }
  }, []);

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTicker]);

  // Duplicate for seamless loop
  const tickerItems = [...matches, ...matches];
  // Faster: ~2s per item instead of 4s
  const duration = Math.max(matches.length * 2, 15);

  return (
    <div
      className="relative overflow-hidden border-y border-surface-light bg-surface/50"
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex whitespace-nowrap py-2 animate-[ticker_var(--ticker-duration)_linear_infinite]"
        style={{
          "--ticker-duration": `${duration}s`,
        } as React.CSSProperties}
      >
        {tickerItems.map((match, i) => (
          <div
            key={`${match.id}-${i}`}
            className={`mx-2 inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
              match.type === "fc26"
                ? "border border-accent/20 bg-accent/5"
                : "border border-surface-light bg-surface"
            }`}
          >
            <span className="text-[11px]">{match.leagueFlag}</span>
            <span className="font-medium text-foreground/40">{match.league}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
}
