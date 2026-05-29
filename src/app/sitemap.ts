import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE = "https://www.modofosa.com.ar";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/actualidad`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/jugadores`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/torneos`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/jugar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/ranking`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/prode`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/escena`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/influencers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/casual`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/legal/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // ── Dynamic pages ─────────────────────────────────────
  const [tournaments, leagues, influencers, prodes] = await Promise.all([
    prisma.tournament.findMany({
      select: { id: true, createdAt: true },
      where: { status: { not: "DRAFT" } },
    }),
    prisma.externalLeague.findMany({
      select: { slug: true, createdAt: true },
    }),
    prisma.influencer.findMany({
      select: { slug: true, createdAt: true },
      where: { active: true },
    }),
    prisma.prode.findMany({
      select: { id: true, createdAt: true },
    }),
  ]);

  const tournamentPages: MetadataRoute.Sitemap = tournaments.map((t) => ({
    url: `${BASE}/torneos/${t.id}`,
    lastModified: t.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const leaguePages: MetadataRoute.Sitemap = leagues.map((l) => ({
    url: `${BASE}/escena/${l.slug}`,
    lastModified: l.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const influencerPages: MetadataRoute.Sitemap = influencers.map((i) => ({
    url: `${BASE}/influencers/${i.slug}`,
    lastModified: i.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const prodePages: MetadataRoute.Sitemap = prodes.map((p) => ({
    url: `${BASE}/prode/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...tournamentPages,
    ...leaguePages,
    ...influencerPages,
    ...prodePages,
  ];
}
