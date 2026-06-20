"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface NewsItem {
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  source: string;
  sourceIcon: string;
  pubDate: string;
  language: "es" | "en";
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  return `hace ${days}d`;
}

function NewsImage({ src, alt, className, fallbackSize = "text-4xl" }: {
  src: string | null;
  alt: string;
  className: string;
  fallbackSize?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-light`} style={{ aspectRatio: "16/9" }}>
        <span className={`${fallbackSize} text-foreground/20`}>📰</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-surface-light`} style={{ aspectRatio: "16/9" }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform group-hover:scale-105"
        onError={() => setError(true)}
        loading="lazy"
        unoptimized
      />
    </div>
  );
}

interface NewsFeedProps {
  limit?: number;
  variant?: "home" | "full";
}

export function NewsFeed({ limit = 16, variant = "full" }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/news?limit=${limit}`)
      .then((res) => res.json())
      .then((data: NewsItem[]) => {
        if (data.length > 0) setNews(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Últimas Noticias</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-surface-light bg-surface">
              <div className="rounded-t-xl bg-surface-light" style={{ aspectRatio: "16/9" }} />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-surface-light" />
                <div className="h-3 w-1/2 rounded bg-surface-light" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  if (variant === "home") {
    const [featured, ...rest] = news;
    const sideNews = rest.slice(0, 8);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <span className="inline-block h-6 w-1 rounded-full bg-accent" />
            Últimas Noticias
          </h2>
          <a href="/actualidad" className="text-sm font-medium text-accent hover:underline">
            Ver más →
          </a>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Featured — big card left */}
          <a
            href={featured.link}
            {...(featured.link.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-surface-light bg-surface"
          >
            <NewsImage
              src={featured.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="relative z-10 p-6">
              <span className="mb-3 inline-block rounded-md bg-accent/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                {featured.source}
              </span>
              <h3 className="mb-2 text-xl font-bold leading-tight text-white group-hover:text-accent">
                {featured.title}
              </h3>
              {featured.description && (
                <p className="line-clamp-2 text-sm text-white/60">{featured.description}</p>
              )}
            </div>
          </a>

          {/* Side — small rows right */}
          <div className="flex h-full flex-col gap-2">
            {sideNews.map((item, i) => (
              <a
                key={i}
                href={item.link}
                {...(item.link.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                className="group flex flex-1 items-center gap-3 rounded-lg border border-surface-light bg-surface/50 px-4 py-3 transition-colors hover:border-accent/30 hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-accent">
                    {item.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-accent">{item.source}</span>
                    <span className="text-[10px] text-foreground/30">·</span>
                    <span className="text-[10px] text-foreground/30">{timeAgo(new Date(item.pubDate))}</span>
                  </div>
                </div>
                <span className="shrink-0 text-foreground/10 transition-colors group-hover:text-accent">›</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // variant="full" — grid cards (original layout for /actualidad)
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Últimas Noticias</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            {...(item.link.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            className="group overflow-hidden rounded-xl border border-surface-light bg-surface transition-colors hover:border-accent/30"
          >
            <NewsImage src={item.imageUrl} alt="" className="w-full rounded-t-xl" />
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-accent">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-foreground/50">{item.description}</p>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-accent">{item.source}</span>
                <span className="text-[10px] text-foreground/30">·</span>
                <span className="text-[10px] text-foreground/30">{timeAgo(new Date(item.pubDate))}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
