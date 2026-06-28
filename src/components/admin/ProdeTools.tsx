"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { propagateBracket } from "@/lib/actions/admin";

export function ProdeTools() {
  return (
    <div className="space-y-6">
      <BracketPropagator />
    </div>
  );
}

function BracketPropagator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updates: number; log: string[] } | null>(null);

  async function handlePropagate() {
    setLoading(true);
    setResult(null);
    const res = await propagateBracket();
    if ("updates" in res) {
      setResult({ updates: res.updates, log: res.log });
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-surface-light bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">🔄 Propagar bracket</h3>
          <p className="text-xs text-foreground/50">
            Actualiza equipos en octavos/cuartos/semis/final con ganadores de rondas anteriores
          </p>
        </div>
        <button
          onClick={handlePropagate}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Propagando..." : "Propagar"}
        </button>
      </div>
      {result && (
        <div className="mt-3 rounded-lg bg-background p-3 text-xs">
          {result.updates === 0 ? (
            <p className="text-foreground/50">Sin cambios — no hay nuevos ganadores para propagar.</p>
          ) : (
            <>
              <p className="mb-2 font-bold text-green-400">✅ {result.updates} equipos actualizados</p>
              {result.log.map((line, i) => (
                <p key={i} className="text-foreground/60">• {line}</p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

