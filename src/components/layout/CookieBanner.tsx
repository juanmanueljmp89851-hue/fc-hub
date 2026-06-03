"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "mf_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-light bg-surface/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="mx-auto max-w-4xl">
        {/* Main row */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="text-sm text-foreground/70 text-center sm:text-left">
            <p>
              Usamos cookies para mejorar tu experiencia, analíticas y publicidad.{" "}
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-accent underline hover:opacity-80"
              >
                {expanded ? "Menos info" : "Más info"}
              </button>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={decline}
              className="rounded-lg border border-surface-light px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              Rechazar
            </button>
            <button
              onClick={accept}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
            >
              Aceptar
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-3 rounded-lg border border-surface-light bg-background/50 p-4 text-xs text-foreground/60">
            <div>
              <h4 className="mb-1 font-bold text-foreground/80">Cookies esenciales</h4>
              <p>
                Necesarias para que el sitio funcione. Incluyen sesión de usuario,
                preferencias de tema y este mismo cartel de cookies. No se pueden desactivar.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-bold text-foreground/80">Cookies de analítica</h4>
              <p>
                Usamos Vercel Analytics para entender cómo se usa el sitio y mejorar
                la experiencia. No recopilan datos personales identificables.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-bold text-foreground/80">Cookies de publicidad</h4>
              <p>
                Google AdSense utiliza cookies para mostrar anuncios relevantes.
                Estos pueden rastrear tu actividad en otros sitios para personalizar
                la publicidad.{" "}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:opacity-80"
                >
                  Política de Google Ads
                </a>
              </p>
            </div>
            <p className="text-foreground/40">
              Al hacer clic en &quot;Aceptar&quot; aceptás todas las cookies. Con &quot;Rechazar&quot; solo se
              mantienen las esenciales.{" "}
              <Link href="/legal/privacidad" className="text-accent underline hover:opacity-80">
                Política de privacidad completa
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
