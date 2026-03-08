import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/Toast";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingModal } from "@/components/OnboardingModal";
import { XPFeedback } from "@/components/XPFeedback";
import { SplashScreen } from "@/components/SplashScreen";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { AutoShareListener } from "@/components/AutoShareListener";
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
  title: "FutLog - Tu Letterboxd del Fútbol ⚽",
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
    card: "summary",
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
  themeColor: "#10b981",
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
    <html lang="es" suppressHydrationWarning data-theme="dark">
      <head>
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <SplashScreen />
                {children}
                <ToastContainer />
                <AutoShareListener />
                <InstallPrompt />
                <OnboardingModal />
                <XPFeedback />
                <FeedbackWidget />
                <ServiceWorkerRegistration />
                <footer className="text-center py-6 text-[var(--text-muted)] text-sm pb-28 md:pb-8 border-t border-[var(--card-border)] mt-8 bg-[var(--background)]">
                  <div className="flex justify-center flex-wrap gap-4 font-bold">
                    <Link href="/privacy" className="hover:text-[#10b981] hover:underline transition-colors">Privacidad</Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-[#10b981] hover:underline transition-colors">Términos</Link>
                    <span>•</span>
                    <Link href="/sources" className="hover:text-[#10b981] hover:underline transition-colors">Fuentes de datos</Link>
                  </div>
                  <p className="text-[10px] mt-4 opacity-50">FutLog Beta © {new Date().getFullYear()}</p>
                </footer>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
