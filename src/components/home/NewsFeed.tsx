"use client";

import { useEffect, useState } from "react";
import { fetchNews } from "@/lib/actions/news";
import type { NewsItem } from "@/lib/actions/news";

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

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews(16)
      .then(setNews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Últimas Noticias</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-surface-light bg-surface">
              <div className="h-40 rounded-t-xl bg-surface-light" />
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

  // First item = featured (big), rest = grid
  const [featured, ...rest] = news;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Últimas Noticias</h2>

      {/* Featured article */}
      <a
        href={featured.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-xl border border-surface-light bg-surface transition-colors hover:border-accent/50"
      >
        <div className="grid md:grid-cols-2">
          <div className="h-48 bg-surface-light md:h-64">
            {featured.imageUrl ? (
              <img
                src={featured.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-foreground/20">📰</div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm">{featured.sourceIcon}</span>
              <span className="text-xs font-medium text-accent">{featured.source}</span>
              <span className="text-xs text-foreground/40">{timeAgo(new Date(featured.pubDate))}</span>
            </div>
            <h3 className="mb-2 text-lg font-bold leading-tight group-hover:text-accent">
              {featured.title}
            </h3>
            {featured.description && (
              <p className="line-clamp-3 text-sm text-foreground/60">{featured.description}</p>
            )}
          </div>
        </div>
      </a>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rest.slice(0, 12).map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-xl border border-surface-light bg-surface transition-colors hover:border-accent/50"
          >
            <div className="h-36 bg-surface-light">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl text-foreground/20">📰</div>
              )}
            </div>
            <div className="p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-xs">{item.sourceIcon}</span>
                <span className="text-[10px] font-medium text-foreground/50">{item.source}</span>
                <span className="text-[10px] text-foreground/30">{timeAgo(new Date(item.pubDate))}</span>
              </div>
              <h4 className="line-clamp-3 text-sm font-semibold leading-snug group-hover:text-accent">
                {item.title}
              </h4>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
