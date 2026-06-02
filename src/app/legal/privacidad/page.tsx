import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
  title: "Política de Privacidad — Modo Fosa",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Política de Privacidad</h1>
        <p className="mb-4 text-sm text-foreground/50">
          Última actualización: 26 de mayo de 2026
        </p>

        <div className="prose-custom space-y-6 text-sm text-foreground/70 leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">1. Información que recopilamos</h2>
            <p>Recopilamos la siguiente información cuando usás Modo Fosa:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos de registro:</strong> nombre de usuario, dirección de email, contraseña (encriptada).</li>
              <li><strong>Datos de perfil:</strong> avatar, plataforma de juego, nombre de equipo (opcionales).</li>
              <li><strong>Datos de uso:</strong> resultados de partidos, puntos de ranking, participación en torneos y prode.</li>
              <li><strong>Imágenes:</strong> fotos de prueba subidas como evidencia de resultados de partidos.</li>
              <li><strong>Mensajes:</strong> mensajes enviados en el chat del lobby.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, páginas visitadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">2. Cómo usamos tu información</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proveer y mantener los servicios de la Plataforma.</li>
              <li>Gestionar tu cuenta y perfil de usuario.</li>
              <li>Calcular y actualizar rankings competitivos.</li>
              <li>Verificar resultados de partidos mediante fotos de prueba.</li>
              <li>Enviar notificaciones relacionadas con desafíos, torneos y actividad.</li>
              <li>Mejorar la experiencia del usuario y desarrollar nuevas funcionalidades.</li>
              <li>Mostrar publicidad personalizada (ver sección 5).</li>
              <li>Prevenir fraude y hacer cumplir los Términos y Condiciones.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">3. Almacenamiento de datos</h2>
            <p>
              Tus datos se almacenan en servidores de Supabase (infraestructura en la nube). Las
              imágenes de prueba se almacenan en Supabase Storage. Implementamos medidas de seguridad
              estándar de la industria, incluyendo encriptación en tránsito (HTTPS) y en reposo.
            </p>
            <p className="mt-2">
              Las contraseñas se almacenan utilizando algoritmos de hash seguros y nunca en texto plano.
              No tenemos acceso a tu contraseña original.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">4. Cookies y tecnologías similares</h2>
            <p>Utilizamos cookies para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookies esenciales:</strong> mantener tu sesión activa y autenticación.</li>
              <li><strong>Cookies de rendimiento:</strong> analizar cómo se usa la Plataforma para mejorarla.</li>
              <li><strong>Cookies publicitarias:</strong> mostrar anuncios relevantes a través de nuestros socios publicitarios.</li>
            </ul>
            <p className="mt-2">
              Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar la
              funcionalidad de la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">5. Publicidad de terceros</h2>
            <p>
              Modo Fosa utiliza servicios de publicidad de terceros, incluyendo Google AdSense y otros
              proveedores, para mostrar anuncios. Estos servicios pueden:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Usar cookies para mostrar anuncios basados en visitas previas a este u otros sitios.</li>
              <li>Recopilar datos anónimos sobre tu actividad de navegación.</li>
              <li>Utilizar tecnologías como web beacons para medir efectividad publicitaria.</li>
            </ul>
            <p className="mt-2">
              Podés optar por no recibir publicidad personalizada visitando{" "}
              <a href="https://www.google.com/settings/ads" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                Configuración de anuncios de Google
              </a>{" "}
              o{" "}
              <a href="https://www.aboutads.info/choices/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                aboutads.info
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">6. Compartir información</h2>
            <p>No vendemos tu información personal. Podemos compartir datos con:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Otros usuarios:</strong> tu nombre de usuario, avatar, ranking y resultados son visibles públicamente.</li>
              <li><strong>Proveedores de servicios:</strong> hosting (Supabase/Vercel), servicios de email, analítica.</li>
              <li><strong>Socios publicitarios:</strong> datos anónimos agregados para publicidad.</li>
              <li><strong>Autoridades:</strong> cuando sea requerido por ley aplicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">7. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta, tus datos
              personales se eliminarán dentro de los 30 días, excepto cuando debamos conservarlos por
              obligaciones legales. Los resultados de partidos y rankings pueden mantenerse de forma
              anónima para la integridad de las estadísticas.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">8. Tus derechos</h2>
            <p>Tenés derecho a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acceder a los datos personales que tenemos sobre vos.</li>
              <li>Rectificar datos incorrectos o incompletos.</li>
              <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
              <li>Oponerte al procesamiento de tus datos para publicidad personalizada.</li>
              <li>Solicitar una copia de tus datos en formato portable.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, contactanos a{" "}
              <a href="mailto:contacto@modofosa.com" className="text-accent hover:underline">
                contacto@modofosa.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">9. Menores de edad</h2>
            <p>
              La Plataforma está destinada a usuarios mayores de 13 años. No recopilamos intencionalmente
              datos de menores de 13 años. Si descubrimos que un menor de 13 años creó una cuenta,
              procederemos a eliminarla.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">10. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo
              encriptación, autenticación segura y control de acceso. Sin embargo, ningún sistema es
              100% seguro y no podemos garantizar seguridad absoluta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">11. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Notificaremos cambios significativos
              a través de la Plataforma o por email. El uso continuado después de los cambios implica
              aceptación de la política actualizada.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">12. Contacto</h2>
            <p>
              Para consultas sobre privacidad o protección de datos, escribinos a{" "}
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
