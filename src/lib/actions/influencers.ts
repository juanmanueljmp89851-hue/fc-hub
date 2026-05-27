"use server";

import { prisma } from "@/lib/db";
import { getLatestVideos } from "@/lib/services/youtube-api";
import { revalidatePath } from "next/cache";

export async function getInfluencers(options?: { featured?: boolean; specialty?: string }) {
  const where: Record<string, unknown> = { active: true };
  if (options?.featured) where.featured = true;
  if (options?.specialty) where.specialty = { has: options.specialty };

  const influencers = await prisma.influencer.findMany({
    where,
    include: {
      videos: {
        orderBy: { publishedAt: "desc" },
        take: 3,
      },
    },
  });

  // Sort by latest video date (newest first), then featured, then name
  return influencers.sort((a, b) => {
    const aDate = a.videos[0]?.publishedAt?.getTime() ?? 0;
    const bDate = b.videos[0]?.publishedAt?.getTime() ?? 0;
    if (bDate !== aDate) return bDate - aDate;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getInfluencerBySlug(slug: string) {
  return prisma.influencer.findUnique({
    where: { slug },
    include: {
      videos: {
        orderBy: { publishedAt: "desc" },
        take: 12,
      },
    },
  });
}

export async function refreshInfluencerVideos(influencerId: string) {
  const influencer = await prisma.influencer.findUnique({
    where: { id: influencerId },
  });

  if (!influencer?.youtubeChannelId) return { error: "Sin canal de YouTube" };

  try {
    const videos = await getLatestVideos(influencer.youtubeChannelId, 12);

    for (const video of videos) {
      await prisma.influencerVideo.upsert({
        where: { externalId: video.id },
        update: {
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          views: video.views,
        },
        create: {
          influencerId,
          externalId: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: video.videoUrl,
          views: video.views,
          publishedAt: video.publishedAt,
        },
      });
    }

    revalidatePath("/influencers");
    return { success: true, count: videos.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { error: message };
  }
}

export async function getAllSpecialties(): Promise<string[]> {
  const influencers = await prisma.influencer.findMany({
    where: { active: true },
    select: { specialty: true },
  });

  const set = new Set<string>();
  for (const inf of influencers) {
    for (const s of inf.specialty) set.add(s);
  }
  return Array.from(set).sort();
}
