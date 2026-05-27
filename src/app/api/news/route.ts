import { NextResponse } from "next/server";
import { getLatestNews } from "@/lib/services/news-feed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 16;
    const news = await getLatestNews(limit);
    return NextResponse.json(news);
  } catch (error) {
    console.error("[API /news] Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
