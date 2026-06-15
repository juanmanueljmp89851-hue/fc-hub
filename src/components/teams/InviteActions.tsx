"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondTeamInvite } from "@/lib/actions/team";

interface Props {
  inviteId: string;
}

export function InviteActions({ inviteId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRespond(accept: boolean) {
    setLoading(true);
    const result = await respondTeamInvite(inviteId, accept);
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
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Aceptar
      </button>
      <button
        onClick={() => handleRespond(false)}
        disabled={loading}
        className="rounded-lg border border-surface-light px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
      >
        Rechazar
      </button>
    </div>
  );
}
