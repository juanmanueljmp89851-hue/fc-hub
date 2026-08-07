import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getActiveSbcs } from "@/lib/futgg";

const BASE = "https://www.modofosa.com.ar";

export const revalidate = 3600; // regenera cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/actualidad`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/jugadores`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/sbc`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/evoluciones`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/torneos`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/jugar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/ranking`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/prode`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/escena`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/influencers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/casual`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/reglamento`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/sobre-nosotros`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/legal/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ── Dynamic pages (fail gracefully if DB/API unavailable) ──
  let tournaments: { id: string; createdAt: Date }[] = [];
  let leagues: { slug: string; createdAt: Date }[] = [];
  let influencers: { slug: string; createdAt: Date }[] = [];
  let prodes: { id: string; createdAt: Date }[] = [];
  let cards: { eaId: number; updatedAt: Date }[] = [];

  try {
    [tournaments, leagues, influencers, prodes, cards] = await Promise.all([
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
      prisma.futCard.findMany({
        select: { eaId: true, updatedAt: true },
      }),
    ]);
  } catch (e) {
    console.warn("Sitemap: DB unavailable, returning static pages only", e);
  }

  // SBCs from external API
  let sbcPages: MetadataRoute.Sitemap = [];
  try {
    const sbcs = await getActiveSbcs();
    sbcPages = sbcs.map((s) => ({
      url: `${BASE}/sbc/${s.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // SBC sitemap optional
  }

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

  const cardPages: MetadataRoute.Sitemap = cards.map((c) => ({
    url: `${BASE}/carta/${c.eaId}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...cardPages,
    ...sbcPages,
    ...tournamentPages,
    ...leaguePages,
    ...influencerPages,
    ...prodePages,
  ];
}
