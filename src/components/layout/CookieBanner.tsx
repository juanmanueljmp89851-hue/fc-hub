"use client";

import { useState, useEffect } from "react";

const COOKIE_KEY = "mf_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on mount
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
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-foreground/70 text-center sm:text-left">
          Usamos cookies para mejorar tu experiencia, analíticas y publicidad.{" "}
          <a
            href="https://www.modofosa.com.ar/privacidad"
            className="text-accent underline hover:opacity-80"
          >
            Más info
          </a>
        </p>
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
    </div>
  );
}
