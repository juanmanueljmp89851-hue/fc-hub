"use client";

import { useState, useEffect } from "react";

interface Props {
  scheduledTime: string;
  waitTimeMinutes: number;
}

export function WaitCountdown({ scheduledTime, waitTimeMinutes }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const scheduled = new Date(scheduledTime).getTime();
  const deadline = scheduled + waitTimeMinutes * 60 * 1000;
  const remaining = Math.max(0, deadline - now);

  if (remaining <= 0) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
        <p className="text-sm font-bold text-red-400">⏰ Tiempo de espera agotado</p>
        <p className="mt-1 text-xs text-foreground/50">El creador del torneo resolverá este partido</p>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isUrgent = remaining < 120000;

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${isUrgent ? "border-red-500/30 bg-red-500/10" : "border-accent/30 bg-accent/5"}`}>
      <p className="text-xs font-medium text-foreground/50">Tiempo para presentarse</p>
      <p className={`text-2xl font-black tabular-nums ${isUrgent ? "text-red-400 animate-pulse" : "text-accent"}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      <p className="mt-1 text-xs text-foreground/40">
        Horario programado: {new Date(scheduledTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
