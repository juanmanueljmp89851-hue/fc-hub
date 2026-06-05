import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { AdScripts } from "@/components/ads/AdScripts";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Modo Fosa — Comunidad EA FC Argentina",
    template: "%s | Modo Fosa",
  },
  description:
    "Torneos, ranking, prode del Mundial 2026 y más para la comunidad EA FC hispanohablante.",
  keywords: ["EA FC", "FC 26", "FUT", "fútbol", "Argentina", "torneos", "ranking", "prode", "Mundial 2026"],
  authors: [{ name: "Modo Fosa" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Modo Fosa",
    title: "Modo Fosa — Comunidad EA FC Argentina",
    description: "Stats, mercado y fútbol. Donde vive el meta.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Modo Fosa — Comunidad EA FC Argentina" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modo Fosa — Comunidad EA FC Argentina",
    description: "Stats, mercado y fútbol. Donde vive el meta.",
    images: ["/api/og"],
  },
  metadataBase: new URL("https://www.modofosa.com.ar"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light')}catch(e){}})()`,
          }}
        />
        <meta name="google-adsense-account" content="ca-pub-1298419664713208" />
        <meta name="theme-color" content="#00ff87" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.modofosa.com.ar/#website",
                  url: "https://www.modofosa.com.ar",
                  name: "Modo Fosa",
                  description: "La comunidad de EA FC Argentina. Stats, mercado y fútbol.",
                  inLanguage: "es-AR",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://www.modofosa.com.ar/jugadores?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.modofosa.com.ar/#organization",
                  name: "Modo Fosa",
                  url: "https://www.modofosa.com.ar",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.modofosa.com.ar/api/og",
                    width: 1200,
                    height: 630,
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans bg-background text-foreground antialiased flex min-h-screen flex-col`}
      >
        <AdScripts />
        <AuthProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
