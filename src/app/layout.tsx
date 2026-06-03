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
    images: [{ url: "/logo.svg", width: 512, height: 512, alt: "Modo Fosa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modo Fosa — Comunidad EA FC Argentina",
    description: "Stats, mercado y fútbol. Donde vive el meta.",
    images: ["/logo.svg"],
  },
  metadataBase: new URL("https://www.modofosa.com.ar"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
