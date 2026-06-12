// ─── VPN (Virtual Pro Network) API Service ─────────────────
// Fetches league data from virtualpronetwork.com API
// Used for the /escena/vpn competitive scene page

const VPN_API = "https://www.virtualpronetwork.com/api";
const COMMUNITY_ID = 4; // VPN Argentina

// ─── LEAGUE IDS ─────────────────────────────────────────────

export const VPN_LEAGUES = {
  "1ra": { id: 2119, name: "1ra División", slug: "liga-argentina-1ra-division" },
  "2da": { id: 2127, name: "2da División", slug: "liga-argentina-2da-division" },
  "3ra": { id: 2146, name: "3ra División", slug: "liga-argentina-3ra-division" },
  "4ta": { id: 2183, name: "4ta División", slug: "liga-argentina-4ta-division" },
} as const;

export type VpnDivision = keyof typeof VPN_LEAGUES;

// ─── TYPES ──────────────────────────────────────────────────

export interface VpnSeason {
  id: number;
  active: number;
  name?: string;
}

export interface VpnLeagueInfo {
  id: number;
  name: string;
  url: string;
  seasons: VpnSeason[];
  activeSeason: VpnSeason | null;
  teamsCount?: number;
  movingUp?: number;
  relegation?: number;
}

export interface VpnStandingRow {
  position: number;
  team: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form: string[]; // ["W","W","L","D","W"]
}

export interface VpnTopScorer {
  position: number;
  player: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  team: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
  country: string | null;
  countryFlag: string | null;
  total: number;
}

export interface VpnDivisionData {
  league: VpnLeagueInfo;
  standings: VpnStandingRow[];
  topScorers: VpnTopScorer[];
}

// ─── FETCH HELPERS ──────────────────────────────────────────

async function vpnFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${VPN_API}${path}`);
  url.searchParams.set("community_id", String(COMMUNITY_ID));
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 }, // Cache 5 min
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`VPN API error: ${res.status} ${res.statusText} for ${path}`);
  }

  return res.json();
}

// ─── DATA FETCHERS ──────────────────────────────────────────

export async function getVpnLeagueInfo(leagueId: number): Promise<VpnLeagueInfo> {
  const data = await vpnFetch<any>(`/leagues/${leagueId}`);

  const seasons: VpnSeason[] = (data.seasons || []).map((s: any) => ({
    id: s.id,
    active: s.active,
    name: s.name,
  }));

  return {
    id: data.id,
    name: data.name,
    url: data.url,
    seasons,
    activeSeason: seasons.find((s) => s.active === 1) ?? null,
    teamsCount: data.registration_max_teams,
    movingUp: data.moving_up,
    relegation: data.relegation_teams,
  };
}

export async function getVpnStandings(leagueId: number, seasonId: number): Promise<VpnStandingRow[]> {
  const data = await vpnFetch<any>(`/leagues/${leagueId}/table`, { season: seasonId });

  // API returns array of group objects, each with rows
  // For single-table leagues, there's one group
  const rows: VpnStandingRow[] = [];

  const groups = Array.isArray(data) ? data : data.groups || [data];
  for (const group of groups) {
    const table = group.table || group.rows || group;
    if (!Array.isArray(table)) continue;

    for (const row of table) {
      rows.push({
        position: row.position ?? row.pos ?? rows.length + 1,
        team: {
          id: row.team?.id ?? row.teamId ?? 0,
          name: row.team?.name ?? row.teamName ?? "?",
          logoUrl: row.team?.logoUrl
            ? `${VPN_API}/media/images/teamlogos/${row.team.logoUrl}`
            : null,
        },
        points: row.points ?? row.pts ?? 0,
        played: row.played ?? row.mp ?? 0,
        won: row.won ?? row.w ?? 0,
        drawn: row.drawn ?? row.d ?? 0,
        lost: row.lost ?? row.l ?? 0,
        goalsFor: row.goalsFor ?? row.gf ?? 0,
        goalsAgainst: row.goalsAgainst ?? row.ga ?? 0,
        goalDiff: row.goalDiff ?? row.gd ?? (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0),
        form: parseForm(row.form),
      });
    }
  }

  return rows;
}

export async function getVpnTopScorers(leagueId: number, seasonId: number): Promise<VpnTopScorer[]> {
  const data = await vpnFetch<any>(`/leagues/${leagueId}/stats`, {
    season: seasonId,
    event: 1, // Goals
    page: 1,
    perPage: 15,
  });

  const stats = data.data || data.stats || data;
  if (!Array.isArray(stats)) return [];

  return stats.map((s: any, i: number) => ({
    position: i + 1,
    player: {
      id: s.player?.id ?? s.playerId ?? 0,
      name: s.player?.name ?? s.playerName ?? "?",
      avatarUrl: s.player?.avatarUrl ?? null,
    },
    team: {
      id: s.team?.id ?? s.teamId ?? 0,
      name: s.team?.name ?? s.teamName ?? "?",
      logoUrl: s.team?.logoUrl
        ? `${VPN_API}/media/images/teamlogos/${s.team.logoUrl}`
        : null,
    },
    country: s.country?.name ?? s.countryName ?? null,
    countryFlag: s.country?.flag
      ? `${VPN_API}/media/images/flags/${s.country.flag}`
      : null,
    total: s.total ?? s.goals ?? 0,
  }));
}

// ─── AGGREGATE ──────────────────────────────────────────────

/** Fetch all data for a single division */
export async function getVpnDivision(division: VpnDivision): Promise<VpnDivisionData> {
  const cfg = VPN_LEAGUES[division];
  const league = await getVpnLeagueInfo(cfg.id);

  if (!league.activeSeason) {
    return { league, standings: [], topScorers: [] };
  }

  const sid = league.activeSeason.id;
  const [standings, topScorers] = await Promise.all([
    getVpnStandings(cfg.id, sid),
    getVpnTopScorers(cfg.id, sid),
  ]);

  return { league, standings, topScorers };
}

/** Fetch summary for all divisions (for overview card) */
export async function getVpnOverview() {
  const divisions = Object.keys(VPN_LEAGUES) as VpnDivision[];
  const results = await Promise.allSettled(
    divisions.map(async (div) => {
      const cfg = VPN_LEAGUES[div];
      const league = await getVpnLeagueInfo(cfg.id);
      const leader = league.activeSeason
        ? (await getVpnStandings(cfg.id, league.activeSeason.id))[0] ?? null
        : null;
      return { division: div, league, leader };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ─── HELPERS ────────────────────────────────────────────────

function parseForm(form: any): string[] {
  if (Array.isArray(form)) {
    return form.map((f: any) => {
      if (typeof f === "string") return f;
      if (f.result === 1 || f.result === "W") return "W";
      if (f.result === 0 || f.result === "D") return "D";
      return "L";
    });
  }
  if (typeof form === "string") {
    return form.split("").map((c) => (c === "W" ? "W" : c === "D" ? "D" : "L"));
  }
  return [];
}
