import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}var l=localStorage.getItem('lang');if(l==='en'){document.documentElement.lang='en';}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-icon-180.png" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
