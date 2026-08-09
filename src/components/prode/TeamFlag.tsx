"use client";

import Image from "next/image";
import { TEAM_CODES } from "@/lib/teamFlags";

const VALID_WIDTHS = [16, 20, 24, 32, 40, 48, 60, 80];

function closestWidth(w: number): number {
  return VALID_WIDTHS.reduce((prev, curr) =>
    Math.abs(curr - w) < Math.abs(prev - w) ? curr : prev
  );
}

export function TeamFlag({ team, size = 20 }: { team: string; size?: number }) {
  const code = TEAM_CODES[team];
  if (!code) return null;
  const w = closestWidth(size);
  return (
    <Image
      src={`https://flagcdn.com/w${w}/${code}.png`}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block shrink-0"
      style={{ verticalAlign: "middle" }}
      unoptimized
    />
  );
}
