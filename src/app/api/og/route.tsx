import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(0, 255, 135, 0.08)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(0, 255, 135, 0.06)",
            filter: "blur(60px)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#00ff87",
              letterSpacing: "-0.02em",
            }}
          >
            MODO
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            FOSA
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            margin: 0,
            marginBottom: 16,
          }}
        >
          Stats, mercado y futbol. Donde vive el meta.
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.2em",
            color: "#00ff87",
            opacity: 0.7,
            margin: 0,
          }}
        >
          Comunidad EA FC Argentina
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
