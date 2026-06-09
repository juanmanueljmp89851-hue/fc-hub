"use client";

import { useState } from "react";
import { restoreProde } from "@/lib/actions/prode";
import { useRouter } from "next/navigation";

interface ProdeItem {
  id: string;
  name: string;
  visibility: string;
  status: string;
  createdBy: string;
  participants: number;
  joinRequests: number;
  createdAt: string;
  deletedAt: string | null;
  shareCode: string;
}

export function AdminProdeList({ prodes }: { prodes: ProdeItem[] }) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(prodeId: string) {
    setRestoringId(prodeId);
    try {
      await restoreProde(prodeId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al restaurar");
    }
    setRestoringId(null);
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Prodes ({prodes.length})</h2>
      <div className="overflow-x-auto rounded-xl border border-surface-light">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-light bg-surface/50 text-left text-xs text-foreground/50">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Creador</th>
              <th className="px-4 py-3">Visibilidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Participantes</th>
              <th className="px-4 py-3">Solicitudes</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-light">
            {prodes.map((prode) => {
              const isDeleted = !!prode.deletedAt;
              const displayStatus = isDeleted
                ? "Eliminado"
                : prode.status === "OPEN"
                  ? "Activo"
                  : prode.status === "IN_PROGRESS"
                    ? "En curso"
                    : "Finalizado";
              const statusColor = isDeleted
                ? "bg-red-500/20 text-red-400"
                : prode.status === "OPEN"
                  ? "bg-accent/20 text-accent"
                  : prode.status === "IN_PROGRESS"
                    ? "bg-gold/20 text-gold"
                    : "bg-foreground/10 text-foreground/50";

              return (
                <tr
                  key={prode.id}
                  className={isDeleted ? "opacity-60" : ""}
                >
                  <td className="px-4 py-3 font-medium">
                    {prode.name}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{prode.createdBy}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      prode.visibility === "PRIVATE"
                        ? "bg-surface-light text-foreground/50"
                        : "bg-accent/10 text-accent"
                    }`}>
                      {prode.visibility === "PRIVATE" ? "🔒 Privado" : "Público"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor}`}>
                      {displayStatus}
                    </span>
                    {isDeleted && (
                      <span className="ml-1 text-xs text-foreground/30">
                        {new Date(prode.deletedAt!).toLocaleDateString("es-AR")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{prode.participants}</td>
                  <td className="px-4 py-3 text-center">{prode.joinRequests}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/40">{prode.shareCode}</td>
                  <td className="px-4 py-3 text-xs text-foreground/40">
                    {new Date(prode.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!isDeleted && (
                        <a
                          href={`/prode/${prode.id}`}
                          className="rounded border border-surface-light px-2 py-1 text-xs text-foreground/60 hover:border-accent hover:text-accent"
                        >
                          Ver
                        </a>
                      )}
                      {isDeleted && (
                        <button
                          onClick={() => handleRestore(prode.id)}
                          disabled={restoringId === prode.id}
                          className="rounded border border-accent/30 px-2 py-1 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
                        >
                          {restoringId === prode.id ? "..." : "Restaurar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
