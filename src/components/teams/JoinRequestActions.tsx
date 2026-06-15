"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondJoinRequest } from "@/lib/actions/team";

interface Props {
  requestId: string;
}

export function JoinRequestActions({ requestId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRespond(accept: boolean) {
    setLoading(true);
    const result = await respondJoinRequest(requestId, accept);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => handleRespond(true)}
        disabled={loading}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Aceptar
      </button>
      <button
        onClick={() => handleRespond(false)}
        disabled={loading}
        className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
      >
        Rechazar
      </button>
    </div>
  );
}
