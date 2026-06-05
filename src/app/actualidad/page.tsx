import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NewsFeed } from "@/components/home/NewsFeed";
import { AdSlot } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Actualidad",
  description:
    "Noticias, novedades y actualizaciones de FC 26, Ultimate Team, eventos, esports y mercado.",
  alternates: { canonical: "/actualidad" },
  openGraph: {
    title: "Actualidad | Modo Fosa",
    description: "Últimas noticias de EA FC 26, eventos y mercado.",
  },
};

export default function ActualidadPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Actualidad EA FC 26",
    description: "Noticias, novedades y actualizaciones de FC 26, Ultimate Team, eventos y mercado.",
    url: "https://www.modofosa.com.ar/actualidad",
    isPartOf: { "@id": "https://www.modofosa.com.ar/#website" },
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Actualidad</h1>
          <p className="mt-1 text-foreground/60">
            Noticias, novedades y todo lo que pasa en el mundo del fútbol y FC 26
          </p>
        </div>

        {/* Ad Banner top */}
        <div className="mb-6">
          <AdSlot format="horizontal" />
        </div>

        <NewsFeed limit={80} />

        {/* Ad bottom */}
        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}
