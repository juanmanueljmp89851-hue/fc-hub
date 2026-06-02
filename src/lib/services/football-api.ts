const API_BASE = "https://v3.football.api-sports.io";

// --- League IDs (api-football) ---
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
  "Mexico": "México",
  "Canada": "Canadá",
  "Netherlands": "Países Bajos",
  "USA": "Estados Unidos",
  "United States": "Estados Unidos",
  "Turkey": "Turquía",
  "Wales": "Gales",
  "Uzbekistan": "Uzbekistán",
  "Denmark": "Dinamarca",
  "Peru": "Perú",
  "France": "Francia",
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  "Panama": "Panamá",
  "Brazil": "Brasil",
  "Morocco": "Marruecos",
  "Japan": "Japón",
  "Germany": "Alemania",
  "Czech Republic": "República Checa",
  "Czechia": "República Checa",
};

function translateTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

function getApiKey(): string {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) throw new Error("FOOTBALL_API_KEY not configured");
  return key;
}

// --- Types ---

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    venue: { name: string; city: string } | null;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface ApiResponse {
  response: ApiFixture[];
  errors: Record<string, string>;
}

export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED";

function mapStatus(apiStatus: string): MatchStatus {
  const finished = ["FT", "AET", "PEN", "AWD", "WO"];
  const inProgress = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"];
  if (finished.includes(apiStatus)) return "FINISHED";
  if (inProgress.includes(apiStatus)) return "IN_PROGRESS";
  return "SCHEDULED";
}

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

function parseRound(round: string): { stage: string | null; group: string | null } {
  const groupMatch = round.match(/Group\s+([A-H])/i);
  if (groupMatch) return { stage: "Fase de Grupos", group: groupMatch[1] };
  return { stage: round, group: null };
}

function normalizeFixture(f: ApiFixture): NormalizedFixture {
  const { stage, group } = parseRound(f.league.round);
  const meta = LEAGUE_META[f.league.id] || { name: "Liga", flag: "⚽" };
  return {
    externalId: f.fixture.id,
    leagueId: f.league.id,
    leagueName: meta.name,
    leagueFlag: meta.flag,
    homeTeam: translateTeamName(f.teams.home.name),
    awayTeam: translateTeamName(f.teams.away.name),
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    matchDate: new Date(f.fixture.date),
    venue: f.fixture.venue?.name ?? null,
    stage,
    group,
    status: mapStatus(f.fixture.status.short),
    minute: f.fixture.status.elapsed,
  };
}

async function fetchApi(endpoint: string, revalidate = 300): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-apisports-key": getApiKey() },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// --- Public API ---

/** All World Cup fixtures (for prode page) */
export async function getWorldCupFixtures(): Promise<NormalizedFixture[]> {
  const data = await fetchApi(`/fixtures?league=${LEAGUE_IDS.WORLD_CUP}&season=2026`);
  return data.response.map(normalizeFixture);
}

/** Today's matches across ALL tracked leagues (Argentina timezone) */
export async function getTodayAllLeagues(): Promise<NormalizedFixture[]> {
  if (!process.env.FOOTBALL_API_KEY) return [];

  // Use Argentina timezone (UTC-3) so late-night matches aren't missed
  const argNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  const today = argNow.toISOString().split("T")[0];

  try {
    // Fetch by date AND also live matches to catch any in-progress games
    const [dateData, liveData] = await Promise.all([
      fetchApi(`/fixtures?date=${today}`, 300),
      fetchApi(`/fixtures?live=all`, 120),
    ]);

    const trackedIds = new Set<number>(Object.values(LEAGUE_IDS));

    // Merge: date-based + live, dedupe by fixture id
    const seen = new Set<number>();
    const results: NormalizedFixture[] = [];

    for (const f of [...(liveData.response || []), ...(dateData.response || [])]) {
      if (!trackedIds.has(f.league.id)) continue;
      if (seen.has(f.fixture.id)) continue;
      seen.add(f.fixture.id);
      results.push(normalizeFixture(f));
    }

    return results;
  } catch {
    return [];
  }
}

/** Live matches only — filtered to our leagues */
export async function getLiveAllLeagues(): Promise<NormalizedFixture[]> {
  if (!process.env.FOOTBALL_API_KEY) return [];

  try {
    const data = await fetchApi(`/fixtures?live=all`, 120);
    const trackedIds = new Set<number>(Object.values(LEAGUE_IDS));
    return data.response
      .filter((f: ApiFixture) => trackedIds.has(f.league.id))
      .map(normalizeFixture);
  } catch {
    return [];
  }
}

/** World Cup fixtures by date (for prode) */
export async function getFixturesByDate(date: string): Promise<NormalizedFixture[]> {
  const data = await fetchApi(
    `/fixtures?league=${LEAGUE_IDS.WORLD_CUP}&season=2026&date=${date}`,
  );
  return data.response.map(normalizeFixture);
}

/** Today's World Cup fixtures */
export async function getTodayFixtures(): Promise<NormalizedFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  return getFixturesByDate(today);
}

/** Live World Cup fixtures */
export async function getLiveFixtures(): Promise<NormalizedFixture[]> {
  const data = await fetchApi(
    `/fixtures?league=${LEAGUE_IDS.WORLD_CUP}&season=2026&live=all`,
  );
  return data.response.map(normalizeFixture);
}
