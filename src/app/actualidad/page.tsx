import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { NewsFeed } from "@/components/home/NewsFeed";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Actualidad",
  description:
    "Noticias, novedades y actualizaciones de FC 27, Ultimate Team, eventos, esports y mercado.",
  alternates: { canonical: "/actualidad" },
  openGraph: {
    title: "Actualidad | Modo Fosa",
    description: "Últimas noticias de EA FC 27, eventos y mercado.",
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default async function ActualidadPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      slug: true,
      title: true,
      summary: true,
      imageUrl: true,
      category: true,
      createdAt: true,
    },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Actualidad EA FC 27",
    description: "Noticias, novedades y actualizaciones de FC 27, Ultimate Team, eventos y mercado.",
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
            Noticias, novedades y todo lo que pasa en el mundo del fútbol y FC 27
          </p>
        </div>

        <div className="mb-6">
          <AdSlot format="horizontal" />
        </div>

        {articles.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-accent">📝 Notas Modo Fosa</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/actualidad/${a.slug}`}
                  className="group overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40"
                >
                  {a.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={a.imageUrl}
                        alt={a.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-accent">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/50 line-clamp-2">
                      {a.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground/70">🌐 Noticias del mundo</h2>
          <NewsFeed limit={80} />
        </section>

        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}
