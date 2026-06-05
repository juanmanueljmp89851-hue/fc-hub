/**
 * Football Live Scores — ESPN API (no auth required, no rate limits)
 *
 * Replaces api-football.com which required paid API key.
 * ESPN endpoints are public and cover all major leagues + Argentina.
 */

// --- League slugs (ESPN) ---
const ESPN_LEAGUES = {
  ARGENTINA_PRIMERA: { slug: "arg.1", name: "Liga Argentina", flag: "🇦🇷" },
  COPA_ARGENTINA: { slug: "arg.copa_argentina", name: "Copa Argentina", flag: "🇦🇷" },
  LIBERTADORES: { slug: "conmebol.libertadores", name: "Libertadores", flag: "🏆" },
  SUDAMERICANA: { slug: "conmebol.sudamericana", name: "Sudamericana", flag: "🏆" },
  PREMIER_LEAGUE: { slug: "eng.1", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  LA_LIGA: { slug: "esp.1", name: "La Liga", flag: "🇪🇸" },
  SERIE_A: { slug: "ita.1", name: "Serie A", flag: "🇮🇹" },
  BUNDESLIGA: { slug: "ger.1", name: "Bundesliga", flag: "🇩🇪" },
  LIGUE_1: { slug: "fra.1", name: "Ligue 1", flag: "🇫🇷" },
  CHAMPIONS_LEAGUE: { slug: "uefa.champions", name: "Champions League", flag: "🏆" },
  EUROPA_LEAGUE: { slug: "uefa.europa", name: "Europa League", flag: "🏆" },
  WORLD_CUP: { slug: "fifa.world", name: "Mundial 2026", flag: "🌍" },
  COPA_AMERICA: { slug: "conmebol.america", name: "Copa América", flag: "🏆" },
} as const;

type LeagueKey = keyof typeof ESPN_LEAGUES;

// Legacy LEAGUE_IDS export (for compatibility with prode code)
export const LEAGUE_IDS = {
  WORLD_CUP: 1,
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  FRIENDLIES: 10,
  SUDAMERICANA: 11,
  LIBERTADORES: 13,
  PREMIER_LEAGUE: 39,
  LIGUE_1: 61,
  BUNDESLIGA: 78,
  ARGENTINA_PRIMERA: 128,
  COPA_ARGENTINA: 130,
  SERIE_A: 135,
  LA_LIGA: 140,
} as const;

export const LEAGUE_META: Record<number, { name: string; flag: string }> = {
  [LEAGUE_IDS.WORLD_CUP]: { name: "Mundial 2026", flag: "🌍" },
  [LEAGUE_IDS.CHAMPIONS_LEAGUE]: { name: "Champions League", flag: "🏆" },
  [LEAGUE_IDS.EUROPA_LEAGUE]: { name: "Europa League", flag: "🏆" },
  [LEAGUE_IDS.FRIENDLIES]: { name: "Amistoso Int.", flag: "🤝" },
  [LEAGUE_IDS.SUDAMERICANA]: { name: "Sudamericana", flag: "🏆" },
  [LEAGUE_IDS.LIBERTADORES]: { name: "Libertadores", flag: "🏆" },
  [LEAGUE_IDS.PREMIER_LEAGUE]: { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  [LEAGUE_IDS.LIGUE_1]: { name: "Ligue 1", flag: "🇫🇷" },
  [LEAGUE_IDS.BUNDESLIGA]: { name: "Bundesliga", flag: "🇩🇪" },
  [LEAGUE_IDS.ARGENTINA_PRIMERA]: { name: "Liga Argentina", flag: "🇦🇷" },
  [LEAGUE_IDS.COPA_ARGENTINA]: { name: "Copa Argentina", flag: "🇦🇷" },
  [LEAGUE_IDS.SERIE_A]: { name: "Serie A", flag: "🇮🇹" },
  [LEAGUE_IDS.LA_LIGA]: { name: "La Liga", flag: "🇪🇸" },
};

// Spanish team name mapping
const TEAM_NAME_MAP: Record<string, string> = {
  Mexico: "México",
  Canada: "Canadá",
  Netherlands: "Países Bajos",
  USA: "Estados Unidos",
  "United States": "Estados Unidos",
  Turkey: "Turquía",
  Wales: "Gales",
  Uzbekistan: "Uzbekistán",
  Denmark: "Dinamarca",
  Peru: "Perú",
  France: "Francia",
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  Panama: "Panamá",
  Brazil: "Brasil",
  Morocco: "Marruecos",
  Japan: "Japón",
  Germany: "Alemania",
  "Czech Republic": "República Checa",
  Czechia: "República Checa",
};

function translateTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

// --- Types ---

export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED";

export interface NormalizedFixture {
  externalId: number;
  leagueId: number;
  leagueName: string;
  leagueFlag: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: Date;
  venue: string | null;
  stage: string | null;
  group: string | null;
  status: MatchStatus;
  minute: number | null;
}

// --- ESPN API Types ---

interface EspnCompetitor {
  homeAway: "home" | "away";
  team: { displayName: string; shortDisplayName: string };
  score?: string;
}

interface EspnEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    id: string;
    venue?: { fullName: string; address?: { city: string } };
    competitors: EspnCompetitor[];
    status: {
      clock: number;
      displayClock: string;
      period: number;
      type: {
        id: string;
        name: string;       // "STATUS_FULL_TIME", "STATUS_IN_PROGRESS", "STATUS_SCHEDULED", etc.
        state: string;      // "pre", "in", "post"
        completed: boolean;
      };
    };
    situation?: {
      lastPlay?: { text: string };
    };
  }>;
}

