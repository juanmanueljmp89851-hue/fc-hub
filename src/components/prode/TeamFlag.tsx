"use client";

import { TEAM_CODES } from "@/lib/teamFlags";

/** Small inline flag image next to team name */
export function TeamFlag({ team, size = 20 }: { team: string; size?: number }) {
  const code = TEAM_CODES[team];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w${size}/${code}.png`}
      alt={team}
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block"
      style={{ verticalAlign: "middle" }}
    />
  );
}
