"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { createProde } from "@/lib/actions/prode";

export default function CrearProdePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizeGeneral, setPrizeGeneral] = useState("");
  const [prizePerWeek, setPrizePerWeek] = useState("");
  const [prizeGroupOrder, setPrizeGroupOrder] = useState("");
  const [prizeRounds, setPrizeRounds] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createProde({
      name,
      description: description || undefined,
      prizeGeneral: prizeGeneral || undefined,
      prizePerWeek: prizePerWeek || undefined,
      prizeGroupOrder: prizeGroupOrder || undefined,
      prizeRounds: prizeRounds || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.prode) {
      router.push(`/prode/${result.prode.id}`);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Crear Prode</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Prode</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Prode de la barra, Prode laburo..."
                  className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                  required
                  minLength={3}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional — reglas extras, info del grupo..."
                  className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premios</CardTitle>
            </CardHeader>
            <p className="mb-4 text-sm text-foreground/50">
              Definí qué se gana en cada categoría. Puede ser lo que vos quieras (asado, plata, cervezas, etc.)
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  🏆 Premio general (ganador total)
                </label>
                <input
                  type="text"
                  value={prizeGeneral}
                  onChange={(e) => setPrizeGeneral(e.target.value)}
                  placeholder="Ej: Asado gratis, $10.000, un joystick..."
                  className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  📅 Premio por fecha (mejor de cada jornada)
                </label>
                <input
                  type="text"
                  value={prizePerWeek}
                  onChange={(e) => setPrizePerWeek(e.target.value)}
                  placeholder="Ej: $1.000 por fecha, una birra..."
                  className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  📊 Premio por acertar orden del grupo
                </label>
                <input
                  type="text"
                  value={prizeGroupOrder}
                  onChange={(e) => setPrizeGroupOrder(e.target.value)}
                  placeholder="Ej: Bonus $5.000 si acertás los 4 puestos..."
                  className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/70">
                  🔮 Premio por acertar equipos que pasan ronda
                </label>
                <input
                  type="text"
                  value={prizeRounds}
                  onChange={(e) => setPrizeRounds(e.target.value)}
                  placeholder="Ej: $2.000 por acertar semis, $5.000 el campeón..."
                  className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                  maxLength={100}
                />
              </div>
            </div>
          </Card>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || name.length < 3}
            className="w-full rounded-lg bg-accent py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Prode"}
          </button>

          <p className="text-center text-xs text-foreground/40">
            Al crear el prode se genera un link para compartir con tus amigos
          </p>
        </form>
      </main>
    </div>
  );
}
