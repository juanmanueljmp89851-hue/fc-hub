import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { AdSlot } from "@/components/ads/AdSlot";
import Link from "next/link";
import {
  VPN_LEAGUES,
  getVpnDivision,
  type VpnDivision,
  type VpnDivisionData,
  type VpnStandingRow,
  type VpnTopScorer,
} from "@/lib/services/vpn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Liga Argentina VPN | Competitivo",
  description:
    "Seguimiento en vivo de la Liga Argentina VPN de Clubes Pro: posiciones, goleadores y más.",
  alternates: { canonical: "/escena/vpn" },
};

// ─── PAGE ───────────────────────────────────────────────────

export default async function VpnPage({
  searchParams,
}: {
  searchParams: { div?: string };
}) {
  const divisions = Object.keys(VPN_LEAGUES) as VpnDivision[];
  const activeDivRaw = searchParams.div ?? "1ra";
  const activeDiv: VpnDivision = divisions.includes(activeDivRaw as VpnDivision)
    ? (activeDivRaw as VpnDivision)
    : "1ra";

  let data: VpnDivisionData | null = null;
  let error: string | null = null;

  try {
    data = await getVpnDivision(activeDiv);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar datos de VPN";
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/escena"
            className="mb-2 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-accent"
          >
            ← Competitivo
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1a7db5]/20 text-2xl">
              🏆
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Liga Argentina <span className="text-accent">VPN</span>
              </h1>
              <p className="text-sm text-foreground/50">
                Virtual Pro Network · Clubes Pro · Xbox
              </p>
            </div>
          </div>
        </div>

        {/* Division tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-surface-light pb-px">
          {divisions.map((div) => {
            const cfg = VPN_LEAGUES[div];
            const isActive = div === activeDiv;
            return (
              <Link
                key={div}
                href={`/escena/vpn?div=${div}`}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                  isActive
                    ? "border-b-2 border-accent bg-accent/10 text-accent"
                    : "text-foreground/50 hover:bg-surface-light/50 hover:text-foreground/80"
                }`}
              >
                {cfg.name}
              </Link>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {data && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Standings — takes 2 cols */}
            <div className="lg:col-span-2">
              <StandingsTable standings={data.standings} division={activeDiv} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Top Scorers */}
              <TopScorersCard scorers={data.topScorers} />

              {/* League info */}
              <div className="rounded-xl border border-surface-light bg-background p-4">
                <h3 className="mb-3 text-sm font-bold uppercase text-foreground/50">
                  Info de la división
                </h3>
                <div className="space-y-2 text-sm text-foreground/60">
                  {data.league.activeSeason && (
                    <div className="flex justify-between">
                      <span>Temporada</span>
                      <span className="font-bold text-foreground/80">
                        Season {data.league.seasons.length - data.league.seasons.findIndex(
                          (s) => s.id === data!.league.activeSeason!.id
                        )}
                      </span>
                    </div>
                  )}
                  {data.league.movingUp != null && data.league.movingUp > 0 && (
                    <div className="flex justify-between">
                      <span>Ascienden</span>
                      <span className="font-bold text-accent">{data.league.movingUp}</span>
                    </div>
                  )}
                  {data.league.relegation != null && data.league.relegation > 0 && (
                    <div className="flex justify-between">
                      <span>Descienden</span>
                      <span className="font-bold text-red-400">{data.league.relegation}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Equipos</span>
                    <span className="font-bold text-foreground/80">
                      {data.standings.length}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://www.virtualpronetwork.com/web/app/league/${VPN_LEAGUES[activeDiv].id}/${VPN_LEAGUES[activeDiv].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block rounded-lg bg-[#1a7db5]/20 px-4 py-2 text-center text-sm font-bold text-[#1a7db5] transition-colors hover:bg-[#1a7db5]/30"
                >
                  Ver en VPN ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Ad */}
        <div className="mt-8">
          <AdSlot format="auto" />
        </div>
      </main>
    </div>
  );
}

