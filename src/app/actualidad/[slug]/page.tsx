import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 300;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    select: { title: true, summary: true, imageUrl: true },
  });
  if (!article) return { title: "Artículo no encontrado" };

  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/actualidad/${params.slug}` },
    openGraph: {
      title: `${article.title} | Modo Fosa`,
      description: article.summary,
      type: "article",
      ...(article.imageUrl && { images: [{ url: article.imageUrl }] }),
    },
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, published: true },
  });
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    url: `https://www.modofosa.com.ar/actualidad/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Modo Fosa",
      url: "https://www.modofosa.com.ar",
    },
    ...(article.imageUrl && {
      image: { "@type": "ImageObject", url: article.imageUrl },
    }),
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/actualidad"
          className="mb-6 inline-flex items-center text-sm text-foreground/50 hover:text-accent"
        >
          ← Volver a Actualidad
        </Link>

        <article>
          <header className="mb-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                {article.category}
              </span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-light px-3 py-1 text-xs text-foreground/50"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-black leading-tight md:text-3xl">
              {article.title}
            </h1>
            <p className="mt-2 text-sm text-foreground/50">
              {formatDate(article.createdAt)}
              {article.sourceName && (
                <> · Fuente: {article.sourceUrl ? (
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {article.sourceName}
                  </a>
                ) : article.sourceName}</>
              )}
            </p>
          </header>

          {article.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-xl">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full object-cover"
                loading="eager"
              />
            </div>
          )}

          <div className="mb-6">
            <AdSlot format="horizontal" />
          </div>

          <div
            className="prose prose-invert max-w-none text-foreground/80
              prose-headings:text-foreground prose-headings:font-bold
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.sourceUrl && (
            <p className="mt-8 rounded-lg border border-surface-light bg-surface/30 p-4 text-sm text-foreground/50">
              📰 Nota original:{" "}
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {article.sourceName || "Ver fuente"}
              </a>
            </p>
          )}
        </article>

        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}
