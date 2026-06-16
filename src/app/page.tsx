"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  Clock,
  Sun,
  Moon,
  Languages,
  Home as HomeIcon,
  LayoutGrid,
  MapPin as MapIcon,
  Info as InfoIcon,
  type LucideIcon,
} from "lucide-react";
import { content, type Lang, type HotelContent } from "@/lib/content";
import { HOTEL } from "@/lib/hotel";
import { HomeSection } from "@/components/sections/HomeSection";
import { DirectorySection, type ServiceId } from "@/components/sections/DirectorySection";
import { InfoSection } from "@/components/sections/InfoSection";
import { AboutSection } from "@/components/sections/AboutSection";
import ChatAssistant from "@/components/ChatAssistant";

type TabKey = "home" | "services" | "map" | "info";

const TABS: { key: TabKey; icon: LucideIcon }[] = [
  { key: "home",     icon: HomeIcon },
  { key: "services", icon: LayoutGrid },
  { key: "map",      icon: MapIcon },
  { key: "info",     icon: InfoIcon },
];

function ReceptionButton({ t }: { t: HotelContent }) {
  return (
    <a
      href={HOTEL.phoneHref}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-base font-semibold text-[var(--color-on-accent)] transition-[transform,opacity] duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
    >
      <Phone size={18} strokeWidth={1.75} />
      {t.common.receptionCta}
    </a>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<Lang>("it");
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [serviceView, setServiceView] = useState<ServiceId | null>(null);
  const [navFromHome, setNavFromHome] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // One-time sync from localStorage after mount: the inline THEME_SCRIPT in layout.tsx
  // already applied data-theme/lang to <html> before paint, so this only updates the
  // React-rendered controls (icon, language code) — a lazy useState initializer would
  // mismatch the SSR markup for those elements and trigger a hydration error instead.
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const initialTheme = storedTheme === "dark" ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

    const storedLang = localStorage.getItem("lang");
    const initialLang: Lang = storedLang === "en" ? "en" : "it";
    setLang(initialLang);
    document.documentElement.lang = initialLang;
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#111110" : "#f6f4ef");
  };

  const toggleLang = () => {
    const next: Lang = lang === "it" ? "en" : "it";
    setLang(next);
    document.documentElement.lang = next;
    localStorage.setItem("lang", next);
  };

  const t = content[lang];

  const navLabels: Record<TabKey, string> = {
    home:     t.nav.home,
    services: t.nav.services,
    map:      t.nav.map,
    info:     t.nav.info,
  };

  const handleNavigateFromHome = (tab: "services" | "map" | "info", service?: ServiceId) => {
    setActiveTab(tab);
    if (service !== undefined) {
      setServiceView(service);
      setNavFromHome(true);
    }
  };

  const handleSubViewChange = (v: ServiceId | null) => {
    if (v === null && navFromHome) {
      // back dal servizio → torna alla Home
      setActiveTab("home");
      setNavFromHome(false);
    }
    setServiceView(v);
  };

  const sections: Record<TabKey, React.ReactNode> = {
    home:     <HomeSection t={t} onNavigate={handleNavigateFromHome} onOpenChat={() => setChatOpen(true)} />,
    services: <DirectorySection t={t} subView={serviceView} onSubViewChange={handleSubViewChange} />,
    map:      <InfoSection t={t} />,
    info:     <AboutSection t={t} />,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg)]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col lg:flex-row lg:gap-6 lg:px-6 lg:py-6 xl:max-w-6xl xl:gap-8 xl:px-8 xl:py-8">
        {/* ── HEADER / SIDEBAR ── */}
        <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md lg:top-6 lg:w-64 lg:shrink-0 lg:gap-6 lg:self-start lg:rounded-3xl lg:border lg:bg-[var(--color-surface)] lg:p-6 lg:backdrop-blur-none xl:w-72">
          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start lg:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">{t.home.eyebrow}</p>
              <h1 className="mt-0.5 text-lg font-extrabold leading-tight tracking-tight text-[var(--color-text)] lg:text-3xl">
                {t.home.titleMain}{" "}
                <span className="font-display italic text-[var(--color-accent)] lg:text-2xl">
                  {t.home.titleAccent}
                </span>
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 lg:w-full lg:justify-between">
              <button
                onClick={toggleLang}
                aria-label={t.common.languageLabel}
                className="flex h-9 items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text)] transition-all duration-200 ease-out hover:bg-[var(--color-border)] active:scale-90 lg:flex-1 lg:justify-center lg:h-11 lg:px-3 lg:text-xs"
              >
                <Languages size={14} strokeWidth={1.75} />
                {lang}
              </button>
              <button
                onClick={toggleTheme}
                aria-label="Cambia tema"
                className="flex h-9 items-center justify-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2.5 text-[11px] font-medium text-[var(--color-text)] transition-all duration-200 ease-out hover:bg-[var(--color-border)] active:scale-90 lg:flex-1 lg:h-11 lg:px-3"
              >
                {theme === "light" ? <Moon size={14} strokeWidth={1.75} /> : <Sun size={14} strokeWidth={1.75} />}
                <span className="sm:hidden">{theme === "light" ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          {/* ── Nav desktop ── */}
          <nav className="hidden flex-col gap-1 lg:flex">
            {TABS.map(({ key, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); if (key !== "services") setNavFromHome(false); else { setNavFromHome(false); setServiceView(null); } }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {navLabels[key]}
                </button>
              );
            })}
          </nav>

          {/* ── Solo sidebar desktop/TV: stato soggiorno + CTA persistente ── */}
          <div className="hidden flex-col gap-4 border-t border-[var(--color-border)] pt-6 lg:flex">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Clock size={16} strokeWidth={1.75} />
              <span>
                {t.home.checkOut.label}: {t.home.checkOut.value}
              </span>
            </div>
            <ReceptionButton t={t} />
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:py-6 lg:px-0 lg:pt-6 lg:pb-0">
          {sections[activeTab]}
          <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
            {t.footer} · © {new Date().getFullYear()}
          </p>
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile/tablet) ── */}
      <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        {TABS.map(({ key, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); if (key !== "services") setNavFromHome(false); else { setNavFromHome(false); setServiceView(null); } }}
              aria-current={active}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors duration-150 ${
                active ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              {navLabels[key]}
            </button>
          );
        })}
      </nav>

      <ChatAssistant lang={lang} open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
