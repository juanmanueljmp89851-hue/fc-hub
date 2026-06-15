"use client";

import Link from "next/link";

interface TeamInfo {
  id: string;
  name: string;
  tag: string | null;
  logoUrl: string | null;
}

interface MatchData {
  id: string;
  round: string | null;
  player1: { id: string; username: string; avatarUrl: string | null } | null;
  player2: { id: string; username: string; avatarUrl: string | null } | null;
  team1?: TeamInfo | null;
  team2?: TeamInfo | null;
  winner: { id: string; username: string } | null;
  resultP1: number | null;
  resultP2: number | null;
  status: string;
  seriesId: string | null;
  leg: number | null;
}

interface TournamentBracketProps {
  matches: MatchData[];
  isTeamTournament?: boolean;
}

function getMatchStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Pendiente", color: "text-foreground/40" },
    READY_P1: { label: "P1 listo", color: "text-gold" },
    READY_P2: { label: "P2 listo", color: "text-gold" },
    IN_PROGRESS: { label: "En curso", color: "text-accent" },
    PENDING_CONFIRMATION: { label: "Confirmando", color: "text-orange-400" },
    DISPUTED: { label: "Disputado", color: "text-red-400" },
    FINISHED: { label: "Finalizado", color: "text-foreground/40" },
    WALKOVER: { label: "W.O.", color: "text-foreground/40" },
  };
  return map[status] ?? { label: status, color: "text-foreground/40" };
}

function getRoundDisplayName(round: string, totalWinnersRounds: number): string {
  if (round === "GF-1") return "Gran Final";
  if (round === "3RD-PLACE") return "3er Puesto";
  const parts = round.split("-");
  if (parts.length >= 3) {
    const bracket = parts[0];
    const roundNum = parseInt(parts[1].replace("R", ""));
    if (bracket === "W") {
      const remaining = totalWinnersRounds - roundNum + 1;
      if (remaining === 1) return "Final";
      if (remaining === 2) return "Semifinal";
      if (remaining === 3) return "Cuartos";
      if (remaining === 4) return "Octavos";
      return `Ronda ${roundNum}`;
    }
    if (bracket === "L") return `Repechaje R${roundNum}`;
  }
  return round;
}

interface SeriesGroup {
  seriesId: string;
  matches: MatchData[];
  round: string;
}

function groupMatchesBySeries(matches: MatchData[]): (MatchData | SeriesGroup)[] {
  const result: (MatchData | SeriesGroup)[] = [];
  const seriesMap = new Map<string, MatchData[]>();
  const standalone: MatchData[] = [];

  for (const m of matches) {
    if (m.seriesId) {
      if (!seriesMap.has(m.seriesId)) seriesMap.set(m.seriesId, []);
      seriesMap.get(m.seriesId)!.push(m);
    } else {
      standalone.push(m);
    }
  }

  for (const m of standalone) result.push(m);
  for (const [seriesId, sMatches] of seriesMap) {
    sMatches.sort((a, b) => (a.leg ?? 0) - (b.leg ?? 0));
    result.push({ seriesId, matches: sMatches, round: sMatches[0].round ?? "" });
  }

  return result;
}

function getSeriesAggregate(matches: MatchData[]) {
  const leg1 = matches.find((m) => m.leg === 1);
  if (!leg1) return null;
  const playerA = leg1.player1?.id;
  const playerB = leg1.player2?.id;
  if (!playerA || !playerB) return null;

  let aggA = 0;
  let aggB = 0;
  let winsA = 0;
  let winsB = 0;

  for (const m of matches) {
    if (m.status !== "FINISHED") continue;
    if (m.player1?.id === playerA) {
      aggA += m.resultP1 ?? 0;
      aggB += m.resultP2 ?? 0;
    } else {
      aggA += m.resultP2 ?? 0;
      aggB += m.resultP1 ?? 0;
    }
    if (m.winner?.id === playerA) winsA++;
    else if (m.winner?.id === playerB) winsB++;
  }

  return { playerA, playerB, aggA, aggB, winsA, winsB, usernameA: leg1.player1?.username ?? "", usernameB: leg1.player2?.username ?? "" };
}

