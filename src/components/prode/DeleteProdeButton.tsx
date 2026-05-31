"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { softDeleteProde } from "@/lib/actions/prode";

interface Props {
  prodeId: string;
  prodeName: string;
}

export function DeleteProdeButton({ prodeId, prodeName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Eliminar el prode "${prodeName}"? Podrás recuperarlo desde el panel de admin.`)) return;

    setLoading(true);
    try {
      await softDeleteProde(prodeId);
      router.push("/prode");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
