import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reglamento",
  description: "Reglamento general de Modo Fosa. Normas para torneos, prode, duelos y la comunidad.",
  alternates: { canonical: "/reglamento" },
};

export default function ReglamentoPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Reglamento General</h1>
        <p className="mb-8 text-sm text-foreground/50">
          Última actualización: 9 de junio de 2026
        </p>

        <div className="space-y-8 text-foreground/80">
          {/* Conducta */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Conducta general</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Tratá a todos los usuarios con respeto. No se tolera discriminación, insultos, amenazas ni acoso de ningún tipo.</li>
              <li>No está permitido el uso de lenguaje ofensivo en nombres de usuario, equipos o mensajes del chat.</li>
              <li>Cualquier intento de hacer trampa, explotar bugs o manipular resultados será sancionado.</li>
              <li>Las cuentas son personales e intransferibles. Cada persona puede tener una sola cuenta.</li>
            </ul>
          </section>

          {/* Torneos */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Torneos</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Los torneos se juegan en las plataformas y modos indicados en cada convocatoria.</li>
              <li>Los participantes deben presentarse a sus partidos en el horario pactado. La tolerancia máxima es de 15 minutos.</li>
              <li>Si un jugador no se presenta, pierde el partido por W.O. (Walk Over).</li>
              <li>Los resultados deben cargarse con captura de pantalla como prueba. Ambos jugadores deben confirmar el resultado.</li>
              <li>En caso de disputa, se analizarán las pruebas presentadas. La decisión del staff es definitiva.</li>
              <li>Está prohibido el uso de glitches, exploits o cualquier forma de trampa durante los partidos.</li>
              <li>El organizador se reserva el derecho de modificar brackets, horarios o formato si es necesario para el correcto desarrollo del torneo.</li>
            </ul>
          </section>

          {/* Duelos */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Duelos casuales</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Los duelos casuales son partidos 1v1 que se pueden crear libremente entre usuarios registrados.</li>
              <li>Ambos jugadores deben acordar plataforma y modo de juego antes de iniciar.</li>
              <li>El resultado debe ser cargado por ambos jugadores. En caso de discrepancia, se puede abrir una disputa.</li>
              <li>Los duelos casuales otorgan puntos de ranking según el resultado.</li>
            </ul>
          </section>

          {/* Prode */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Prode</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>El prode es un sistema de predicciones deportivas. No involucra apuestas con dinero real.</li>
              <li>Las predicciones deben realizarse antes del cierre de cada fecha (indicado en la plataforma).</li>
              <li>Una vez cerrada la fecha, las predicciones no pueden modificarse.</li>
              <li>Los puntos se asignan automáticamente según el sistema de puntuación publicado en cada prode.</li>
              <li>Los prodes privados requieren aprobación del creador para unirse.</li>
              <li>Los premios (si los hay) son responsabilidad del creador del prode.</li>
            </ul>
          </section>

          {/* Ranking */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Sistema de ranking</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>El ranking se calcula en base a los resultados en torneos y duelos casuales.</li>
              <li>Los puntos se otorgan por victoria, empate o derrota según la fórmula publicada.</li>
              <li>El ranking se actualiza en tiempo real después de cada partido confirmado.</li>
              <li>En caso de inactividad prolongada (más de 30 días sin partidos), los puntos pueden decrecer gradualmente.</li>
            </ul>
          </section>

          {/* Sanciones */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Sanciones</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li><span className="font-medium text-gold">Advertencia:</span> primer incumplimiento menor. Se notifica al usuario.</li>
              <li><span className="font-medium text-gold">Suspensión temporal:</span> reincidencia o falta moderada. Duración según gravedad (1-30 días).</li>
              <li><span className="font-medium text-red-400">Ban permanente:</span> faltas graves como trampas comprobadas, acoso, suplantación de identidad o manipulación de resultados.</li>
              <li>Todas las sanciones pueden ser apeladas escribiendo a <a href="mailto:juanmanueljmp89851@gmail.com" className="text-accent hover:underline">juanmanueljmp89851@gmail.com</a>.</li>
            </ul>
          </section>

          {/* Contenido */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Contenido y streamers</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Los streamers destacados son seleccionados por el equipo de Modo Fosa.</li>
              <li>El contenido publicado en la sección de Actualidad proviene de fuentes públicas RSS y se atribuye a su fuente original.</li>
              <li>Modo Fosa no se hace responsable del contenido generado por los streamers.</li>
            </ul>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">8. Modificaciones</h2>
            <p className="text-sm">
              Modo Fosa se reserva el derecho de modificar este reglamento en cualquier momento.
              Los cambios serán comunicados a través de la plataforma y/o redes sociales.
              El uso continuado de la plataforma implica la aceptación de las modificaciones.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">9. Contacto</h2>
            <p className="text-sm">
              Para dudas sobre el reglamento, sanciones o apelaciones, escribinos a{" "}
              <a href="mailto:juanmanueljmp89851@gmail.com" className="text-accent hover:underline">
                juanmanueljmp89851@gmail.com
              </a>{" "}
              o por{" "}
              <a href="https://wa.me/5491176361148" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                WhatsApp
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 text-sm text-foreground/40">
          <p>
            Al usar Modo Fosa aceptás este reglamento y nuestros{" "}
            <Link href="/legal/terminos" className="text-accent hover:underline">Términos y Condiciones</Link>{" "}
            y{" "}
            <Link href="/legal/privacidad" className="text-accent hover:underline">Política de Privacidad</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
