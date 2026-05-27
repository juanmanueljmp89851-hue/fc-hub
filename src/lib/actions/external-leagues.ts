"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Queries públicas ───────────────────────────────────────

export async function getExternalLeagues() {
  return prisma.externalLeague.findMany({
    where: { active: true },
    include: {
      seasons: {
        where: { status: { in: ["IN_PROGRESS", "UPCOMING"] } },
        orderBy: { startDate: "desc" },
        take: 1,
        include: {
          _count: { select: { matches: true, standings: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getExternalLeague(slug: string) {
  return prisma.externalLeague.findUnique({
    where: { slug },
    include: {
      seasons: {
        orderBy: { startDate: "desc" },
        include: {
          standings: {
            orderBy: { position: "asc" },
          },
          matches: {
            orderBy: [{ matchDate: "desc" }, { createdAt: "desc" }],
            take: 50,
          },
        },
      },
    },
  });
}

// ─── Admin: CRUD ligas ──────────────────────────────────────

interface CreateLeagueInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  discordUrl?: string;
  platform: ("PS5" | "XBOX" | "PC")[];
  gameMode: "CLUBS_PRO" | "ULTIMATE_TEAM" | "SEASONS" | "MIXED";
  country?: string;
  fetchSource: "MANUAL" | "SCRAPER_IESA" | "SCRAPER_ELPF" | "API_VPG" | "SCRAPER_CUSTOM";
  fetchUrl?: string;
}

export async function createExternalLeague(input: CreateLeagueInput) {
  const existing = await prisma.externalLeague.findUnique({
    where: { slug: input.slug },
  });
  if (existing) return { error: "Ya existe una liga con ese slug" };

  const league = await prisma.externalLeague.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      logoUrl: input.logoUrl,
      websiteUrl: input.websiteUrl,
      instagramUrl: input.instagramUrl,
      discordUrl: input.discordUrl,
      platform: input.platform,
      gameMode: input.gameMode,
      country: input.country ?? "Argentina",
      fetchSource: input.fetchSource,
      fetchUrl: input.fetchUrl,
    },
  });

  revalidatePath("/escena");
  return { success: true, league };
}

// ─── Admin: CRUD temporadas ─────────────────────────────────

export async function createExternalSeason(
  leagueId: string,
  name: string,
  startDate?: string,
  endDate?: string,
) {
  const season = await prisma.externalSeason.create({
    data: {
      leagueId,
      name,
      status: "IN_PROGRESS",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  revalidatePath("/escena");
  return { success: true, season };
}

// ─── Admin: Cargar standings manualmente ────────────────────

interface StandingInput {
  teamName: string;
  division?: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export async function upsertExternalStandings(
  seasonId: string,
  standings: StandingInput[],
) {
  // Delete old standings for season, then bulk create
  await prisma.$transaction(async (tx) => {
    await tx.externalStanding.deleteMany({ where: { seasonId } });
    await tx.externalStanding.createMany({
      data: standings.map((s) => ({
        seasonId,
        teamName: s.teamName,
        division: s.division,
        position: s.position,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        points: s.points,
      })),
    });
  });

  revalidatePath("/escena");
  return { success: true };
}

// ─── Admin: Cargar resultados manualmente ───────────────────

interface MatchInput {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  round?: string;
  matchDate?: string;
  status?: "SCHEDULED" | "FINISHED" | "CANCELLED";
}

export async function addExternalMatches(
  seasonId: string,
  matches: MatchInput[],
) {
  await prisma.externalMatch.createMany({
    data: matches.map((m) => ({
      seasonId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore ?? null,
      awayScore: m.awayScore ?? null,
      round: m.round,
      matchDate: m.matchDate ? new Date(m.matchDate) : null,
      status: m.status ?? "SCHEDULED",
    })),
  });

  revalidatePath("/escena");
  return { success: true };
}

// ─── Fetch/Scrape trigger ───────────────────────────────────

export async function fetchExternalLeagueData(leagueId: string) {
  const league = await prisma.externalLeague.findUnique({
    where: { id: leagueId },
  });

  if (!league) return { error: "Liga no encontrada" };

  try {
    let result: { standings?: StandingInput[]; matches?: MatchInput[] } = {};

    switch (league.fetchSource) {
      case "SCRAPER_IESA":
        result = await scrapeIESA(league.fetchUrl ?? "");
        break;
      case "SCRAPER_ELPF":
        result = await scrapeELPF(league.fetchUrl ?? "");
        break;
      case "API_VPG":
        result = await fetchVPG(league.fetchUrl ?? "");
        break;
      case "SCRAPER_CUSTOM":
        result = await scrapeCustom(league.fetchUrl ?? "", league.fetchConfig);
        break;
      default:
        return { error: "Esta liga se actualiza manualmente" };
    }

    // Get or create active season
    let season = await prisma.externalSeason.findFirst({
      where: { leagueId, status: "IN_PROGRESS" },
      orderBy: { startDate: "desc" },
    });

    if (!season) {
      season = await prisma.externalSeason.create({
        data: {
          leagueId,
          name: `Temporada ${new Date().getFullYear()}`,
          status: "IN_PROGRESS",
        },
      });
    }

    // Update standings if fetched
    if (result.standings && result.standings.length > 0) {
      await upsertExternalStandings(season.id, result.standings);
    }

    // Add new matches if fetched
    if (result.matches && result.matches.length > 0) {
      // Only add matches not already in DB (by homeTeam+awayTeam+round)
      const existingMatches = await prisma.externalMatch.findMany({
        where: { seasonId: season.id },
        select: { homeTeam: true, awayTeam: true, round: true },
      });

      const existingSet = new Set(
        existingMatches.map((m) => `${m.homeTeam}|${m.awayTeam}|${m.round ?? ""}`),
      );

      const newMatches = result.matches.filter(
        (m) => !existingSet.has(`${m.homeTeam}|${m.awayTeam}|${m.round ?? ""}`),
      );

      if (newMatches.length > 0) {
        await addExternalMatches(season.id, newMatches);
      }
    }

    // Update last fetch timestamp
    await prisma.externalLeague.update({
      where: { id: leagueId },
      data: { lastFetchAt: new Date(), fetchError: null },
    });

    revalidatePath("/escena");
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    await prisma.externalLeague.update({
      where: { id: leagueId },
      data: { fetchError: errorMsg },
    });
    return { error: errorMsg };
  }
}

// ─── Scrapers (implementaciones base) ───────────────────────

async function scrapeIESA(url: string): Promise<{ standings?: StandingInput[]; matches?: MatchInput[] }> {
  if (!url) return {};

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "FC-Hub/1.0" },
      next: { revalidate: 0 },
    });

    if (!response.ok) throw new Error(`IESA fetch failed: ${response.status}`);

    const html = await response.text();

    // Parse standings table from IESA HTML
    // IESA uses standard HTML tables for standings
    const standings = parseHTMLTable(html, "posiciones");
    const matches = parseHTMLMatchList(html);

    return { standings, matches };
  } catch (err) {
    throw new Error(`Error scraping IESA: ${err instanceof Error ? err.message : "unknown"}`);
  }
}

async function scrapeELPF(url: string): Promise<{ standings?: StandingInput[]; matches?: MatchInput[] }> {
  if (!url) return {};

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "FC-Hub/1.0" },
      next: { revalidate: 0 },
    });

    if (!response.ok) throw new Error(`eLPF fetch failed: ${response.status}`);

    const html = await response.text();
    const standings = parseHTMLTable(html, "posiciones");
    const matches = parseHTMLMatchList(html);

    return { standings, matches };
  } catch (err) {
    throw new Error(`Error scraping eLPF: ${err instanceof Error ? err.message : "unknown"}`);
  }
}

