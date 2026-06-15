"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    icon: "🏆",
    title: "Torneos",
    desc: "Creá o unite a torneos de FC 26 con amigos o la comunidad.",
    link: "/torneos",
  },
  {
    icon: "⚔️",
    title: "Duelos",
    desc: "Desafiá a cualquier jugador a un duelo casual 1vs1.",
    link: "/jugar",
  },
  {
    icon: "📊",
    title: "Ranking",
    desc: "Subí de posición ganando partidos. Cada victoria suma puntos.",
    link: "/ranking",
  },
  {
    icon: "⚽",
    title: "Prode Mundial",
    desc: "Predecí resultados del Mundial 2026 y competí con amigos.",
    link: "/prode",
  },
  {
    icon: "💬",
    title: "Mensajes",
    desc: "Chateá con otros jugadores desde el ícono de chat arriba.",
    link: "/mensajes",
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding-done");
    if (!seen) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("onboarding-done", "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-surface-light bg-surface p-6 shadow-2xl">
        <div className="mb-4 text-center">
          <span className="mb-2 block text-4xl">{current.icon}</span>
          <h2 className="text-lg font-bold">{current.title}</h2>
          <p className="mt-1 text-sm text-foreground/60">{current.desc}</p>
        </div>

        {/* Progress dots */}
        <div className="mb-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-4 bg-accent" : "w-1.5 bg-surface-light"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 rounded-lg border border-surface-light py-2 text-sm font-medium text-foreground/60 hover:text-foreground"
            >
              Anterior
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-background hover:opacity-90"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-background hover:opacity-90"
            >
              Empezar
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="mt-3 w-full text-center text-xs text-foreground/30 hover:text-foreground/50"
        >
          Omitir tutorial
        </button>
      </div>
    </div>
  );
}
