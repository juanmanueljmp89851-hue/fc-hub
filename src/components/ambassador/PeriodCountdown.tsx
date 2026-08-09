"use client";

import { useState, useEffect } from "react";

export function PeriodCountdown({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function calc() {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setRemaining("Finalizado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setRemaining(`${days} ${days === 1 ? "día" : "días"}`);
      } else {
        setRemaining(`${hours} ${hours === 1 ? "hora" : "horas"}`);
      }
    }

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase text-foreground/40">⏱️ Finaliza en</p>
      <p className="text-2xl font-black text-gold">{remaining}</p>
    </div>
  );
}