export function TournamentBracket({ matches, isTeamTournament }: TournamentBracketProps) {
  const winnersRounds = new Set(
    matches.filter((m) => m.round?.startsWith("W-")).map((m) => m.round),
  ).size;

  const rounds = new Map<string, MatchData[]>();
  for (const match of matches) {
    const round = match.round ?? "Ronda";
    if (!rounds.has(round)) rounds.set(round, []);
    rounds.get(round)!.push(match);
  }

  const roundEntries = Array.from(rounds.entries());

  if (roundEntries.length === 0) {
    return <p className="text-sm text-foreground/50">No hay partidos generados todavía</p>;
  }

  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {roundEntries.map(([roundName, roundMatches]) => {
        const items = groupMatchesBySeries(roundMatches);

        return (
          <div key={roundName} className="flex min-w-[220px] flex-col gap-4">
            <h4 className="text-center text-sm font-bold text-foreground/60">
              {getRoundDisplayName(roundName, winnersRounds)}
            </h4>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {items.map((item) => {
                if ("seriesId" in item) {
                  const s = item as SeriesGroup;
                  return <SeriesCard key={s.seriesId} series={s} isTeamTournament={isTeamTournament} />;
                }
                const m = item as MatchData;
                return <SingleMatchCard key={m.id} match={m} isTeamTournament={isTeamTournament} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SingleMatchCard({ match, isTeamTournament }: { match: MatchData; isTeamTournament?: boolean }) {
  const hasPlayers = match.player1 && match.player2;
  const isPlayable = hasPlayers && match.status !== "FINISHED" && match.status !== "WALKOVER" && match.status !== "CANCELLED";
  const statusLabel = getMatchStatusLabel(match.status);
  const name1 = isTeamTournament && match.team1 ? match.team1.name : (match.player1?.username ?? "TBD");
  const name2 = isTeamTournament && match.team2 ? match.team2.name : (match.player2?.username ?? "TBD");
  const content = (
    <>
      <PlayerRow
        username={name1}
        score={match.resultP1}
        isWinner={match.winner?.id === match.player1?.id}
        isBye={!match.player1}
      />
      <PlayerRow
        username={name2}
        score={match.resultP2}
        isWinner={match.winner?.id === match.player2?.id}
        isBye={!match.player2}
      />
      {hasPlayers && (
        <div className="mt-1 flex items-center justify-between">
          <span className={`text-[10px] font-medium ${statusLabel.color}`}>
            {statusLabel.label}
          </span>
          {isPlayable && (
            <span className="text-[10px] font-bold text-accent">
              🎮 Ir al duelo →
            </span>
          )}
        </div>
      )}
    </>
  );

  return hasPlayers ? (
    <Link
      href={`/arena/${match.id}`}
      className={`block rounded-lg border p-2 transition-colors ${
        isPlayable
          ? "border-accent/30 bg-accent/5 hover:border-accent/60"
          : "border-surface-light bg-background hover:border-accent/50"
      }`}
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-lg border border-surface-light bg-background p-2">
      {content}
    </div>
  );
}

function SeriesCard({ series, isTeamTournament }: { series: SeriesGroup; isTeamTournament?: boolean }) {
  const agg = getSeriesAggregate(series.matches);
  const finishedCount = series.matches.filter((m) => m.status === "FINISHED").length;
  const totalCount = series.matches.length;
  const nextMatch = series.matches.find(
    (m) => m.status !== "FINISHED" && m.status !== "WALKOVER" && m.status !== "CANCELLED",
  );
  const m0 = series.matches[0];
  const nameA = isTeamTournament && m0?.team1 ? m0.team1.name : (agg?.usernameA ?? m0?.player1?.username ?? "TBD");
  const nameB = isTeamTournament && m0?.team2 ? m0.team2.name : (agg?.usernameB ?? m0?.player2?.username ?? "TBD");

  return (
    <div className="rounded-lg border border-surface-light bg-background p-2">
      {/* Series header */}
      {agg && (
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-foreground/50">
          <span>Serie ({finishedCount}/{totalCount})</span>
          {agg.winsA + agg.winsB > 0 && (
            <span className="text-foreground/70">
              Global: {agg.aggA}-{agg.aggB}
            </span>
          )}
        </div>
      )}

      {/* Players with aggregate */}
      {agg ? (
        <>
          <PlayerRow
            username={nameA}
            score={agg.aggA}
            isWinner={agg.aggA > agg.aggB && finishedCount === totalCount}
            isBye={false}
          />
          <PlayerRow
            username={nameB}
            score={agg.aggB}
            isWinner={agg.aggB > agg.aggA && finishedCount === totalCount}
            isBye={false}
          />
        </>
      ) : (
        <>
          <PlayerRow
            username={nameA}
            score={null}
            isWinner={false}
            isBye={!m0?.player1}
          />
          <PlayerRow
            username={nameB}
            score={null}
            isWinner={false}
            isBye={!m0?.player2}
          />
        </>
      )}

      {/* Individual leg scores */}
      {finishedCount > 0 && (
        <div className="mt-1 flex gap-1">
          {series.matches.map((m) => (
            <span
              key={m.id}
              className={`text-[9px] rounded px-1 ${
                m.status === "FINISHED"
                  ? "bg-surface-light text-foreground/60"
                  : "text-foreground/30"
              }`}
            >
              {m.status === "FINISHED"
                ? `${m.resultP1}-${m.resultP2}`
                : `L${m.leg ?? "?"}`}
            </span>
          ))}
        </div>
      )}

      {/* Link to next playable match */}
      {nextMatch && nextMatch.player1 && nextMatch.player2 && (
        <Link
          href={`/arena/${nextMatch.id}`}
          className="mt-1 block text-center text-[10px] font-bold text-accent hover:underline"
        >
          🎮 Jugar Leg {nextMatch.leg} →
        </Link>
      )}
    </div>
  );
}

function PlayerRow({
  username,
  score,
  isWinner,
  isBye,
}: {
  username: string;
  score: number | null;
  isWinner: boolean;
  isBye: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
        isWinner
          ? "bg-accent/10 font-bold text-accent"
          : isBye
            ? "text-foreground/30 italic"
            : "text-foreground/70"
      }`}
    >
      <span className="truncate">{username}</span>
      {score !== null && <span className="ml-2 text-xs">{score}</span>}
    </div>
  );
}
