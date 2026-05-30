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
    url: "https://www.ole.com.ar/rss/ultimas-noticias/",
    source: "Olé",
    sourceIcon: "🇦🇷",
    language: "es",
    category: "Fútbol",
  },
  {
    url: "https://as.com/rss/tags/ultimas_noticias.xml",
    source: "AS",
    sourceIcon: "🟡",
    language: "es",
    category: "Fútbol",
  },
  {
    url: "https://www.mundodeportivo.com/feed/rss/futbol",
    source: "Mundo Deportivo",
    sourceIcon: "🔵",
    language: "es",
    category: "Fútbol",
  },
  {
    url: "https://www.dexerto.com/ea-sports-fc/feed/",
    source: "Dexerto",
    sourceIcon: "⚡",
    language: "en",
    category: "EA FC",
  },
  {
    url: "https://www.dexerto.com/soccer/feed/",
    source: "Dexerto",
    sourceIcon: "⚡",
    language: "en",
    category: "Fútbol",
  },
  {
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    source: "BBC Sport",
    sourceIcon: "📺",
    language: "en",
    category: "Fútbol",
  },
];

// Keywords that indicate relevant content (football, EA FC, gaming)
const RELEVANCE_KEYWORDS = [
  // Football
  "futbol", "fútbol", "football", "soccer", "gol", "goal", "liga", "league",
  "champions", "libertadores", "mundial", "world cup", "copa", "selección",
  "messi", "mbappé", "mbappe", "haaland", "neymar", "premier", "laliga",
  "serie a", "bundesliga", "transfer", "fichaje", "traspaso",
  // EA FC / Gaming
  "ea fc", "ea sports", "fc 25", "fc 26", "fc25", "fc26", "fc 27", "fut ", "ultimate team",
  "fifa", "pro clubs", "esports", "esport", "e-sport", "gaming", "videojuego",
  "playstation", "xbox", "pc gaming", "torneo", "tournament", "rush mode",
  "evolutions", "icon", "hero", "tots", "toty", "potm", "sbc",
  // Teams
  "barcelona", "real madrid", "boca", "river", "arsenal", "liverpool",
  "man city", "manchester", "bayern", "inter", "milan", "juventus", "psg",
  "racing", "independiente", "san lorenzo",
];

// Sources whose feeds are already topic-specific (no filtering needed)
const TRUSTED_SOURCES = new Set(["Marca", "Marca Gaming", "BBC Sport", "Olé", "AS", "Mundo Deportivo"]);

// Negative keywords — filter out non-sport content that sneaks through
const NEGATIVE_KEYWORDS = [
  "cia ", "espionaje", "envenenó", "envenenamiento", "asesinato", "murder",
  "crimen", "crime", "criminal", "policía", "police", "arrested", "detenido",
  "drogas", "drug", "narcotráfico", "robo", "robbery", "violencia doméstica",
  "abuso", "abuse", "accidente", "accident", "muerto", "fallecido", "obituary",
  "política", "político", "election", "elección", "parlamento", "parliament",
  "brexit", "trump", "biden", "putin", "guerra", "war ", "conflicto bélico",
  "terremoto", "earthquake", "incendio forestal", "wildfire",
  "reality show", "big brother", "kardashian",
];

function isRelevantNews(item: NewsItem): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();

  // Check negative keywords first (applies to ALL sources)
  if (NEGATIVE_KEYWORDS.some((kw) => text.includes(kw))) return false;

  // Skip positive filter for topic-specific feeds
  if (TRUSTED_SOURCES.has(item.source)) return true;

  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

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
  // Try media:content with image
  const mediaContent = itemXml.match(/<media:content[^>]+url="([^"]+)"/);
  if (mediaContent) {
    const url = mediaContent[1];
    if (url.match(/\.(jpg|jpeg|png|webp|gif)/i)) return url;
  }
  // Try media:thumbnail (BBC Sport, Marca)
  const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/);
  if (mediaThumbnail) return mediaThumbnail[1];
  // Try enclosure (Dexerto)
  const enclosure = itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/);
  if (enclosure) return enclosure[1];
  // Try enclosure without type check
  const enclosureAny = itemXml.match(/<enclosure[^>]+url="([^"]+)"/);
  if (enclosureAny && enclosureAny[1].match(/\.(jpg|jpeg|png|webp|gif)/i)) return enclosureAny[1];
  // Try img in description (skip tracking pixels)
  const imgMatch = itemXml.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch && !imgMatch[1].includes("imrworldwide") && imgMatch[1].match(/\.(jpg|jpeg|png|webp|gif)/i)) return imgMatch[1];
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