async function fetchVPG(url: string): Promise<{ standings?: StandingInput[]; matches?: MatchInput[] }> {
  if (!url) return {};

  try {
    // VPG has a public API
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FC-Hub/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) throw new Error(`VPG API failed: ${response.status}`);

    const data = await response.json();

    // VPG API typically returns standings in a structured format
    // Adapt based on actual API response shape
    if (Array.isArray(data.standings)) {
      const standings: StandingInput[] = data.standings.map(
        (s: Record<string, unknown>, i: number) => ({
          teamName: String(s.teamName ?? s.name ?? ""),
          position: i + 1,
          played: Number(s.played ?? 0),
          won: Number(s.won ?? 0),
          drawn: Number(s.drawn ?? 0),
          lost: Number(s.lost ?? 0),
          goalsFor: Number(s.goalsFor ?? s.gf ?? 0),
          goalsAgainst: Number(s.goalsAgainst ?? s.ga ?? 0),
          points: Number(s.points ?? 0),
        }),
      );
      return { standings };
    }

    return {};
  } catch (err) {
    throw new Error(`Error fetching VPG: ${err instanceof Error ? err.message : "unknown"}`);
  }
}

async function scrapeCustom(
  url: string,
  config: string | null,
): Promise<{ standings?: StandingInput[]; matches?: MatchInput[] }> {
  if (!url) return {};

  // Config is JSON with selectors for custom scraping
  const response = await fetch(url, {
    headers: { "User-Agent": "FC-Hub/1.0" },
    next: { revalidate: 0 },
  });

  if (!response.ok) throw new Error(`Custom fetch failed: ${response.status}`);

  const html = await response.text();
  const standings = parseHTMLTable(html, config ?? "posiciones");

  return { standings };
}

