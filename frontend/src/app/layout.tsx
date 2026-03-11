import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LayoutClientWrapper } from "@/components/LayoutClientWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FutLog - Tu Letterboxd del Fútbol ⚽",
    template: "%s | FutLog"
  },
  description: "Puntuá partidos, logueá tu experiencia, votá figuras, competí en el prode y compartí reseñas con la comunidad.",
  manifest: "/manifest.json",
  openGraph: {
    title: "FutLog - Tu Letterboxd del Fútbol ⚽",
    description: "Puntuá partidos, logueá tu experiencia, votá figuras y compartí reseñas.",
    type: "website",
    locale: "es_AR",
    siteName: "FutLog",
  },
  twitter: {
    card: "summary_large_image",
    title: "FutLog - Tu Letterboxd del Fútbol",
    description: "Puntuá partidos, logueá tu experiencia, votá figuras y compartí reseñas.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FutLog",
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F5F5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="antialiased"
      >
        <LayoutClientWrapper>
          {children}
          <footer className="text-center py-6 text-[var(--text-muted)] text-sm pb-28 md:pb-8 border-t border-[var(--card-border)] mt-8 bg-[var(--background)]">
            <div className="flex justify-center flex-wrap gap-4 font-bold">
              <Link href="/privacy" className="hover:text-[var(--accent)] hover:underline transition-colors">Privacidad</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-[var(--accent)] hover:underline transition-colors">Términos</Link>
              <span>•</span>
              <Link href="/sources" className="hover:text-[var(--accent)] hover:underline transition-colors">Fuentes de datos</Link>
            </div>
            <p className="text-[10px] mt-4 opacity-50">FutLog Beta © {new Date().getFullYear()}</p>
          </footer>
        </LayoutClientWrapper>
      </body>
    </html>
  );
}
