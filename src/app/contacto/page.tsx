import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contactá al equipo de Modo Fosa. Mail, WhatsApp y redes sociales.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Contacto</h1>
        <p className="mb-8 text-foreground/60">
          ¿Tenés dudas, sugerencias o querés colaborar con Modo Fosa? Escribinos por cualquiera de estos canales.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Email */}
          <div className="rounded-xl border border-surface-light bg-surface/30 p-6">
            <div className="mb-3 text-3xl">📧</div>
            <h2 className="mb-1 text-lg font-bold">Email</h2>
            <p className="text-sm text-foreground/60">Para consultas generales, soporte y colaboraciones.</p>
            <a
              href="mailto:juanmanueljmp89851@gmail.com"
              className="mt-3 inline-block text-accent hover:underline"
            >
              juanmanueljmp89851@gmail.com
            </a>
          </div>

          {/* WhatsApp */}
          <div className="rounded-xl border border-surface-light bg-surface/30 p-6">
            <div className="mb-3 text-3xl">💬</div>
            <h2 className="mb-1 text-lg font-bold">WhatsApp</h2>
            <p className="text-sm text-foreground/60">Respuesta rápida. Escribinos directo.</p>
            <a
              href="https://wa.me/5491176361148"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-accent hover:underline"
            >
              +54 9 11 7636-1148
            </a>
          </div>

          {/* Redes */}
          <div className="rounded-xl border border-surface-light bg-surface/30 p-6">
            <div className="mb-3 text-3xl">📱</div>
            <h2 className="mb-1 text-lg font-bold">Redes Sociales</h2>
            <p className="text-sm text-foreground/60">Seguinos para novedades, sorteos y contenido.</p>
            <div className="mt-3 flex flex-col gap-1">
              <a href="https://instagram.com/modofosa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Instagram
              </a>
              <a href="https://twitter.com/modofosa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                X / Twitter
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-surface-light bg-surface/30 p-6">
          <h2 className="mb-2 text-lg font-bold">Horario de atención</h2>
          <p className="text-foreground/60">
            Respondemos consultas de lunes a viernes de 10:00 a 20:00 (hora Argentina, GMT-3).
            Los fines de semana y feriados podemos demorar un poco más.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-6">
          <h2 className="mb-2 text-lg font-bold text-accent">¿Querés ser streamer destacado?</h2>
          <p className="text-foreground/60">
            Si creás contenido de EA FC y querés aparecer en nuestra sección de Streamers,
            escribinos por cualquiera de los canales de arriba con tu nombre de canal y plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}
