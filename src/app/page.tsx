import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { NewsFeed } from "@/components/home/NewsFeed";
import { LiveTicker } from "@/components/home/LiveTicker";

const quickLinks = [
  {
    href: "/jugar",
    title: "Jugar",
    description: "Desafiá rivales y subí en el ranking",
    icon: "🎮",
  },
  {
    href: "/torneos",
    title: "Torneos",
    description: "Creá o unite a torneos de EA FC",
    icon: "🏆",
  },
  {
    href: "/prode",
    title: "Prode Mundial",
    description: "Predecí los resultados del Mundial 2026",
    icon: "⚽",
  },
  {
    href: "/influencers",
    title: "Influencers",
    description: "Videos de los mejores creadores",
    icon: "🎬",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Banner — estética Claude Design */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-surface-light bg-gradient-to-br from-surface via-surface to-surface-light p-8 md:p-12">
          {/* Glow decorativo */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />

          <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent">
            <span className="inline-block h-px w-5 bg-accent" />
            EA FC · Argentina y LATAM
          </p>
          <h1 className="mb-3 text-4xl font-black leading-[1.1] md:text-5xl">
            <span className="italic text-foreground">Tu fosa, </span>
            <span className="italic text-foreground">tu ranking, </span>
            <span className="italic text-accent">tu comunidad.</span>
          </h1>
          <p className="max-w-xl text-sm text-foreground/50">
            La comunidad #1 de EA FC en Argentina. Organizá torneos, competí en
            el ranking, predecí el Mundial 2026 y más.
          </p>
        </section>

        {/* Live Ticker — resultados en vivo fútbol real + FC 26 */}
        <div className="-mx-4 mb-8">
          <LiveTicker />
        </div>

        {/* Quick Links */}
        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="flex h-full flex-col justify-between transition-all hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,255,135,0.05)]">
                <div>
                  <span className="mb-2 block text-2xl">{link.icon}</span>
                  <h3 className="font-bold text-foreground">{link.title}</h3>
                  <p className="mt-1 text-xs text-foreground/50">
                    {link.description}
                  </p>
                </div>
                <div className="mt-3 text-right">
                  <span className="text-foreground/20 transition-colors group-hover:text-accent">→</span>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        {/* News Feed */}
        <section className="mb-8">
          <NewsFeed />
        </section>
      </main>
    </div>
  );
}
