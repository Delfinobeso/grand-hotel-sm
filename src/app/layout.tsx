import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import SwRegister from "@/components/SwRegister";
import InstallOnboarding from "@/components/InstallOnboarding";

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
        <InstallOnboarding
          appName="Grand Hotel SM"
          // Colori presi dall'icona vera dell'hotel. `accentButton` e' lo stesso
          // tono appena piu' scuro: serve solo al pulsante, dove il testo bianco
          // sul colore pieno non arrivava a 4,5:1.
          accent="#0a2444"
          accentButton="#0a2444"
        />
        {children}
      </body>
    </html>
  );
}
