import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Llegan las primeras Ligas Oficiales de Modo Fosa",
  description:
    "Durante julio se disputarán las primeras Ligas Oficiales Modo Fosa: Ultimate Team y Equipos Reales. Competí, ganá y dejá tu marca.",
  openGraph: {
    title: "Llegan las primeras Ligas Oficiales de Modo Fosa",
    description:
      "Durante julio se disputarán las primeras Ligas Oficiales Modo Fosa. Dos ligas. Dos campeones. Una sola comunidad.",
    type: "article",
    images: [{ url: "/images/liga-oficial-4.png" }],
  },
};

export default function LigasOficialesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/actualidad"
          className="mb-6 inline-block text-sm text-foreground/50 transition-colors hover:text-accent"
        >
          ← Actualidad
        </Link>

        <div className="mb-4 flex items-center gap-3 text-sm text-foreground/50">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            Modo Fosa
          </span>
          <time dateTime="2026-06-20">20 de junio de 2026</time>
        </div>

        <div className="relative -mx-4 mb-8 aspect-square overflow-hidden rounded-xl sm:mx-0 sm:aspect-video">
          <Image
            src="/images/liga-oficial-4.png"
            alt="Liga Oficial Modo Fosa #1"
            fill
            priority
            className="object-cover"
          />
        </div>

        <h1 className="mb-8 text-2xl font-black leading-tight sm:text-4xl">
          Modo Fosa abre sus puertas a la competencia: llegan las primeras Ligas
          Oficiales de la comunidad
        </h1>

        <div className="prose-fosa space-y-6 text-[15px] leading-relaxed text-foreground/80 sm:text-base">
          <p>Hay momentos que marcan el comienzo de algo.</p>

          <p>Para Modo Fosa, ese momento llegó.</p>

          <p>
            Después de meses construyendo herramientas para la comunidad de FC 26
            (prodes, duelos, clasificación de jugadores, seguimiento competitivo y
            estadísticas) llega el momento de dar el siguiente paso: encontrar a
            los primeros campeones oficiales de la plataforma.
          </p>

          <p>
            Durante julio se disputarán las primeras Ligas Oficiales Modo Fosa,
            dos competiciones independientes pensadas para perfiles de jugadores
            diferentes, pero con un mismo objetivo: competir, ganar y dejar una
            marca dentro de la comunidad.
          </p>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            Dos formas de jugar. Una sola historia.
          </h2>

          <div className="!my-8 relative aspect-video overflow-hidden rounded-xl">
            <Image
              src="/images/liga-oficial-3.png"
              alt="Liga Ultimate Team y Liga Equipos Reales"
              fill
              className="object-cover"
            />
          </div>

          <h3 className="!mt-8 text-lg font-bold text-accent sm:text-xl">
            Liga Ultimate Team
          </h3>

          <p>
            La primera competición estará reservada para quienes viven FC 26 a
            través de Ultimate Team.
          </p>

          <p>
            Cada participante competirá con su propia plantilla, utilizando los
            jugadores que construyó durante la temporada.
          </p>

          <p>
            No importa si tu equipo está lleno de íconos, cartas especiales o
            jugadores que descubriste antes que nadie.
          </p>

          <p>Acá no alcanza con tener buenas cartas.</p>

          <p className="font-bold text-foreground">Hay que ganar.</p>

          <h3 className="!mt-8 text-lg font-bold text-accent sm:text-xl">
            Liga Equipos Reales
          </h3>

          <p>
            La segunda competición estará enfocada en la esencia más pura del
            fútbol.
          </p>

          <p>
            Cada jugador podrá elegir un club real para representar durante la
            competición.
          </p>

          <p>
            Real Madrid, Barcelona, Boca Juniors, River Plate, Manchester United o
            cualquier otro equipo disponible.
          </p>

          <p>La diferencia no estará en las cartas.</p>

          <p className="font-bold text-foreground">
            Estará en las decisiones, la táctica y el nivel de cada jugador.
          </p>

          <p>Dos formatos distintos.</p>

          <p>La misma presión.</p>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            El camino al primer campeón
          </h2>

          <p>Cada liga contará con un máximo de 20 participantes.</p>

          <p>
            El formato será todos contra todos, donde cada jugador deberá
            enfrentarse al resto de los competidores a lo largo de la temporada.
          </p>

          <p>Cada victoria suma.</p>

          <p>Cada empate cuenta.</p>

          <p>Cada derrota pesa.</p>

          <p>
            Y cuando termine la última fecha, sólo uno podrá convertirse en el
            primer campeón oficial de su categoría.
          </p>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            Mucho más que un premio
          </h2>

          <p>
            Los campeones recibirán el 75% del pozo generado por las
            inscripciones.
          </p>

          <p>Los subcampeones obtendrán el 15%.</p>

          <p>Pero el dinero no es lo más importante.</p>

          <p>
            Los ganadores ingresarán al Salón de la Fama de Modo Fosa, recibirán
            un banner exclusivo de campeón y asegurarán su lugar en futuras
            competiciones especiales organizadas por la comunidad.
          </p>

          <p>
            Además, todos los participantes de esta primera edición recibirán el
            reconocimiento de{" "}
            <strong className="text-foreground">Fundadores de la Fosa</strong>,
            una distinción reservada únicamente para quienes estuvieron presentes
            desde el comienzo.
          </p>

          <p>Porque dentro de algunos años habrá muchos torneos.</p>

          <p className="font-bold text-foreground">
            Pero sólo existirá una primera edición.
          </p>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            Distinciones individuales
          </h2>

          <p>
            La temporada también reconocerá a quienes dejen huella más allá de la
            tabla de posiciones.
          </p>

          <p>Se entregarán reconocimientos especiales como:</p>

          <ul className="!my-4 space-y-2 pl-2">
            <li>⚽ El Cañonero de la Fosa</li>
            <li>🧤 El Muro de la Fosa</li>
            <li>🔥 Entró y No Salió Más</li>
            <li>🤝 Fair Play Modo Fosa</li>
          </ul>

          <p>
            Premios pensados para destacar a quienes hacen grande una competición,
            dentro y fuera de la cancha.
          </p>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            La llama está encendida
          </h2>

          <p>Los campeones no levantarán una copa tradicional.</p>

          <p className="font-bold text-foreground">
            Levantarán la Bengala de la Fosa.
          </p>

          <div className="!my-8 relative aspect-video overflow-hidden rounded-xl">
            <Image
              src="/images/liga-oficial-1.png"
              alt="La Bengala de la Fosa — Trofeo oficial"
              fill
              className="object-cover"
            />
          </div>

          <p>
            Un trofeo diseñado especialmente para representar el espíritu de la
            comunidad: pasión, identidad y competencia.
          </p>

          <p>
            Porque en Modo Fosa no se trata solamente de ganar un torneo.
          </p>

          <p className="font-bold text-foreground">
            Se trata de ser recordado cuando todo esto recién empezaba.
          </p>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            ¿Cómo participar?
          </h2>

          <p>
            Las inscripciones para ambas competiciones ya se encuentran abiertas
            dentro de la sección{" "}
            <Link href="/torneos" className="font-bold text-accent hover:underline">
              &quot;Arena&quot;
            </Link>{" "}
            de Modo Fosa.
          </p>

          <p>Allí podrás encontrar:</p>

          <ul className="!my-4 space-y-2 pl-2">
            <li>
              🏆{" "}
              <Link
                href="/torneos/33a85ae9-510d-4e21-9011-5cf894302b24"
                className="font-bold text-accent hover:underline"
              >
                Liga Oficial Modo Fosa #1 – Ultimate Team
              </Link>
            </li>
            <li>
              ⚽{" "}
              <Link
                href="/torneos/f76f84a4-7447-43c1-b1f2-6d13a3143bcc"
                className="font-bold text-accent hover:underline"
              >
                Liga Oficial Modo Fosa #1 – Equipos Reales
              </Link>
            </li>
          </ul>

          <p>
            Cada torneo cuenta con su propia página, reglamento, tabla de
            posiciones y sistema de gestión de partidos.
          </p>

          <p>
            Además, cada participante puede compartir el enlace de inscripción con
            amigos, compañeros de club o rivales para ayudarlos a sumarse a la
            competencia.
          </p>

          <div className="!my-8 relative mx-auto max-w-md overflow-hidden rounded-xl">
            <Image
              src="/images/liga-oficial-2.png"
              alt="Liga Oficial Modo Fosa #1 — Información completa"
              width={600}
              height={900}
              className="w-full rounded-xl"
            />
          </div>

          <h2 className="!mt-10 text-xl font-bold text-foreground sm:text-2xl">
            Enlaces de inscripción
          </h2>

          <div className="!my-6 space-y-3">
            <Link
              href="/torneos/33a85ae9-510d-4e21-9011-5cf894302b24"
              className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 font-bold text-accent transition-colors hover:bg-accent/10"
            >
              🎮 Liga Ultimate Team
            </Link>
            <Link
              href="/torneos/f76f84a4-7447-43c1-b1f2-6d13a3143bcc"
              className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 font-bold text-accent transition-colors hover:bg-accent/10"
            >
              ⚽ Liga Equipos Reales
            </Link>
          </div>

          <p>Los cupos son limitados.</p>

          <p className="font-bold text-foreground">20 lugares.</p>

          <p className="font-bold text-foreground">Dos ligas.</p>

          <p className="font-bold text-foreground">Dos campeones.</p>

          <p className="font-bold text-foreground">Una sola comunidad.</p>

          <div className="!mt-12 border-t border-surface-light pt-8 text-center">
            <p className="text-lg font-bold text-foreground">
              Nos vemos en Arena.
            </p>
            <p className="mt-4 text-sm text-foreground/50">Modo Fosa.</p>
            <p className="text-sm text-foreground/50">
              Stats, mercado y fútbol.
            </p>
            <p className="mt-1 text-sm font-bold text-accent">No salís más.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
