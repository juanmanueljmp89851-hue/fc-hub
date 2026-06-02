"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getProdeForEdit, updateProde } from "@/lib/actions/prode";
import { uploadTournamentBanner } from "@/lib/actions/upload";

export default function EditarProdePage() {
  const router = useRouter();
  const params = useParams();
  const prodeId = params.id as string;

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizeGeneral, setPrizeGeneral] = useState("");
  const [prizePerWeek, setPrizePerWeek] = useState("");
  const [prizeGroupOrder, setPrizeGroupOrder] = useState("");
  const [prizeRounds, setPrizeRounds] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getProdeForEdit(prodeId);
      if (!p) {
        router.push("/prode");
        return;
      }
      setName(p.name);
      setDescription(p.description ?? "");
      setPrizeGeneral(p.prizeGeneral ?? "");
      setPrizePerWeek(p.prizePerWeek ?? "");
      setPrizeGroupOrder(p.prizeGroupOrder ?? "");
      setPrizeRounds(p.prizeRounds ?? "");
      setImageUrl(p.imageUrl ?? "");
      setBannerUrl(p.bannerUrl ?? "");
      setLoaded(true);
    }
    load();
  }, [prodeId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await updateProde({
      prodeId,
      name,
      description,
      imageUrl: imageUrl || null,
      bannerUrl: bannerUrl || null,
      prizeGeneral,
      prizePerWeek,
      prizeGroupOrder,
      prizeRounds,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push(`/prode/${prodeId}`), 1500);
  }

  const inputClass =
    "w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none";

  if (!loaded) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-surface" />
            <div className="h-48 rounded-xl bg-surface" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Editar Prode</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
              Prode actualizado. Redirigiendo...
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Datos del Prode</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Nombre *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Image uploads */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Logo / Foto</label>
                <div className="flex items-center gap-3">
                  {imageUrl && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-light">
                      <img src={imageUrl} alt="Logo" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1.5 text-xs text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer rounded-lg border border-dashed border-surface-light px-3 py-2 text-sm text-foreground/50 hover:border-accent hover:text-accent">
                    {imageUploading ? "Subiendo..." : imageUrl ? "Cambiar" : "🏆 Subir foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setImageUploading(true);
                        const fd = new FormData();
                        fd.append("file", file);
                        const result = await uploadTournamentBanner(fd);
                        if (result.url) setImageUrl(result.url);
                        else setError(result.error ?? "Error al subir foto");
                        setImageUploading(false);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Banner</label>
                <div className="flex items-center gap-3">
                  {bannerUrl && (
                    <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-surface-light">
                      <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerUrl("")}
                        className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1.5 text-xs text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer rounded-lg border border-dashed border-surface-light px-3 py-2 text-sm text-foreground/50 hover:border-accent hover:text-accent">
                    {bannerUploading ? "Subiendo..." : bannerUrl ? "Cambiar" : "🖼️ Subir banner"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBannerUploading(true);
                        const fd = new FormData();
                        fd.append("file", file);
                        const result = await uploadTournamentBanner(fd);
                        if (result.url) setBannerUrl(result.url);
                        else setError(result.error ?? "Error al subir banner");
                        setBannerUploading(false);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premios</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Premio General</label>
                <input
                  type="text"
                  value={prizeGeneral}
                  onChange={(e) => setPrizeGeneral(e.target.value)}
                  placeholder="Ej: $5.000 al primero"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Premio por fecha</label>
                <input
                  type="text"
                  value={prizePerWeek}
                  onChange={(e) => setPrizePerWeek(e.target.value)}
                  placeholder="Ej: $1.000 cada jornada"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Premio orden de grupo</label>
                <input
                  type="text"
                  value={prizeGroupOrder}
                  onChange={(e) => setPrizeGroupOrder(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">Premio rondas avance</label>
                <input
                  type="text"
                  value={prizeRounds}
                  onChange={(e) => setPrizeRounds(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-lg bg-accent py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </main>
    </div>
  );
}
