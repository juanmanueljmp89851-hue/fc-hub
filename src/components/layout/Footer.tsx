import Link from "next/link";

const platformLinks = [
  { href: "/jugar", label: "Jugar" },
  { href: "/torneos", label: "Torneos" },
  { href: "/prode", label: "Prode" },
  { href: "/ranking", label: "Ranking" },
  { href: "/influencers", label: "Influencers" },
];

const communityLinks = [
  { href: "https://discord.gg/modofosa", label: "Discord", external: true },
  { href: "/reglamento", label: "Reglamento" },
  { href: "/contacto", label: "Contacto" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
];

const legalLinks = [
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/privacidad", label: "Política de privacidad" },
];

const socialLinks = [
  { href: "https://discord.gg/modofosa", label: "DISCORD" },
  { href: "https://x.com/modofosa", label: "X / TWITTER" },
  { href: "https://instagram.com/modofosa", label: "INSTAGRAM" },
  { href: "https://youtube.com/@modofosa", label: "YOUTUBE" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-light bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Main grid */}
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <span className="text-xl font-bold text-accent">MODO</span>
              <span className="text-xl font-bold text-foreground">FOSA</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/50">
              La comunidad competitiva de EA FC para Argentina y Latinoamérica. Torneos, ranking, prodes
              y stream de los creadores que rompen la fosa.
            </p>

            {/* Social */}
            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-surface-light px-3 py-1.5 text-[11px] font-bold tracking-wider text-foreground/50 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
              Plataforma
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground/50 transition-colors hover:text-foreground/80"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Comunidad */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
              Comunidad
            </h4>
            <ul className="space-y-2.5">
              {communityLinks.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/50 transition-colors hover:text-foreground/80"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/50 transition-colors hover:text-foreground/80"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground/50 transition-colors hover:text-foreground/80"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-surface-light pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-relaxed text-foreground/30">
            <strong className="text-foreground/50">Disclaimer EA.</strong> Modo Fosa no está afiliado,
            asociado, autorizado, respaldado por, ni de ninguna manera oficialmente conectado con
            Electronic Arts Inc. o cualquiera de sus subsidiarias. EA FC™ es una marca registrada de
            Electronic Arts Inc.
          </p>
          <div className="shrink-0 text-right text-xs text-foreground/40">
            <p>Contacto</p>
            <p className="text-foreground/50">juanmanueljmp89851@gmail.com</p>
            <p className="text-foreground/40">Buenos Aires, Argentina</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
