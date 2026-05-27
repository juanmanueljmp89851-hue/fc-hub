"use client";

interface MatchData {
  id: string;
  round: string | null;
  player1: { id: string; username: string; avatarUrl: string | null } | null;
  player2: { id: string; username: string; avatarUrl: string | null } | null;
  winner: { id: string; username: string } | null;
  resultP1: number | null;
  resultP2: number | null;
  status: string;
}

interface TournamentBracketProps {
  matches: MatchData[];
}

function getRoundDisplayName(round: string, totalWinnersRounds: number): string {
  if (round === "GF-1") return "Gran Final";
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

export function TournamentBracket({ matches }: TournamentBracketProps) {
  // Count winners rounds for naming
  const winnersRounds = new Set(
    matches.filter((m) => m.round?.startsWith("W-")).map((m) => m.round),
  ).size;

  // Agrupar por ronda
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
      {roundEntries.map(([roundName, roundMatches]) => (
        <div key={roundName} className="flex min-w-[220px] flex-col gap-4">
          <h4 className="text-center text-sm font-bold text-foreground/60">
            {getRoundDisplayName(roundName, winnersRounds)}
          </h4>
          <div className="flex flex-1 flex-col justify-around gap-4">
            {roundMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-lg border border-surface-light bg-background p-2"
              >
                <PlayerRow
                  username={match.player1?.username ?? "BYE"}
                  score={match.resultP1}
                  isWinner={match.winner?.id === match.player1?.id}
                  isBye={!match.player1}
                />
                <PlayerRow
                  username={match.player2?.username ?? "BYE"}
                  score={match.resultP2}
                  isWinner={match.winner?.id === match.player2?.id}
                  isBye={!match.player2}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
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
