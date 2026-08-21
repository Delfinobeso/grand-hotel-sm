import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import SwRegister from "@/components/SwRegister";
// PROVA (branch prova/pwa-install-libreria): l'interruttore sceglie fra il
// nostro onboarding e quello della libreria, con ?install=nuovo|nostro.
import InstallOnboardingProva from "@/components/InstallOnboardingProva";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f4f1ea",
};

export const metadata: Metadata = {
  title: "Grand Hotel San Marino",
  description:
    "La vostra guida al soggiorno al Grand Hotel San Marino: servizi, orari, ristorante, benessere e cosa vedere a San Marino.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/apple-icon-180.png" },
  appleWebApp: { capable: true, title: "Grand Hotel SM", statusBarStyle: "black-translucent" },
};

// Apply persisted theme before paint to avoid a flash; only sets <html data-theme>.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}var l=localStorage.getItem('lang');if(l&&['en','fr','de','es'].indexOf(l)!==-1){document.documentElement.lang=l;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-icon-180.png" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AnalyticsProvider project="grand-hotel-sm" />
        <SwRegister />
        <InstallOnboardingProva
          appName="Grand Hotel SM"
          stepImages={[
            "/onboarding/step-1-share.png",
            "/onboarding/step-2-more.png",
            "/onboarding/step-3-addhome.png",
            "/onboarding/step-4-confirm.png",
          ]}
        />
        {children}
      </body>
    </html>
  );
}
