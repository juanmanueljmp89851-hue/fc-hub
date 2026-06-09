import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de Modo Fosa. Plataforma de torneos, prode y comunidad de EA FC.",
  alternates: { canonical: "/legal/terminos" },
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Términos y Condiciones</h1>
        <p className="mb-8 text-sm text-foreground/50">
          Última actualización: 9 de junio de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar el sitio web www.modofosa.com.ar (en adelante, &quot;Modo Fosa&quot; o
              &quot;la Plataforma&quot;), aceptás estos Términos y Condiciones en su totalidad. Si no estás
              de acuerdo con alguno de estos términos, no debés utilizar la Plataforma. El uso continuado
              del sitio implica la aceptación de cualquier modificación futura de estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Descripción del servicio</h2>
            <p>
              Modo Fosa es una plataforma comunitaria gratuita orientada a jugadores de EA FC en Argentina y
              Latinoamérica. El servicio incluye, entre otras funcionalidades:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Organización y participación en torneos competitivos de EA FC.</li>
              <li>Sistema de duelos casuales entre usuarios registrados.</li>
              <li>Ranking de jugadores basado en resultados de torneos y duelos.</li>
              <li>Sistema de pronósticos deportivos (Prode) sin apuestas con dinero real.</li>
              <li>Agregador de noticias deportivas de fuentes públicas RSS.</li>
              <li>Directorio de creadores de contenido y streamers.</li>
              <li>Base de datos de cartas de EA FC.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Registro y cuentas</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Para acceder a ciertas funcionalidades es necesario crear una cuenta proporcionando datos veraces.</li>
              <li>Cada persona puede registrar una única cuenta. Las cuentas son personales e intransferibles.</li>
              <li>Sos responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Modo Fosa se reserva el derecho de suspender o eliminar cuentas que violen estos términos o el{" "}
                <Link href="/reglamento" className="text-accent hover:underline">Reglamento</Link>.</li>
              <li>Podés solicitar la eliminación de tu cuenta en cualquier momento contactándonos por los canales
                indicados en la sección de <Link href="/contacto" className="text-accent hover:underline">Contacto</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Conducta del usuario</h2>
            <p>Al usar Modo Fosa, te comprometés a:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Respetar a los demás usuarios y no incurrir en discriminación, acoso, amenazas o insultos.</li>
              <li>No utilizar la Plataforma para actividades ilegales o no autorizadas.</li>
              <li>No intentar acceder a cuentas ajenas ni manipular el funcionamiento del sitio.</li>
              <li>No utilizar bots, scripts automatizados o cualquier herramienta que interfiera con el servicio.</li>
              <li>No hacer trampa ni manipular resultados en torneos, duelos o prodes.</li>
              <li>Cumplir con el <Link href="/reglamento" className="text-accent hover:underline">Reglamento General</Link> de la Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Propiedad intelectual</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>El diseño, código, textos originales y marca &quot;Modo Fosa&quot; son propiedad de sus creadores.</li>
              <li>Las noticias mostradas en la sección de Actualidad provienen de fuentes RSS públicas y se
                atribuyen a sus respectivos medios de origen.</li>
              <li>EA FC™ y todas las marcas relacionadas son propiedad de Electronic Arts Inc.
                Modo Fosa no está afiliado ni respaldado por EA.</li>
              <li>Los usuarios conservan los derechos sobre el contenido que generen en la Plataforma,
                pero otorgan a Modo Fosa una licencia no exclusiva para mostrarlo dentro del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Prode y pronósticos</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>El sistema de Prode es un juego de pronósticos deportivos con fines recreativos.</li>
              <li>No involucra apuestas con dinero real ni constituye un juego de azar.</li>
              <li>Los premios (si los hubiera) son responsabilidad exclusiva del creador de cada prode.</li>
              <li>Modo Fosa no garantiza la entrega de premios ofrecidos por terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Torneos y competencias</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>La participación en torneos es voluntaria y gratuita salvo que se indique lo contrario.</li>
              <li>Modo Fosa actúa como organizador y árbitro de las competencias dentro de la Plataforma.</li>
              <li>Las decisiones del staff respecto a disputas y resultados son definitivas.</li>
              <li>Nos reservamos el derecho de modificar formatos, horarios o cancelar torneos si fuera necesario.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">8. Limitación de responsabilidad</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Modo Fosa se proporciona &quot;tal cual&quot; sin garantías de ningún tipo, expresas o implícitas.</li>
              <li>No garantizamos la disponibilidad continua e ininterrumpida del servicio.</li>
              <li>No somos responsables por daños directos o indirectos derivados del uso de la Plataforma.</li>
              <li>No somos responsables por el contenido generado por los usuarios ni por las interacciones entre ellos.</li>
              <li>No somos responsables por el contenido de sitios de terceros enlazados desde la Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">9. Modificaciones</h2>
            <p>
              Modo Fosa se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
              Las modificaciones entran en vigencia desde su publicación en esta página. Se recomienda revisar
              esta sección periódicamente. El uso continuado de la Plataforma tras una modificación implica
              la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">10. Legislación aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Para cualquier
              controversia derivada del uso de la Plataforma, las partes se someten a la jurisdicción de los
              tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, República Argentina.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">11. Contacto</h2>
            <p>
              Para consultas sobre estos términos, escribinos a{" "}
              <a href="mailto:juanmanueljmp89851@gmail.com" className="text-accent hover:underline">
                juanmanueljmp89851@gmail.com
              </a>{" "}
              o visitá nuestra página de{" "}
              <Link href="/contacto" className="text-accent hover:underline">Contacto</Link>.
            </p>
          </section>
        </div>

        <div className="mt-8 text-sm text-foreground/40">
          <p>
            Leé también nuestra{" "}
            <Link href="/legal/privacidad" className="text-accent hover:underline">Política de Privacidad</Link>{" "}
            y el{" "}
            <Link href="/reglamento" className="text-accent hover:underline">Reglamento General</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
