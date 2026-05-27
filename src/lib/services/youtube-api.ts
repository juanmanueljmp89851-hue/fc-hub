const API_BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY not configured");
  return key;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: string;
  publishedAt: Date;
}

interface YouTubeChannel {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string | null;
  subscribers: string;
  description: string;
}

interface ApiSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: { high: { url: string } };
  };
}

interface ApiVideoItem {
  id: string;
  statistics: { viewCount: string };
}

interface ApiChannelItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { high: { url: string } };
  };
  brandingSettings?: {
    image?: { bannerExternalUrl?: string };
  };
  statistics: {
    subscriberCount: string;
  };
}

export async function getChannelInfo(channelId: string): Promise<YouTubeChannel> {
  const params = new URLSearchParams({
    part: "snippet,statistics,brandingSettings",
    id: channelId,
    key: getApiKey(),
  });

  const res = await fetch(`${API_BASE}/channels?${params}`);
  const data = await res.json();
  const item: ApiChannelItem = data.items[0];

  return {
    id: item.id,
    name: item.snippet.title,
    avatarUrl: item.snippet.thumbnails.high.url,
    bannerUrl: item.brandingSettings?.image?.bannerExternalUrl ?? null,
    subscribers: formatCount(item.statistics.subscriberCount),
    description: item.snippet.description,
  };
}

export async function getLatestVideos(channelId: string, maxResults = 6): Promise<YouTubeVideo[]> {
  const searchParams = new URLSearchParams({
    part: "snippet",
    channelId,
    maxResults: String(maxResults),
    order: "date",
    type: "video",
    key: getApiKey(),
  });

  const searchRes = await fetch(`${API_BASE}/search?${searchParams}`);
  const searchData = await searchRes.json();
  const items: ApiSearchItem[] = searchData.items ?? [];

  if (items.length === 0) return [];

  // Get view counts
  const videoIds = items.map((i) => i.id.videoId).join(",");
  const statsParams = new URLSearchParams({
    part: "statistics",
    id: videoIds,
    key: getApiKey(),
  });

  const statsRes = await fetch(`${API_BASE}/videos?${statsParams}`);
  const statsData = await statsRes.json();
  const statsMap = new Map<string, string>(
    (statsData.items ?? []).map((v: ApiVideoItem) => [v.id, v.statistics.viewCount]),
  );

  return items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.high.url,
    videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    views: formatCount(statsMap.get(item.id.videoId) ?? "0"),
    publishedAt: new Date(item.snippet.publishedAt),
  }));
}

function formatCount(raw: string): string {
  const n = parseInt(raw);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
