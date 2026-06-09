import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description: "Conocé Modo Fosa: la comunidad argentina de EA FC. Torneos, ranking, prode y más.",
  alternates: { canonical: "/sobre-nosotros" },
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">
          Sobre <span className="text-accent">Modo Fosa</span>
        </h1>
        <p className="mb-8 text-foreground/60">
          La comunidad competitiva de EA FC para Argentina y Latinoamérica.
        </p>

        <div className="space-y-8 text-foreground/80">
          {/* Qué es */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">¿Qué es Modo Fosa?</h2>
            <p className="text-sm leading-relaxed">
              Modo Fosa es una plataforma comunitaria creada por y para jugadores de EA FC en Argentina.
              Nació con la idea de centralizar todo lo que un jugador competitivo necesita en un solo lugar:
              torneos organizados, duelos casuales, sistema de ranking, pronósticos deportivos (prode),
              noticias actualizadas y un directorio de los mejores creadores de contenido de la escena.
            </p>
          </section>

          {/* Qué ofrecemos */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">¿Qué ofrecemos?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">🏆 Torneos</p>
                <p className="text-sm text-foreground/60">
                  Organizamos torneos competitivos con brackets, sistema de disputas y premios.
                  Cualquier usuario registrado puede participar o crear su propio torneo.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">⚔️ Duelos</p>
                <p className="text-sm text-foreground/60">
                  Desafiá a otros jugadores a partidos 1v1 casuales. Cada resultado suma puntos al ranking global.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">📊 Ranking</p>
                <p className="text-sm text-foreground/60">
                  Sistema de clasificación en tiempo real basado en resultados de torneos y duelos.
                  Demostrá que sos el mejor.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">⚽ Prode</p>
                <p className="text-sm text-foreground/60">
                  Predecí resultados del Mundial 2026 y otras competencias. Competí con amigos
                  por premios y prestigio.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">🃏 Cartas FC 26</p>
                <p className="text-sm text-foreground/60">
                  Base de datos completa de cartas de EA FC 26 con stats, promos y precios actualizados.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">📰 Actualidad</p>
                <p className="text-sm text-foreground/60">
                  Noticias del mundo del fútbol y EA FC en tiempo real, recopiladas de las mejores fuentes.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">🎥 Streamers</p>
                <p className="text-sm text-foreground/60">
                  Directorio de creadores de contenido de EA FC con sus últimos videos y guías.
                </p>
              </div>
              <div className="rounded-xl border border-surface-light bg-surface/30 p-4">
                <p className="mb-1 text-lg font-bold">🌐 Escena Competitiva</p>
                <p className="text-sm text-foreground/60">
                  Seguimiento de ligas externas como IESA, eLPF, VPG y más.
                </p>
              </div>
            </div>
          </section>

          {/* Misión */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Nuestra misión</h2>
            <p className="text-sm leading-relaxed">
              Queremos que cada jugador de EA FC en Argentina tenga un espacio donde competir de forma organizada,
              mejorar su nivel, conectar con otros jugadores y disfrutar del juego al máximo.
              Modo Fosa no es solo una plataforma — es una comunidad donde el fútbol virtual se vive con la misma
              pasión que el real.
            </p>
          </section>

          {/* Equipo */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">El equipo</h2>
            <p className="text-sm leading-relaxed">
              Modo Fosa es un proyecto independiente desarrollado desde Buenos Aires, Argentina.
              Está impulsado por jugadores apasionados de EA FC que vieron la necesidad de una plataforma
              que unifique la escena competitiva argentina en un solo lugar.
            </p>
          </section>

          {/* Contacto */}
          <section className="rounded-xl border border-accent/20 bg-accent/5 p-6">
            <h2 className="mb-2 text-lg font-bold text-accent">¿Querés sumarte o colaborar?</h2>
            <p className="text-sm text-foreground/60">
              Si querés ser parte de Modo Fosa como streamer, organizador de torneos o colaborador,
              escribinos. Siempre estamos buscando gente que quiera hacer crecer la comunidad.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/contacto"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
              >
                Contactanos
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg border border-accent px-5 py-2.5 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
              >
                Registrate gratis
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
