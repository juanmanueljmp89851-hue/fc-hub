import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad de Modo Fosa. Cómo recopilamos, usamos y protegemos tus datos.",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Política de Privacidad</h1>
        <p className="mb-8 text-sm text-foreground/50">
          Última actualización: 9 de junio de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Introducción</h2>
            <p>
              En Modo Fosa (www.modofosa.com.ar) respetamos tu privacidad y nos comprometemos a proteger
              tus datos personales. Esta Política de Privacidad explica qué información recopilamos,
              cómo la utilizamos y cuáles son tus derechos. Al usar nuestra Plataforma, aceptás las
              prácticas descritas en este documento.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Responsable del tratamiento</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Plataforma:</strong> Modo Fosa (www.modofosa.com.ar)</li>
              <li><strong>Email de contacto:</strong>{" "}
                <a href="mailto:juanmanueljmp89851@gmail.com" className="text-accent hover:underline">
                  juanmanueljmp89851@gmail.com
                </a>
              </li>
              <li><strong>Ubicación:</strong> Buenos Aires, Argentina</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Datos que recopilamos</h2>
            <p className="mb-2">Recopilamos los siguientes tipos de información:</p>

            <h3 className="mb-1 mt-3 font-bold text-foreground">3.1 Datos proporcionados por el usuario</h3>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Registro:</strong> nombre de usuario, dirección de email y contraseña (almacenada de forma encriptada).</li>
              <li><strong>Perfil:</strong> información adicional que elijas compartir como avatar, biografía o redes sociales.</li>
              <li><strong>Actividad:</strong> resultados de torneos, duelos, predicciones del prode y mensajes en la plataforma.</li>
            </ul>

            <h3 className="mb-1 mt-3 font-bold text-foreground">3.2 Datos recopilados automáticamente</h3>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, páginas visitadas y tiempo de permanencia.</li>
              <li><strong>Cookies:</strong> utilizamos cookies técnicas necesarias para el funcionamiento del sitio y cookies de terceros para análisis (ver sección 7).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Uso de los datos</h2>
            <p>Utilizamos tus datos para:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Crear y gestionar tu cuenta de usuario.</li>
              <li>Permitir la participación en torneos, duelos, prodes y otras funcionalidades.</li>
              <li>Calcular y mostrar el ranking de jugadores.</li>
              <li>Enviar notificaciones relacionadas con tu actividad (solicitudes de prode, resultados, etc.).</li>
              <li>Mejorar la experiencia de usuario y el funcionamiento de la Plataforma.</li>
              <li>Prevenir fraudes, trampas y usos indebidos del servicio.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Base legal del tratamiento</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Consentimiento:</strong> al registrarte y usar la Plataforma, prestás tu consentimiento para el tratamiento de tus datos según esta política.</li>
              <li><strong>Ejecución del servicio:</strong> el tratamiento es necesario para proporcionarte las funcionalidades de la Plataforma.</li>
              <li><strong>Interés legítimo:</strong> para prevenir fraudes y mejorar el servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Compartición de datos</h2>
            <p>No vendemos ni alquilamos tus datos personales a terceros. Podemos compartir información con:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li><strong>Proveedores de infraestructura:</strong> Vercel (hosting), Supabase (base de datos y autenticación). Estos proveedores procesan datos en nuestro nombre bajo acuerdos de confidencialidad.</li>
              <li><strong>Información pública:</strong> tu nombre de usuario, ranking, resultados de torneos y estadísticas son visibles para otros usuarios como parte del funcionamiento de la Plataforma.</li>
              <li><strong>Requerimientos legales:</strong> podemos divulgar información si es requerido por ley o por una autoridad competente.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Cookies y tecnologías similares</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Cookies esenciales:</strong> necesarias para el inicio de sesión y el funcionamiento básico del sitio. No se pueden desactivar.</li>
              <li><strong>Cookies de análisis:</strong> utilizamos herramientas de análisis para entender cómo se usa la Plataforma y mejorar el servicio.</li>
              <li><strong>Google AdSense:</strong> nuestro sitio puede mostrar publicidad a través de Google AdSense, que utiliza cookies para personalizar anuncios según tus intereses. Podés gestionar tus preferencias de anuncios en{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  adssettings.google.com
                </a>.
              </li>
            </ul>
            <p className="mt-2">
              Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar el funcionamiento de algunas funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">8. Seguridad de los datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales,
              incluyendo:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Cifrado de contraseñas mediante algoritmos seguros.</li>
              <li>Comunicaciones protegidas mediante HTTPS/TLS.</li>
              <li>Autenticación segura a través de Supabase Auth.</li>
              <li>Acceso restringido a la base de datos con políticas de seguridad a nivel de fila (RLS).</li>
            </ul>
            <p className="mt-2">
              Sin embargo, ningún sistema es 100% seguro. En caso de una brecha de seguridad que afecte tus datos,
              te notificaremos lo antes posible.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">9. Retención de datos</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Conservamos tus datos mientras tu cuenta esté activa.</li>
              <li>Si solicitás la eliminación de tu cuenta, eliminaremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligación legal.</li>
              <li>Los resultados de torneos y estadísticas pueden conservarse de forma anonimizada para el historial de la Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">10. Tus derechos</h2>
            <p>De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li><strong>Acceso:</strong> conocer qué datos personales tenemos sobre vos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos personales.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, escribinos a{" "}
              <a href="mailto:juanmanueljmp89851@gmail.com" className="text-accent hover:underline">
                juanmanueljmp89851@gmail.com
              </a>{" "}
              indicando tu nombre de usuario y el derecho que querés ejercer. Responderemos en un plazo máximo de 10 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">11. Menores de edad</h2>
            <p>
              Modo Fosa no está dirigido a menores de 13 años. No recopilamos intencionalmente datos de menores
              de esa edad. Si descubrimos que hemos recopilado datos de un menor de 13 años sin consentimiento
              parental, los eliminaremos de inmediato.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">12. Transferencia internacional de datos</h2>
            <p>
              Tus datos pueden ser procesados en servidores ubicados fuera de Argentina (proveedores de
              infraestructura como Vercel y Supabase operan globalmente). Estos proveedores cumplen con
              estándares de protección de datos adecuados y procesan la información bajo acuerdos de
              confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">13. Modificaciones</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. La fecha de última actualización
              se indica al inicio de esta página. Te recomendamos revisarla regularmente. El uso continuado
              de la Plataforma tras una modificación implica la aceptación de la nueva política.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">14. Contacto</h2>
            <p>
              Para consultas sobre privacidad o protección de datos, contactanos a{" "}
              <a href="mailto:juanmanueljmp89851@gmail.com" className="text-accent hover:underline">
                juanmanueljmp89851@gmail.com
              </a>{" "}
              o por{" "}
              <a href="https://wa.me/5491176361148" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                WhatsApp
              </a>.
            </p>
            <p className="mt-2">
              También podés dirigir reclamos a la Agencia de Acceso a la Información Pública (AAIP),
              órgano de control de la Ley 25.326:{" "}
              <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                www.argentina.gob.ar/aaip
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 text-sm text-foreground/40">
          <p>
            Leé también nuestros{" "}
            <Link href="/legal/terminos" className="text-accent hover:underline">Términos y Condiciones</Link>{" "}
            y el{" "}
            <Link href="/reglamento" className="text-accent hover:underline">Reglamento General</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