// ─── HTML Parsers (regex-based, no DOM dependency) ──────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseHTMLTable(html: string, _context: string): StandingInput[] {
  const standings: StandingInput[] = [];

  // Find table rows with common patterns
  // Pattern: <tr>...<td>pos</td><td>team</td><td>PJ</td><td>PG</td>...
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let rowMatch;
  let position = 1;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const row = rowMatch[1];
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellPattern.exec(row)) !== null) {
      // Strip HTML tags from cell content
      const content = cellMatch[1].replace(/<[^>]+>/g, "").trim();
      cells.push(content);
    }

    // Typical table: [pos, team, PJ, PG, PE, PP, GF, GC, DIF, PTS]
    // or: [team, PJ, PG, PE, PP, GF, GC, PTS]
    if (cells.length >= 7) {
      const hasPos = !isNaN(parseInt(cells[0]));
      const offset = hasPos ? 1 : 0;
      const teamName = cells[offset];

      if (teamName && teamName.length > 1 && isNaN(parseInt(teamName))) {
        standings.push({
          teamName,
          position,
          played: parseInt(cells[offset + 1]) || 0,
          won: parseInt(cells[offset + 2]) || 0,
          drawn: parseInt(cells[offset + 3]) || 0,
          lost: parseInt(cells[offset + 4]) || 0,
          goalsFor: parseInt(cells[offset + 5]) || 0,
          goalsAgainst: parseInt(cells[offset + 6]) || 0,
          points: parseInt(cells[cells.length - 1]) || 0,
        });
        position++;
      }
    }
  }

  return standings;
}

function parseHTMLMatchList(html: string): MatchInput[] {
  const matches: MatchInput[] = [];

  // Common pattern: "Team1 X - Y Team2" or structured divs
  const matchPattern = /(?:<div[^>]*class="[^"]*match[^"]*"[^>]*>)([\s\S]*?)(?:<\/div>)/gi;
  const scorePattern = /(\d+)\s*[-–]\s*(\d+)/;
  let matchEl;

  while ((matchEl = matchPattern.exec(html)) !== null) {
    const content = matchEl[1].replace(/<[^>]+>/g, " ").trim();
    const parts = content.split(/\s+/);

    if (parts.length >= 3) {
      const scoreMatch = scorePattern.exec(content);
      if (scoreMatch) {
        const scoreIdx = content.indexOf(scoreMatch[0]);
        const homeTeam = content.substring(0, scoreIdx).trim();
        const awayTeam = content.substring(scoreIdx + scoreMatch[0].length).trim();

        if (homeTeam && awayTeam) {
          matches.push({
            homeTeam,
            awayTeam,
            homeScore: parseInt(scoreMatch[1]),
            awayScore: parseInt(scoreMatch[2]),
            status: "FINISHED",
          });
        }
      }
    }
  }

  return matches;
}