// ─── STANDINGS TABLE ────────────────────────────────────────

function StandingsTable({
  standings,
  division,
}: {
  standings: VpnStandingRow[];
  division: VpnDivision;
}) {
  if (standings.length === 0) {
    return (
      <div className="rounded-xl border border-surface-light bg-background p-8 text-center text-foreground/50">
        No hay datos de posiciones disponibles
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-light bg-background">
      <div className="border-b border-surface-light bg-surface/30 px-4 py-3">
        <h2 className="font-bold">Tabla de Posiciones</h2>
        <p className="text-xs text-foreground/40">{VPN_LEAGUES[division].name}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-light text-xs uppercase text-foreground/40">
              <th className="px-3 py-2 text-center">#</th>
              <th className="px-3 py-2 text-left">Equipo</th>
              <th className="px-3 py-2 text-center">PTS</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell">PJ</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell">G</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell">E</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell">P</th>
              <th className="hidden px-3 py-2 text-center md:table-cell">GF</th>
              <th className="hidden px-3 py-2 text-center md:table-cell">GC</th>
              <th className="px-3 py-2 text-center">DG</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell">Forma</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr
                key={row.team.id}
                className="border-b border-surface-light/50 transition-colors hover:bg-surface/20"
              >
                <td className="px-3 py-2.5 text-center font-bold text-foreground/50">
                  {row.position}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {row.team.logoUrl ? (
                      <img
                        src={row.team.logoUrl}
                        alt=""
                        className="h-6 w-6 rounded object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-surface-light" />
                    )}
                    <span className="font-medium">{row.team.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center font-black text-accent">
                  {row.points}
                </td>
                <td className="hidden px-3 py-2.5 text-center text-foreground/60 sm:table-cell">
                  {row.played}
                </td>
                <td className="hidden px-3 py-2.5 text-center text-foreground/60 sm:table-cell">
                  {row.won}
                </td>
                <td className="hidden px-3 py-2.5 text-center text-foreground/60 sm:table-cell">
                  {row.drawn}
                </td>
                <td className="hidden px-3 py-2.5 text-center text-foreground/60 sm:table-cell">
                  {row.lost}
                </td>
                <td className="hidden px-3 py-2.5 text-center text-foreground/60 md:table-cell">
                  {row.goalsFor}
                </td>
                <td className="hidden px-3 py-2.5 text-center text-foreground/60 md:table-cell">
                  {row.goalsAgainst}
                </td>
                <td
                  className={`px-3 py-2.5 text-center font-bold ${
                    row.goalDiff > 0
                      ? "text-accent"
                      : row.goalDiff < 0
                        ? "text-red-400"
                        : "text-foreground/50"
                  }`}
                >
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <div className="flex justify-center gap-0.5">
                    {row.form.slice(-5).map((f, i) => (
                      <span
                        key={i}
                        className={`inline-block h-4 w-4 rounded-full text-center text-[10px] font-bold leading-4 ${
                          f === "W"
                            ? "bg-accent/20 text-accent"
                            : f === "D"
                              ? "bg-gold/20 text-gold"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {f === "W" ? "V" : f === "D" ? "E" : "D"}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TOP SCORERS ────────────────────────────────────────────

function TopScorersCard({ scorers }: { scorers: VpnTopScorer[] }) {
  if (scorers.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-light bg-background p-4">
      <h3 className="mb-3 text-sm font-bold uppercase text-foreground/50">
        Goleadores
      </h3>
      <div className="space-y-2">
        {scorers.slice(0, 10).map((s) => (
          <div
            key={s.player.id}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface/30"
          >
            <span className="w-5 text-center text-xs font-bold text-foreground/40">
              {s.position}
            </span>
            {s.countryFlag && (
              <img
                src={s.countryFlag}
                alt=""
                className="h-4 w-5 object-contain"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.player.name}</p>
              <p className="truncate text-xs text-foreground/40">{s.team.name}</p>
            </div>
            <span className="text-sm font-black text-gold">{s.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
