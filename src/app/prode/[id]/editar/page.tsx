"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getProdeForEdit, updateProde } from "@/lib/actions/prode";

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
