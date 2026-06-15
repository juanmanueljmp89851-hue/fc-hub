"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveTeam } from "@/lib/actions/team";

interface Props {
  teamId: string;
  teamName: string;
}

export function LeaveTeamButton({ teamId, teamName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    if (!confirm(`¿Seguro que querés abandonar ${teamName}? Para volver a ingresar, el DT deberá invitarte nuevamente.`)) return;
    setLoading(true);
    const result = await leaveTeam(teamId);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push("/equipos");
    }
  }

  return (
    <button
      onClick={handleLeave}
      disabled={loading}
      className="rounded-lg border border-red-400/50 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50"
    >
      {loading ? "..." : "Abandonar"}
    </button>
  );
}
