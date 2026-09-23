import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "ODESUR Santa Fe 2026 — EA FC | Modo Fosa",
  description:
    "Resultados de EA FC en los Juegos Suramericanos ODESUR 2026 en Santa Fe. Primera medalla de oro esports en juegos multideportivos.",
  alternates: { canonical: "/escena/odesur-2026" },
};

interface MedalEntry {
  country: string;
  flag: string;
  player: string;
  medal: "🥇" | "🥈" | "🥉";
  medalLabel: string;
}

const MENS: MedalEntry[] = [
  { country: "Perú", flag: "🇵🇪", player: "Luis 'LGamer' García", medal: "🥇", medalLabel: "Oro" },
  { country: "Brasil", flag: "🇧🇷", player: "Paulo 'PHzin' Henrique", medal: "🥈", medalLabel: "Plata" },
  { country: "Argentina", flag: "🇦🇷", player: "Lautaro Zuviría", medal: "🥉", medalLabel: "Bronce" },
];

const WOMENS: MedalEntry[] = [
  { country: "Argentina", flag: "🇦🇷", player: "Daniela Arias", medal: "🥇", medalLabel: "Oro" },
  { country: "Chile", flag: "🇨🇱", player: "Catalina Valdés", medal: "🥈", medalLabel: "Plata" },
  { country: "Colombia", flag: "🇨🇴", player: "María Fernanda López", medal: "🥉", medalLabel: "Bronce" },
];

function MedalTable({ title, entries }: { title: string; entries: MedalEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-light bg-surface/30">
      <div className="border-b border-surface-light px-4 py-3">
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-light text-left text-foreground/50">
            <th className="px-4 py-2 font-medium">Medalla</th>
            <th className="px-4 py-2 font-medium">País</th>
            <th className="px-4 py-2 font-medium">Jugador/a</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.medalLabel + e.country} className="border-b border-surface-light/50">
              <td className="px-4 py-3">
                <span className="text-lg">{e.medal}</span>
                <span className="ml-1 text-xs text-foreground/50">{e.medalLabel}</span>
              </td>
              <td className="px-4 py-3">
                <span className="mr-1">{e.flag}</span>
                {e.country}
              </td>
              <td className="px-4 py-3 font-medium">{e.player}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OdesurPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/escena" className="mb-4 inline-flex items-center text-sm text-foreground/50 hover:text-accent">
          ← Volver a Competitivo
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏅</span>
            <div>
              <h1 className="text-2xl font-black">Juegos Suramericanos ODESUR 2026</h1>
              <p className="text-sm text-foreground/50">Santa Fe, Argentina — Septiembre 2026</p>
            </div>
          </div>
        </header>

        <div className="mb-8 rounded-xl border border-gold/30 bg-gold/5 p-5">
          <h2 className="mb-2 text-sm font-bold text-gold">Hito histórico</h2>
          <p className="text-sm leading-relaxed text-foreground/70">
            Primera vez que esports otorga medallas oficiales en juegos multideportivos reconocidos por el
            Comité Olímpico Internacional. EA FC fue una de las disciplinas seleccionadas. Argentina fue
            representada por la DEVA (Deportes Electrónicos Virtuales Argentina).
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface/30 border border-surface-light px-4 py-3 text-center">
            <span className="block text-[10px] uppercase text-foreground/40">Formato</span>
            <span className="text-sm font-bold">1v1 Eliminación</span>
          </div>
          <div className="rounded-lg bg-surface/30 border border-surface-light px-4 py-3 text-center">
            <span className="block text-[10px] uppercase text-foreground/40">Sede</span>
            <span className="text-sm font-bold">Santa Fe, ARG</span>
          </div>
          <div className="rounded-lg bg-surface/30 border border-surface-light px-4 py-3 text-center">
            <span className="block text-[10px] uppercase text-foreground/40">Países</span>
            <span className="text-sm font-bold">12 participantes</span>
          </div>
        </div>

        <div className="space-y-6">
          <MedalTable title="🏆 Masculino" entries={MENS} />
          <MedalTable title="🏆 Femenino" entries={WOMENS} />
        </div>

        <div className="mt-8 rounded-xl border border-surface-light bg-surface/30 p-5">
          <h3 className="mb-3 text-sm font-bold">🇦🇷 Argentina en ODESUR</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 p-4">
              <p className="text-xs text-foreground/40">Femenino</p>
              <p className="mt-1 font-bold text-gold">🥇 Daniela Arias — Oro</p>
              <p className="mt-1 text-xs text-foreground/60">
                Primera medalla de oro argentina en esports en juegos multideportivos oficiales.
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-4">
              <p className="text-xs text-foreground/40">Masculino</p>
              <p className="mt-1 font-bold text-amber-600">🥉 Lautaro Zuviría — Bronce</p>
              <p className="mt-1 text-xs text-foreground/60">
                Medalla de bronce para Argentina en la rama masculina.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://www.argentina.gob.ar/noticias/esports-argentina-con-equipo-listo-para-santa-fe-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-surface-light px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-accent hover:text-accent"
          >
            📰 Info DEVA
          </a>
        </div>

        <p className="mt-8 text-center text-[11px] text-foreground/30">
          Datos recopilados de fuentes públicas. Algunos nombres de medallistas pueden no ser exactos.
        </p>
      </main>
    </div>
  );
}
