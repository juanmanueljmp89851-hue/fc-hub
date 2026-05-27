import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
  title: "Términos y Condiciones — Modo Fosa",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Términos y Condiciones</h1>
        <p className="mb-4 text-sm text-foreground/50">
          Última actualización: 26 de mayo de 2026
        </p>

        <div className="prose-custom space-y-6 text-sm text-foreground/70 leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar Modo Fosa (en adelante, &quot;la Plataforma&quot;), aceptás estos
              Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguno de estos
              términos, no debés utilizar la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Descripción del servicio</h2>
            <p>
              Modo Fosa es una plataforma comunitaria para jugadores de EA FC en Argentina y
              Latinoamérica. Ofrece servicios de torneos, partidos casuales, ranking competitivo,
              pronósticos deportivos (prode), noticias y contenido de influencers. La Plataforma
              es gratuita para los usuarios registrados.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Registro y cuenta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Debés ser mayor de 13 años para crear una cuenta.</li>
              <li>La información proporcionada debe ser veraz y actualizada.</li>
              <li>Sos responsable de mantener la confidencialidad de tu cuenta.</li>
              <li>Cada persona puede tener una sola cuenta activa.</li>
              <li>Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Conducta del usuario</h2>
            <p>Al usar la Plataforma, te comprometés a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No utilizar lenguaje ofensivo, discriminatorio o amenazante.</li>
              <li>No hacer trampa ni manipular resultados de partidos o torneos.</li>
              <li>No crear cuentas múltiples para obtener ventajas.</li>
              <li>No compartir contenido ilegal o que viole derechos de terceros.</li>
              <li>No intentar acceder a cuentas de otros usuarios.</li>
              <li>Respetar las decisiones de los administradores y organizadores.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Partidos y resultados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Los resultados de partidos casuales requieren foto de prueba obligatoria.</li>
              <li>Ambos jugadores deben confirmar el resultado para que sea válido.</li>
              <li>Los resultados disputados serán revisados por administradores.</li>
              <li>La manipulación de resultados puede resultar en sanciones o expulsión.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Sistema de ranking y puntos</h2>
            <p>
              Los puntos de ranking se otorgan según los resultados de partidos. La Plataforma se
              reserva el derecho de ajustar puntos en caso de irregularidades detectadas. Los
              puntos no tienen valor monetario y no pueden canjearse ni transferirse.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Contenido del usuario</h2>
            <p>
              Al publicar comentarios, mensajes en el chat o subir imágenes, otorgás a Modo Fosa
              una licencia no exclusiva para mostrar dicho contenido en la Plataforma. Mantenés la
              propiedad de tu contenido. Nos reservamos el derecho de eliminar contenido que viole
              estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">8. Propiedad intelectual</h2>
            <p>
              EA FC, EA Sports y marcas relacionadas son propiedad de Electronic Arts Inc. Modo Fosa
              no está afiliado, patrocinado ni respaldado por Electronic Arts. El contenido de
              influencers y noticias pertenece a sus respectivos autores y fuentes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">9. Publicidad</h2>
            <p>
              La Plataforma puede mostrar publicidad de terceros. No nos hacemos responsables por
              el contenido de los anuncios ni por las interacciones con los anunciantes. Los
              ingresos publicitarios ayudan a mantener la Plataforma gratuita.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">10. Limitación de responsabilidad</h2>
            <p>
              Modo Fosa se proporciona &quot;tal cual&quot;, sin garantías de ningún tipo. No
              garantizamos la disponibilidad continua del servicio. No somos responsables por
              pérdidas derivadas del uso de la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">11. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
              cambios entran en vigencia al publicarse en esta página. El uso continuado de la
              Plataforma después de los cambios implica aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">12. Contacto</h2>
            <p>
              Para consultas sobre estos términos, escribinos a{" "}
              <a href="mailto:contacto@modofosa.com" className="text-accent hover:underline">
                contacto@modofosa.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
