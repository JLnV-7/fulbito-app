import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/Toast";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingModal } from "@/components/OnboardingModal";
import { XPFeedback } from "@/components/XPFeedback";
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
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
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
          <AuthProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
              <InstallPrompt />
              <OnboardingModal />
              <XPFeedback />
              <ServiceWorkerRegistration />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
