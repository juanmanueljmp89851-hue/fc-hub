"use client";

import { useState } from "react";
import {
  type FutPlayer,
  playerFaceUrl,
  cardBgUrl,
  getCardStyle,
  CARD_COLORS,
} from "@/types/player";

interface FutCardProps {
  player: FutPlayer;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { w: 150, h: 210 },
  md: { w: 185, h: 259 },
  lg: { w: 220, h: 308 },
};

export function FutCard({ player, onClick, size = "md" }: FutCardProps) {
  const [faceErr, setFaceErr] = useState(false);
  const [bgErr, setBgErr] = useState(false);

  const { w, h } = SIZES[size];
  const s = w / 185; // scale factor (md = 1x)

  const hasCardBg = !!player.cardImageId && !bgErr;
  const style = getCardStyle(player.cardImageId);
  const fallbackColors = CARD_COLORS[player.cardType];

  const isGK = player.position === "GK";
  const stats = isGK
    ? [
        { l: "DIV", v: player.gkDiving ?? 0 },
        { l: "MAN", v: player.gkHandling ?? 0 },
        { l: "SAQ", v: player.gkKicking ?? 0 },
        { l: "REF", v: player.gkReflexes ?? 0 },
        { l: "VEL", v: player.gkSpeed ?? 0 },
        { l: "POS", v: player.gkPositioning ?? 0 },
      ]
    : [
        { l: "RIT", v: player.pace },
        { l: "TIR", v: player.shooting },
        { l: "PAS", v: player.passing },
        { l: "REG", v: player.dribbling },
        { l: "DEF", v: player.defending },
        { l: "FÍS", v: player.physical },
      ];

  const displayName = player.commonName ?? player.name.split(" ").pop() ?? player.name;

  const faceUrl = player.eaId
    ? playerFaceUrl(player.eaId)
    : player.imageUrl;

  /* ── Proportions matched to FUTBIN card template zones ──
     Card bg is 516×716. Our overlay zones (as % of card height):
     - OVR + POS:  8%–25%  (top-left)
     - Face:      10%–52%  (center, behind OVR)
     - Name:      54%–62%
     - Stats:     64%–84%
     - Alt pos:   86%–95%
  */

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block flex-shrink-0 overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] focus:outline-none"
      style={{ width: w, height: h, borderRadius: 12 * s }}
    >
      {/* ─── CARD BACKGROUND ─── */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 12 * s,
          ...(hasCardBg
            ? {}
            : {
                background: fallbackColors.gradient,
                border: `1px solid ${fallbackColors.accent}25`,
              }),
        }}
      >
        {hasCardBg && (
          <img
            src={cardBgUrl(player.cardImageId!)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ borderRadius: 12 * s }}
            onError={() => setBgErr(true)}
            draggable={false}
            width={w}
            height={h}
          />
        )}
      </div>

      {/* ─── PLAYER FACE (absolute, large, behind text) ─── */}
      {faceUrl && !faceErr && (
        <div
          className="absolute overflow-hidden"
          style={{
            top: `${14 * s}px`,
            left: `${16 * s}px`,
            right: `${2 * s}px`,
            bottom: `${h * 0.28}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <img
            src={faceUrl}
            alt=""
            style={{
              maxHeight: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            }}
            onError={() => setFaceErr(true)}
            draggable={false}
          />
        </div>
      )}

      {/* ─── TEXT OVERLAY ─── */}
      <div
        className="relative flex h-full flex-col pointer-events-none"
        style={{
          color: hasCardBg ? style.textColor : fallbackColors.text,
        }}
      >
        {/* OVR + POS — top left */}
        <div
          style={{
            position: "absolute",
            top: `${66 * s}px`,
            left: `${32 * s}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 24 * s,
              fontWeight: 900,
              lineHeight: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            }}
          >
            {player.overall}
          </span>
          <span
            style={{
              fontSize: 9 * s,
              fontWeight: 800,
              lineHeight: 1,
              marginTop: 2 * s,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {player.position}
          </span>
        </div>

        {/* SPACER — push name below face area */}
        <div style={{ flex: `0 0 ${h * 0.65}px` }} />

        {/* NAME */}
        <div
          style={{
            textAlign: "center",
            fontSize: 10 * s,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: `0 ${8 * s}px`,
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            color: hasCardBg ? style.nameColor : fallbackColors.text,
          }}
          title={player.name}
        >
          {displayName}
        </div>

        {/* DIVIDER */}
        <div
          style={{
            height: 1,
            background: hasCardBg
              ? style.dividerColor
              : `linear-gradient(90deg, transparent, ${fallbackColors.accent}50, transparent)`,
            margin: `${3 * s}px ${12 * s}px`,
          }}
        />

        {/* STATS 3×2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: `${2 * s}px ${2 * s}px`,
            padding: `0 ${24 * s}px`,
          }}
        >
          {stats.map((st) => (
            <div
              key={st.l}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 2 * s,
              }}
            >
              <span
                style={{
                  fontSize: 12 * s,
                  fontWeight: 900,
                  lineHeight: 1.2,
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                {st.v}
              </span>
              <span
                style={{
                  fontSize: 7 * s,
                  fontWeight: 700,
                  lineHeight: 1,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  opacity: 0.75,
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                {st.l}
              </span>
            </div>
          ))}
        </div>

        {/* BOTTOM: Alt positions + SM/WF */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${2 * s}px ${10 * s}px 0`,
            marginTop: "auto",
            marginBottom: 4 * s,
          }}
        >
          <div style={{ display: "flex", gap: 3 * s }}>
            {player.alternatePositions?.slice(0, 2).map((pos) => (
              <span
                key={pos}
                style={{
                  fontSize: 6.5 * s,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: "rgba(0,0,0,0.3)",
                  padding: `${1 * s}px ${3 * s}px`,
                  borderRadius: 2 * s,
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                {pos}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 4 * s,
              fontSize: 7 * s,
              fontWeight: 700,
              opacity: 0.7,
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {player.skillMoves != null && <span>★{player.skillMoves}</span>}
            {player.weakFoot != null && <span>WF{player.weakFoot}</span>}
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-25"
        style={{
          background: hasCardBg
            ? `radial-gradient(circle, ${style.textColor}80, transparent)`
            : fallbackColors.gradient,
        }}
      />
    </button>
  );
}
