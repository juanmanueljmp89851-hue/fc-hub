import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Evoluciones — EA FC 27 | Modo Fosa",
  description:
    "Evoluciones de EA FC 27 en español: requisitos y mejoras. Próximamente.",
  alternates: { canonical: "/evoluciones" },
};

export default async function EvolucionesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-black">🧬 Evoluciones</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Evoluciones de EA FC 27 — requisitos y mejoras, en español.
          </p>
        </header>

        <div className="rounded-xl border border-surface-light bg-surface/30 p-12 text-center">
          <span className="mb-4 block text-5xl">🔬</span>
          <h2 className="text-xl font-bold text-foreground/80">Próximamente</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50">
            Estamos trabajando para traer las Evoluciones de FC 27. Cuando estén disponibles, se van a mostrar acá con sus requisitos y mejoras traducidos al español.
          </p>
        </div>
      </main>
    </div>
  );
}
