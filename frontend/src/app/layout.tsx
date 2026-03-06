import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b6b",
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
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
                <InstallPrompt />
                <OnboardingModal />
                <XPFeedback />
                <FeedbackWidget />
                <ServiceWorkerRegistration />
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
