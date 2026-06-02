import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return NextResponse.json({ error: "No API key" });

  // Argentina timezone date
  const argNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  const today = argNow.toISOString().split("T")[0];

  try {
    // Fetch today's fixtures + live
    const [dateRes, liveRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { "x-apisports-key": key },
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?live=all`, {
        headers: { "x-apisports-key": key },
      }),
    ]);

    const dateData = await dateRes.json();
    const liveData = await liveRes.json();

    // Find Colombia
    const allFixtures = [...(dateData.response || []), ...(liveData.response || [])];
    const colombia = allFixtures.filter(
      (f: any) =>
        f.teams.home.name.toLowerCase().includes("colombia") ||
        f.teams.away.name.toLowerCase().includes("colombia")
    );

    // Tracked league IDs
    const trackedIds = [1, 2, 3, 10, 11, 13, 39, 61, 78, 128, 130, 135, 140];
    const tracked = allFixtures.filter((f: any) => trackedIds.includes(f.league.id));

    return NextResponse.json({
      today,
      dateErrors: dateData.errors,
      liveErrors: liveData.errors,
      totalDateFixtures: dateData.response?.length ?? 0,
      totalLiveFixtures: liveData.response?.length ?? 0,
      trackedMatches: tracked.map((f: any) => ({
        league: f.league.id,
        leagueName: f.league.name,
        home: f.teams.home.name,
        away: f.teams.away.name,
        score: `${f.goals.home}-${f.goals.away}`,
        status: f.fixture.status.short,
      })),
      colombiaMatches: colombia.map((f: any) => ({
        league: f.league.id,
        leagueName: f.league.name,
        home: f.teams.home.name,
        away: f.teams.away.name,
        score: `${f.goals.home}-${f.goals.away}`,
        status: f.fixture.status.short,
      })),
      // Sample of all unique leagues today
      allLeagues: [...new Set(allFixtures.map((f: any) => `${f.league.id}:${f.league.name}`))].slice(0, 30),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
