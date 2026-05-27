/**
 * RSS News Feed Service
 * Fetches from multiple sources, parses XML, sorts by date, translates English titles.
 */

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  source: string;
  sourceIcon: string;
  pubDate: Date;
  language: "es" | "en";
}

interface FeedConfig {
  url: string;
  source: string;
  sourceIcon: string;
  language: "es" | "en";
  category?: string;
}

const FEEDS: FeedConfig[] = [
  {
    url: "https://e00-marca.uecdn.es/rss/futbol.xml",
    source: "Marca",
    sourceIcon: "🔴",
    language: "es",
    category: "Fútbol",
  },
  {
    url: "https://e00-marca.uecdn.es/rss/videojuegos.xml",
    source: "Marca Gaming",
    sourceIcon: "🎮",
    language: "es",
    category: "Gaming",
  },
  {
    url: "https://www.dexerto.com/feed/",
    source: "Dexerto",
    sourceIcon: "⚡",
    language: "en",
    category: "Esports",
  },
  {
    url: "https://www.espn.com/espn/rss/soccer/news",
    source: "ESPN",
    sourceIcon: "📺",
    language: "en",
    category: "Fútbol",
  },
];

function extractCDATA(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractFromTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? extractCDATA(match[1]) : "";
}

function extractImageUrl(itemXml: string): string | null {
  // Try media:content
  const mediaContent = itemXml.match(/url="([^"]+)"/);
  if (mediaContent) {
    const url = mediaContent[1];
    if (url.match(/\.(jpg|jpeg|png|webp|gif)/i)) return url;
  }
  // Try media:thumbnail
  const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]+url="([^"]+)"/);
  if (mediaThumbnail) return mediaThumbnail[1];
  // Try enclosure
  const enclosure = itemXml.match(/<enclosure[^>]+url="([^"]+)"/);
  if (enclosure) return enclosure[1];
  // Try img in description
  const imgMatch = itemXml.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch && !imgMatch[1].includes("imrworldwide")) return imgMatch[1];
  return null;
}

function parseRSSItems(xml: string, config: FeedConfig): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = stripHtml(extractFromTag(itemXml, "title"));
    const description = stripHtml(extractFromTag(itemXml, "description")).slice(0, 200);
    const link = extractFromTag(itemXml, "link").trim() || extractFromTag(itemXml, "guid").trim();
    const pubDateStr = extractFromTag(itemXml, "pubDate");
    const imageUrl = extractImageUrl(itemXml);

    if (!title || !link) continue;

    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

    items.push({
      title,
      description,
      link,
      imageUrl,
      source: config.source,
      sourceIcon: config.sourceIcon,
      pubDate,
      language: config.language,
    });
  }

  return items;
}

async function translateText(text: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return text;
    const data = await res.json();
    // Response format: [[["translated","original",...],...],...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((segment: string[]) => segment[0]).join("");
    }
    return text;
  } catch {
    return text;
  }
}

async function fetchFeed(config: FeedConfig): Promise<NewsItem[]> {
  try {
    const res = await fetch(config.url, {
      next: { revalidate: 900 }, // 15 min cache
      headers: {
        "User-Agent": "ModoFosa/1.0 (RSS Reader)",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, config);
  } catch {
    return [];
  }
}

export async function getLatestNews(limit = 20): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  let allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems = allItems.concat(result.value);
    }
  }

  // Sort by date, newest first
  allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Take top items
  const topItems = allItems.slice(0, limit);

  // Translate English titles
  const translated = await Promise.all(
    topItems.map(async (item) => {
      if (item.language === "en") {
        const [translatedTitle, translatedDesc] = await Promise.all([
          translateText(item.title),
          item.description ? translateText(item.description) : Promise.resolve(""),
        ]);
        return { ...item, title: translatedTitle, description: translatedDesc };
      }
      return item;
    })
  );

  return translated;
}
