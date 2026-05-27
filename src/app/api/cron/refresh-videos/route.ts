import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLatestVideos } from "@/lib/services/youtube-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const influencers = await prisma.influencer.findMany({
      where: { active: true, youtubeChannelId: { not: null } },
      select: { id: true, youtubeChannelId: true, name: true },
    });

    let totalVideos = 0;

    for (const inf of influencers) {
      if (!inf.youtubeChannelId) continue;

      const videos = await getLatestVideos(inf.youtubeChannelId, 6);

      for (const video of videos) {
        await prisma.influencerVideo.upsert({
          where: { externalId: video.id },
          update: {
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            views: video.views,
          },
          create: {
            influencerId: inf.id,
            externalId: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            videoUrl: video.videoUrl,
            views: video.views,
            publishedAt: video.publishedAt,
          },
        });
      }

      totalVideos += videos.length;
    }

    return NextResponse.json({
      ok: true,
      influencers: influencers.length,
      videosProcessed: totalVideos,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
