"use server";

import { getLatestNews } from "@/lib/services/news-feed";
import type { NewsItem } from "@/lib/services/news-feed";

export type { NewsItem };

export async function fetchNews(limit = 20): Promise<NewsItem[]> {
  return getLatestNews(limit);
}
