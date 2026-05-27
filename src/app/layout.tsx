import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Modo Fosa — Comunidad EA FC Argentina",
  description:
    "Torneos, ranking, prode del Mundial 2026 y más para la comunidad EA FC hispanohablante.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} font-sans bg-background text-foreground antialiased flex min-h-screen flex-col`}
      >
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