interface EspnScoreboard {
  events: EspnEvent[];
}

// Map ESPN slug → synthetic league ID for compatibility
const SLUG_TO_LEAGUE_ID: Record<string, number> = {
  "arg.1": LEAGUE_IDS.ARGENTINA_PRIMERA,
  "arg.copa_argentina": LEAGUE_IDS.COPA_ARGENTINA,
  "conmebol.libertadores": LEAGUE_IDS.LIBERTADORES,
  "conmebol.sudamericana": LEAGUE_IDS.SUDAMERICANA,
  "eng.1": LEAGUE_IDS.PREMIER_LEAGUE,
  "esp.1": LEAGUE_IDS.LA_LIGA,
  "ita.1": LEAGUE_IDS.SERIE_A,
  "ger.1": LEAGUE_IDS.BUNDESLIGA,
  "fra.1": LEAGUE_IDS.LIGUE_1,
  "uefa.champions": LEAGUE_IDS.CHAMPIONS_LEAGUE,
  "uefa.europa": LEAGUE_IDS.EUROPA_LEAGUE,
  "fifa.world": LEAGUE_IDS.WORLD_CUP,
  "conmebol.america": 0,
};

// --- ESPN Fetcher ---

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

async function fetchEspnScoreboard(
  slug: string,
  dateStr?: string,
  revalidate = 300,
): Promise<EspnScoreboard> {
  const params = dateStr ? `?dates=${dateStr.replace(/-/g, "")}` : "";
  const url = `${ESPN_BASE}/${slug}/scoreboard${params}`;

  const res = await fetch(url, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`ESPN API error: ${res.status} for ${slug}`);
  }

  return res.json();
}

function mapEspnStatus(state: string): MatchStatus {
  if (state === "post") return "FINISHED";
  if (state === "in") return "IN_PROGRESS";
  return "SCHEDULED";
}

