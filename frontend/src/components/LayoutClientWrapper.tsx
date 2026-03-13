// src/components/LayoutClientWrapper.tsx
'use client'

import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/Toast";
import { SplashScreen } from "@/components/SplashScreen";
import { AutoShareListener } from "@/components/AutoShareListener";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ChallengesFAB } from "@/components/ChallengesFAB";
import { FeedbackModal } from "@/components/FeedbackModal";

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
    return (
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
                        <ServiceWorkerRegistration />
                        <FeedbackModal />
                        <div>
                            <ChallengesFAB />
                        </div>
                    </ToastProvider>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
