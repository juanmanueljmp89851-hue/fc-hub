import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bases y Condiciones — Programa de Embajadores | Modo Fosa",
  description: "Bases y condiciones generales del programa de Embajadores de Modo Fosa.",
  alternates: { canonical: "/legal/embajadores" },
};

export default function BasesEmbajadoresPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/embajadores" className="mb-4 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-accent">
          ← Volver a Embajadores
        </Link>
        <h1 className="mb-2 text-3xl font-bold">Bases y Condiciones — Programa de Embajadores</h1>
        <p className="mb-8 text-sm text-foreground/50">
          Última actualización: 9 de agosto de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Objeto del programa</h2>
            <p>
              El Programa de Embajadores de Modo Fosa (en adelante, &quot;el Programa&quot;) es una iniciativa
              mediante la cual los usuarios registrados de la plataforma www.modofosa.com.ar pueden invitar
              a nuevos jugadores a unirse a la comunidad, acumulando reconocimiento y accediendo a premios
              a través de competencias mensuales denominadas &quot;Embajador del Mes&quot;.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Participación</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Puede participar cualquier usuario registrado en Modo Fosa con una cuenta activa y verificada.</li>
              <li>La participación es gratuita y voluntaria.</li>
              <li>Cada usuario recibe un link de referido único, accesible desde su perfil.</li>
              <li>No existe límite de referidos por embajador.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Referidos válidos</h2>
            <p className="mb-2">
              Un referido se considera &quot;válido&quot; cuando la persona invitada se registra a través del
              link del embajador y cumple <strong>al menos una</strong> de las siguientes condiciones de actividad real:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li><strong>Duelos:</strong> Completar 5 duelos contra al menos 3 rivales distintos.</li>
              <li><strong>Participación en torneo:</strong> Inscribirse a un torneo y jugar al menos 1 partido.</li>
              <li><strong>Creación de torneo:</strong> Crear un torneo con al menos 5 participantes confirmados y 2 partidos disputados.</li>
              <li><strong>Creación de prode:</strong> Crear un prode con al menos 5 participantes.</li>
            </ul>
            <p className="mt-2">
              Cada referido puede validarse una única vez. La validación es automática y verificada por el
              sistema. Solo los referidos válidos cuentan para el ranking del período activo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Sistema anti-fraude</h2>
            <p>
              Modo Fosa emplea un sistema automático de detección de fraude que evalúa indicadores como
              cuentas con identificadores de juego compartidos, registros masivos en intervalos cortos,
              y actividad exclusivamente entre referidos del mismo embajador. Los referidos marcados por
              el sistema quedan sujetos a revisión manual del equipo administrador, quien podrá aprobar
              o rechazar la conversión.
            </p>
            <p className="mt-2">
              El intento deliberado de manipular el sistema (cuentas falsas, bots, auto-referidos, acuerdos
              para inflar métricas) dará lugar a la descalificación del embajador y la invalidación de
              todos sus referidos en el período afectado, sin derecho a reclamo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Bengalas</h2>
            <p>
              Las bengalas son una unidad de reconocimiento interna de Modo Fosa otorgadas automáticamente
              al validarse un referido. Las bengalas no tienen valor monetario, no son transferibles ni
              canjeables fuera de la plataforma. Se utilizan como criterio de desempate en el ranking.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Períodos y ranking</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Cada período de competencia (&quot;Embajador del Mes&quot;) tiene fechas de inicio y fin definidas por la administración.</li>
              <li>El ranking se ordena por cantidad de referidos válidos convertidos dentro del período.</li>
              <li>En caso de empate, se desempata por cantidad de bengalas; si persiste, por fecha de registro más antigua.</li>
              <li>Los premios de cada período se especifican en las bases particulares del mismo.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Premios</h2>
            <p>
              Los premios se comunican al inicio de cada período y pueden variar entre períodos. La entrega
              se coordina directamente entre Modo Fosa y el ganador. Modo Fosa se reserva el derecho de
              sustituir premios por otros de valor equivalente en caso de fuerza mayor o falta de stock.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">8. Modificaciones</h2>
            <p>
              Modo Fosa se reserva el derecho de modificar, suspender o finalizar el Programa en cualquier
              momento, comunicando los cambios a través de la plataforma. Los períodos en curso se regirán
              por las condiciones vigentes al momento de su activación, salvo que una modificación sea
              necesaria para corregir situaciones de fraude o abuso.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">9. Jurisdicción</h2>
            <p>
              Estas bases se rigen por las leyes de la República Argentina. Cualquier controversia será
              resuelta por los tribunales competentes de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