function parseEspnMinute(status: EspnEvent["competitions"][0]["status"]): number | null {
  if (status.type.state !== "in") return null;
  // displayClock = "45:00", "90+3'", etc.
  const clock = status.displayClock;
  const match = clock.match(/^(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function normalizeEspnEvent(
  event: EspnEvent,
  leagueSlug: string,
  leagueName: string,
  leagueFlag: string,
): NormalizedFixture | null {
  const comp = event.competitions[0];
  if (!comp) return null;

  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const leagueId = SLUG_TO_LEAGUE_ID[leagueSlug] ?? 0;
  const status = mapEspnStatus(comp.status.type.state);

  return {
    externalId: parseInt(event.id) || 0,
    leagueId,
    leagueName,
    leagueFlag,
    homeTeam: translateTeamName(home.team.displayName),
    awayTeam: translateTeamName(away.team.displayName),
    homeScore: home.score != null ? parseInt(home.score) : null,
    awayScore: away.score != null ? parseInt(away.score) : null,
    matchDate: new Date(event.date),
    venue: comp.venue?.fullName ?? null,
    stage: null,
    group: null,
    status,
    minute: parseEspnMinute(comp.status),
  };
}

// --- Public API ---

/** Today's matches across ALL tracked leagues (Argentina timezone).
 *  Fetches all leagues in parallel with 5-min cache. No API key needed. */
export async function getTodayAllLeagues(): Promise<NormalizedFixture[]> {
  // Use Argentina timezone (UTC-3)
  const argNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }),
  );
  const today = argNow.toISOString().split("T")[0];
  const argHour = argNow.getHours();

  try {
    const leagueKeys = Object.keys(ESPN_LEAGUES) as LeagueKey[];

    // Fetch all leagues in parallel (no rate limit on ESPN)
    const promises = leagueKeys.map(async (key) => {
      const league = ESPN_LEAGUES[key];
      try {
        const data = await fetchEspnScoreboard(league.slug, today, 300);
        return (data.events || [])
          .map((e) => normalizeEspnEvent(e, league.slug, league.name, league.flag))
          .filter((f): f is NormalizedFixture => f !== null);
      } catch {
        // Individual league failure → skip it
        return [] as NormalizedFixture[];
      }
    });

    const results = (await Promise.all(promises)).flat();

    // Before noon BsAs: also fetch yesterday (finished matches stay visible ~12h)
    if (argHour < 12) {
      const yesterday = new Date(argNow);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const yPromises = leagueKeys.map(async (key) => {
        const league = ESPN_LEAGUES[key];
        try {
          const data = await fetchEspnScoreboard(league.slug, yesterdayStr, 600);
          const now = Date.now();
          return (data.events || [])
            .map((e) => normalizeEspnEvent(e, league.slug, league.name, league.flag))
            .filter((f): f is NormalizedFixture => {
              if (!f) return false;
              const hoursAgo = (now - f.matchDate.getTime()) / (1000 * 60 * 60);
              return hoursAgo <= 12;
            });
        } catch {
          return [] as NormalizedFixture[];
        }
      });

      const yResults = (await Promise.all(yPromises)).flat();
      results.push(...yResults);
    }

    // Dedupe by externalId
    const seen = new Set<number>();
    const deduped = results.filter((r) => {
      if (seen.has(r.externalId)) return false;
      seen.add(r.externalId);
      return true;
    });

    console.log(`[ticker] ESPN date=${today} results=${deduped.length}`);
    return deduped;
  } catch (err) {
    console.error("[ticker] getTodayAllLeagues error:", err);
    return [];
  }
}

/** All World Cup fixtures (for prode page) */
export async function getWorldCupFixtures(): Promise<NormalizedFixture[]> {
  try {
    const data = await fetchEspnScoreboard("fifa.world", undefined, 600);
    return (data.events || [])
      .map((e) =>
        normalizeEspnEvent(e, "fifa.world", "Mundial 2026", "🌍"),
      )
      .filter((f): f is NormalizedFixture => f !== null);
  } catch {
    return [];
  }
}

/** Live matches only — filtered to our leagues */
export async function getLiveAllLeagues(): Promise<NormalizedFixture[]> {
  const all = await getTodayAllLeagues();
  return all.filter((f) => f.status === "IN_PROGRESS");
}

/** World Cup fixtures by date (for prode) */
export async function getFixturesByDate(date: string): Promise<NormalizedFixture[]> {
  try {
    const data = await fetchEspnScoreboard("fifa.world", date, 300);
    return (data.events || [])
      .map((e) =>
        normalizeEspnEvent(e, "fifa.world", "Mundial 2026", "🌍"),
      )
      .filter((f): f is NormalizedFixture => f !== null);
  } catch {
    return [];
  }
}

/** Today's World Cup fixtures */
export async function getTodayFixtures(): Promise<NormalizedFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  return getFixturesByDate(today);
}

/** Live World Cup fixtures */
export async function getLiveFixtures(): Promise<NormalizedFixture[]> {
  const all = await getWorldCupFixtures();
  return all.filter((f) => f.status === "IN_PROGRESS");
}
