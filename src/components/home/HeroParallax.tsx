"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

export function HeroParallax() {
  const heroRef = useRef<HTMLDivElement>(null);
  const tribunaRef = useRef<HTMLDivElement>(null);
  const jugadorRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // ── Parallax vanilla (rAF + translate3d) ──
  const tickingRef = useRef(false);

  const applyParallax = useCallback(() => {
    const hero = heroRef.current;
    const tribuna = tribunaRef.current;
    const jugador = jugadorRef.current;
    const indicator = scrollIndicatorRef.current;
    if (!hero || !tribuna || !jugador) return;

    const rect = hero.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > window.innerHeight + 100) {
      tickingRef.current = false;
      return;
    }

    const scrolled = window.scrollY;
    tribuna.style.transform = `translate3d(0, ${scrolled * 0.25}px, 0) scale(1.04)`;
    jugador.style.transform = `translate3d(0, ${scrolled * 0.55}px, 0)`;

    if (indicator) {
      indicator.style.opacity = scrolled > 80 ? "0" : "1";
    }

    tickingRef.current = false;
  }, []);

  const onScroll = useCallback(() => {
    if (!tickingRef.current) {
      tickingRef.current = true;
      requestAnimationFrame(applyParallax);
    }
  }, [applyParallax]);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width:680px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion:reduce)");

    function setup() {
      const enabled = !mqMobile.matches && !mqMotion.matches;
      if (enabled) {
        applyParallax();
        window.addEventListener("scroll", onScroll, { passive: true });
      } else {
        window.removeEventListener("scroll", onScroll);
        if (tribunaRef.current) tribunaRef.current.style.transform = "";
        if (jugadorRef.current) jugadorRef.current.style.transform = "";
      }
    }

    setup();
    mqMobile.addEventListener("change", setup);
    mqMotion.addEventListener("change", setup);

    return () => {
      window.removeEventListener("scroll", onScroll);
      mqMobile.removeEventListener("change", setup);
      mqMotion.removeEventListener("change", setup);
    };
  }, [applyParallax, onScroll]);

  return (
    <div
      ref={heroRef}
      style={{
        position: "relative",
        minHeight: "600px",
        overflow: "hidden",
        isolation: "isolate",
        backgroundColor: "rgb(10,14,26)",
      }}
    >
      {/* CAPA 1 — Tribuna fondo */}
      <div
        ref={tribunaRef}
        style={{
          position: "absolute",
          inset: "-6% 0",
          willChange: "transform",
          transform: "scale(1.04)",
          filter: "saturate(1.06) brightness(0.96)",
        }}
      >
        <Image
          src="/images/tribuna.webp"
          alt=""
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 38%" }}
        />
      </div>

      {/* CAPA 2 — Jugador foreground */}
      <div
        ref={jugadorRef}
        className="hero-jugador-anim"
        style={{
          position: "absolute",
          inset: 0,
          willChange: "transform",
          filter:
            "drop-shadow(0 22px 55px rgba(0,0,0,0.6)) brightness(1.15) contrast(1.05)",
          zIndex: 5,
        }}
      >
        <Image
          src="/images/jugador.webp"
          alt="Jugador Modo Fosa"
          fill
          priority
          className="hero-jugador-img"
          style={{
            objectFit: "cover",
          }}
        />
      </div>

      {/* Film grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 6,
          pointerEvents: "none",
          opacity: 0.32,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
          backgroundSize: "240px 240px",
        }}
      />

      {/* Vignette + side darken */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 90% at 50% 18%, transparent 40%, rgba(10,14,26,0.55) 100%), linear-gradient(90deg, rgba(10,14,26,0.7) 0%, transparent 30%, transparent 70%, rgba(10,14,26,0.5) 100%)",
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          zIndex: 3,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(10,14,26,0.85) 62%, rgb(10,14,26) 100%)",
        }}
      />

      {/* Green glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background:
            "radial-gradient(60% 50% at 50% 60%, rgba(0,255,135,0.12), transparent 70%)",
        }}
      />

      {/* CONTENIDO TEXTO */}
      <div
        style={{
          position: "relative",
          zIndex: 7,
          height: "min(86vh, 780px)",
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div>
          {/* Eyebrow badge */}
          <div className="hero-fade-in" style={{ marginBottom: "28px", animationDelay: "0.2s" }}>
            <span
              className="hero-badge-text"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "11.5px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgb(0,255,135)",
                padding: "7px 14px",
                borderRadius: "30px",
                background: "rgba(0,255,135,0.07)",
                border: "1px solid rgba(0,255,135,0.22)",
                backdropFilter: "blur(6px)",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "rgb(0,255,135)",
                  boxShadow: "0 0 0 0 rgba(0,255,135,0.6)",
                  animation: "pulse 2s infinite",
                }}
              />
              Todo el universo EA FC y fútbol en una sola plataforma
            </span>
          </div>

          {/* H1 */}
          <h1
            className="hero-h1"
            style={{
              fontSize: "clamp(38px, 6.7vw, 90px)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              marginBottom: "22px",
              textWrap: "balance",
            }}
          >
            <span className="hero-slide-up" style={{ animationDelay: "0.4s" }}>
              Stats, mercado y fútbol.
            </span>
            <br />
            <span
              className="hero-slide-up"
              style={{
                animationDelay: "0.55s",
                background:
                  "linear-gradient(100deg, rgb(0,255,135) 0%, #6effb0 45%, #FFD700 110%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 0 28px rgba(0,255,135,0.28))",
              }}
            >
              No salís más, caíste.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-fade-in"
            style={{
              fontSize: "clamp(15px, 1.5vw, 18.5px)",
              color: "rgb(150,160,182)",
              maxWidth: "640px",
              fontWeight: 400,
              marginBottom: "34px",
              animationDelay: "0.75s",
            }}
          >
            Donde vive el meta.{" "}
            <b style={{ color: "rgb(233,238,247)", fontWeight: 600 }}>
              Armá tu squad
            </b>
            , seguí precios en vivo y sentí el fútbol de primera. La
            comunidad ya está adentro.
          </p>

          {/* CTA buttons */}
          <div className="hero-fade-in" style={{ display: "flex", gap: "14px", flexWrap: "wrap", animationDelay: "0.9s" }}>
            <Link href="/torneos" className="btn-primary-hero">
              Entrar a la Fosa →
            </Link>
            <Link href="/jugadores" className="btn-ghost-hero">
              Ver Cartas FC26
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        ref={scrollIndicatorRef}
        style={{
          position: "relative",
          zIndex: 7,
          margin: "-54px auto 34px",
          width: "fit-content",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          color: "rgb(96,106,128)",
          fontSize: "10.5px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 600,
          transition: "opacity 0.3s",
        }}
      >
        <div
          style={{
            width: "22px",
            height: "34px",
            border: "1.5px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "6px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "3px",
              height: "7px",
              borderRadius: "2px",
              background: "rgb(0,255,135)",
              animation: "scrolld 1.8s infinite",
            }}
          />
        </div>
        Scrolleá
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0,255,135,0.5); }
          70% { box-shadow: 0 0 0 9px rgba(0,255,135,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,255,135,0); }
        }
        @keyframes scrolld {
          0% { opacity: 0; transform: translate(-50%, 0); }
          40% { opacity: 1; }
          80% { opacity: 0; transform: translate(-50%, 11px); }
          100% { opacity: 0; }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroJugadorIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hero-fade-in {
          opacity: 0;
          animation: heroFadeIn 0.7s ease-out forwards;
        }
        .hero-slide-up {
          display: inline-block;
          opacity: 0;
          animation: heroSlideUp 0.7s ease-out forwards;
        }
        .hero-jugador-anim {
          opacity: 0;
          animation: heroJugadorIn 1.2s ease-out 0.8s forwards;
        }
        .btn-primary-hero {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-weight: 700;
          font-size: 14.5px;
          padding: 14px 26px;
          border-radius: 13px;
          background: linear-gradient(100deg, rgb(0,255,135) 0%, #6effb0 45%, #FFD700 110%);
          color: #04130b;
          box-shadow: 0 10px 34px -12px rgba(0,255,135,0.7);
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s;
        }
        .btn-primary-hero:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 44px -14px rgba(0,255,135,0.85);
        }
        .btn-ghost-hero {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-weight: 700;
          font-size: 14.5px;
          padding: 14px 26px;
          border-radius: 13px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgb(233,238,247);
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1), border-color 0.3s, background 0.3s;
        }
        .btn-ghost-hero:hover {
          transform: translateY(-3px);
          border-color: rgba(0,255,135,0.55);
          background: rgba(0,255,135,0.06);
        }
        .hero-jugador-img {
          object-position: 70% 22%;
        }
        @media (max-width: 680px) {
          .hero-jugador-anim {
            inset: 0 !important;
            transform: none !important;
          }
          .hero-jugador-img {
            object-position: 70% 22% !important;
          }
          .hero-badge-text {
            font-size: 7px !important;
            letter-spacing: 0.08em !important;
            padding: 5px 10px !important;
            gap: 6px !important;
          }
          .hero-h1 {
            font-size: clamp(24px, 7.5vw, 36px) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
          .hero-fade-in, .hero-slide-up, .hero-jugador-anim { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
