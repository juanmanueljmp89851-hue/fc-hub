"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleInfluencerActive, toggleInfluencerFeatured } from "@/lib/actions/admin";
import { refreshInfluencerVideos } from "@/lib/actions/influencers";

interface Influencer {
  id: string;
  name: string;
  slug: string;
  youtubeChannelId: string | null;
  active: boolean;
  featured: boolean;
  country: string | null;
  createdAt: string;
  _count: { videos: number };
}

export function InfluencerManager({ influencers }: { influencers: Influencer[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function handleToggleActive(id: string) {
    setLoading(id + "-active");
    await toggleInfluencerActive(id);
    router.refresh();
    setLoading("");
  }

  async function handleToggleFeatured(id: string) {
    setLoading(id + "-feat");
    await toggleInfluencerFeatured(id);
    router.refresh();
    setLoading("");
  }

  async function handleRefresh(id: string) {
    setLoading(id + "-refresh");
    const result = await refreshInfluencerVideos(id);
    if (result.error) {
      alert(result.error);
    }
    router.refresh();
    setLoading("");
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-light">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-light bg-surface">
            <th className="px-4 py-3 text-left font-medium text-foreground/50">Nombre</th>
            <th className="px-4 py-3 text-center font-medium text-foreground/50">País</th>
            <th className="px-4 py-3 text-center font-medium text-foreground/50">Videos</th>
            <th className="px-4 py-3 text-center font-medium text-foreground/50">YouTube</th>
            <th className="px-4 py-3 text-center font-medium text-foreground/50">Estado</th>
            <th className="px-4 py-3 text-center font-medium text-foreground/50">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {influencers.map((inf) => (
            <tr key={inf.id} className="border-b border-surface-light/50 last:border-0">
              <td className="px-4 py-3">
                <div>
                  <span className="font-medium">{inf.name}</span>
                  {inf.featured && <span className="ml-2 text-xs text-gold">★</span>}
                  <p className="text-xs text-foreground/40">/{inf.slug}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-center text-foreground/60">{inf.country ?? "—"}</td>
              <td className="px-4 py-3 text-center font-bold text-accent">{inf._count.videos}</td>
              <td className="px-4 py-3 text-center">
                {inf.youtubeChannelId ? (
                  <span className="text-xs text-green-400">Vinculado</span>
                ) : (
                  <span className="text-xs text-foreground/30">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  inf.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {inf.active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => handleToggleActive(inf.id)}
                    disabled={loading.startsWith(inf.id)}
                    className="rounded bg-surface-light px-2 py-1 text-xs text-foreground/60 hover:text-accent"
                  >
                    {inf.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(inf.id)}
                    disabled={loading.startsWith(inf.id)}
                    className="rounded bg-surface-light px-2 py-1 text-xs text-foreground/60 hover:text-gold"
                  >
                    {inf.featured ? "Quitar ★" : "★ Destacar"}
                  </button>
                  {inf.youtubeChannelId && (
                    <button
                      onClick={() => handleRefresh(inf.id)}
                      disabled={loading.startsWith(inf.id)}
                      className="rounded bg-surface-light px-2 py-1 text-xs text-foreground/60 hover:text-accent"
                    >
                      {loading === inf.id + "-refresh" ? "..." : "Refrescar"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
