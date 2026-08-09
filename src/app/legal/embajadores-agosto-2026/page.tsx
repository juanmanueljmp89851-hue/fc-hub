import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bases Embajador de Agosto 2026 | Modo Fosa",
  description: "Bases y condiciones del período Embajador de Agosto 2026 en Modo Fosa.",
  alternates: { canonical: "/legal/embajadores-agosto-2026" },
};

export default function BasesAgosto2026Page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/embajadores" className="mb-4 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-accent">
          ← Volver a Embajadores
        </Link>
        <h1 className="mb-2 text-3xl font-bold">Bases y Condiciones — Embajador de Agosto 2026</h1>
        <p className="mb-8 text-sm text-foreground/50">
          Vigentes desde el 1 de agosto de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Período</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li><strong>Nombre:</strong> Embajador de Agosto 2026</li>
              <li><strong>Inicio:</strong> 1 de agosto de 2026, 00:00 hs (hora Argentina)</li>
              <li><strong>Fin:</strong> 1 de septiembre de 2026, 00:00 hs (hora Argentina)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Premios</h2>
            <p className="mb-2">Se premiarán las primeras tres posiciones del ranking al cierre del período:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>🥇 <strong>1er puesto:</strong> EA FC 27 Edición Estándar (código digital)</li>
              <li>🥈 <strong>2do puesto:</strong> Remera Modo Fosa edición limitada</li>
              <li>🥉 <strong>3er puesto:</strong> Mención de honor + rol destacado en la comunidad</li>
            </ul>
            <p className="mt-2 text-xs text-foreground/50">
              Los premios son orientativos y pueden ajustarse previo al cierre del período.
              Modo Fosa confirmará los premios definitivos al momento de la entrega.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Mecánica</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Los embajadores compiten acumulando referidos válidos durante el período.</li>
              <li>El ranking se actualiza en tiempo real en la sección <Link href="/embajadores" className="text-accent hover:underline">Embajadores</Link>.</li>
              <li>Solo se contabilizan referidos cuya conversión se haya validado dentro de las fechas del período.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Criterio de conversión</h2>
            <p className="mb-2">
              Un referido se valida cuando cumple al menos una de estas condiciones:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Completar 5 duelos contra al menos 3 rivales distintos.</li>
              <li>Inscribirse a un torneo y jugar al menos 1 partido.</li>
              <li>Crear un torneo con 5+ participantes y al menos 2 partidos disputados.</li>
              <li>Crear un prode con 5+ participantes.</li>
            </ul>
            <p className="mt-2">
              La validación es automática. Los referidos marcados por el sistema anti-fraude quedan
              sujetos a revisión manual.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Desempate</h2>
            <p>
              En caso de igualdad en referidos válidos, se desempata por: (1) mayor cantidad de bengalas
              acumuladas en el período; (2) fecha de registro más antigua en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Descalificación</h2>
            <p>
              Cualquier embajador que incurra en prácticas fraudulentas (cuentas falsas, bots,
              auto-referidos, acuerdos para inflar métricas) será descalificado del período sin
              derecho a premio. La decisión del equipo administrador es inapelable.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Condiciones generales</h2>
            <p>
              Este período se rige por las{" "}
              <Link href="/legal/embajadores" className="text-accent hover:underline">
                Bases y Condiciones generales del Programa de Embajadores
              </Link>{" "}
              y los{" "}
              <Link href="/legal/terminos" className="text-accent hover:underline">
                Términos y Condiciones
              </Link>{" "}
              de Modo Fosa. En caso de conflicto entre las bases particulares y las generales,
              prevalecen las particulares del período.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
