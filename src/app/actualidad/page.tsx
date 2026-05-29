import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NewsFeed } from "@/components/home/NewsFeed";
import { AdSlot } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Actualidad",
  description:
    "Noticias, novedades y actualizaciones de FC 26, Ultimate Team, eventos, esports y mercado.",
};

export default function ActualidadPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Actualidad</h1>
          <p className="mt-1 text-foreground/60">
            Noticias, novedades y todo lo que pasa en el mundo del fútbol y FC 26
          </p>
        </div>

        <NewsFeed />

        <div className="mt-8 flex justify-center">
          <AdSlot slot="inFeed" />
        </div>
      </main>
    </div>
  );
}