async function fetchFeed(config: FeedConfig): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const res = await fetch(config.url, {
      next: { revalidate: 900 }, // 15 min cache
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ModoFosa/1.0; +https://modofosa.com.ar)",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, config);
  } catch {
    return [];
  }
}

// --- Translation (Google Translate free API, 3s timeout, fail = keep original) ---
async function translateText(text: string): Promise<string> {
  if (!text) return text;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return text;
    const data = await res.json();
    // Response format: [[["translated text","original text",...],...],...]
    const translated = data?.[0]?.map((s: [string]) => s[0]).join("") || text;
    return translated;
  } catch {
    return text; // timeout or error → keep original
  }
}

async function translateItems(items: NewsItem[]): Promise<NewsItem[]> {
  const englishItems = items.filter((i) => i.language === "en");
  if (englishItems.length === 0) return items;

  // Translate title + description in parallel with individual timeouts
  const titleTranslations = await Promise.allSettled(
    englishItems.map((item) => translateText(item.title))
  );
  const descTranslations = await Promise.allSettled(
    englishItems.map((item) => translateText(item.description))
  );

  let idx = 0;
  return items.map((item) => {
    if (item.language !== "en") return item;
    const titleResult = titleTranslations[idx];
    const descResult = descTranslations[idx];
    idx++;
    const translatedTitle =
      titleResult.status === "fulfilled" ? titleResult.value : item.title;
    const translatedDesc =
      descResult.status === "fulfilled" ? descResult.value : item.description;
    // Wrap link with Google Translate so user reads full article in Spanish
    const translatedLink = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(item.link)}`;
    return { ...item, title: translatedTitle, description: translatedDesc, link: translatedLink, language: "es" as const };
  });
}

// --- Deduplication (by normalized title similarity) ---
function normalizeForDedup(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDuplicate(a: string, b: string): boolean {
  if (a === b) return true;
  // Check if one contains 80%+ of the other's words
  const wordsA = a.split(" ");
  const wordsB = b.split(" ");
  if (wordsA.length < 3 || wordsB.length < 3) return a === b;
  const setB = new Set(wordsB);
  const overlap = wordsA.filter((w) => setB.has(w)).length;
  return overlap / Math.max(wordsA.length, wordsB.length) > 0.7;
}

function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen: string[] = [];
  return items.filter((item) => {
    const norm = normalizeForDedup(item.title);
    if (seen.some((s) => isDuplicate(norm, s))) return false;
    seen.push(norm);
    return true;
  });
}

// --- In-memory cache (5 min TTL, avoids 6 RSS fetches per request) ---
let cachedNews: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  let allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems = allItems.concat(result.value);
    }
  }

  // Filter irrelevant content (e.g. crime news from general feeds)
  allItems = allItems.filter(isRelevantNews);

  // Sort by date, newest first
  allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Deduplicate similar titles
  allItems = deduplicateNews(allItems);

  // Take top 50 (cache more than needed so limit param still works)
  allItems = allItems.slice(0, 50);

  // Translate English titles to Spanish (with timeout)
  allItems = await translateItems(allItems);

  return allItems;
}

export async function getLatestNews(limit = 20): Promise<NewsItem[]> {
  const now = Date.now();

  if (cachedNews && now - cacheTimestamp < CACHE_TTL) {
    return cachedNews.slice(0, limit);
  }

  const news = await fetchAllNews();
  cachedNews = news;
  cacheTimestamp = now;

  return news.slice(0, limit);
}
