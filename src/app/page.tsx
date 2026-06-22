"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Sun,
  Moon,
  Home as HomeIcon,
  BedDouble,
  UtensilsCrossed,
  Flower2,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";
import { content, type Lang } from "@/lib/content";
import { HOTEL } from "@/lib/hotel";
import type { TabKey } from "@/lib/nav";
import { OggiSection } from "@/components/sections/OggiSection";
import { HotelSection } from "@/components/sections/HotelSection";
import { DiningSection } from "@/components/sections/DiningSection";
import { WellnessSection } from "@/components/sections/WellnessSection";
import { ExploreSection } from "@/components/sections/ExploreSection";
import ChatAssistant from "@/components/ChatAssistant";

const TABS: { key: TabKey; icon: LucideIcon }[] = [
  { key: "oggi", icon: HomeIcon },
  { key: "hotel", icon: BedDouble },
  { key: "dining", icon: UtensilsCrossed },
  { key: "wellness", icon: Flower2 },
  { key: "explore", icon: MapIcon },
];

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<Lang>("it");
  const [activeTab, setActiveTab] = useState<TabKey>("oggi");
  const [chatOpen, setChatOpen] = useState(false);

  // One-time sync from localStorage after mount. The inline THEME_SCRIPT in layout.tsx
  // already set data-theme/lang on <html> pre-paint; this only updates React-rendered
  // controls (theme icon, lang code) so SSR markup matches and hydration stays clean.
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const initialTheme = storedTheme === "dark" ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", initialTheme === "dark" ? "#1d1c1a" : "#f4f1ea");

    const storedLang = localStorage.getItem("lang");
    setLang(storedLang === "en" ? "en" : "it");
  }, []);

  // Scroll to top when switching pillar.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#1d1c1a" : "#f4f1ea");
  };

  const toggleLang = () => {
    const next: Lang = lang === "it" ? "en" : "it";
    setLang(next);
    document.documentElement.lang = next;
    localStorage.setItem("lang", next);
  };

  const t = content[lang];

  const navLabels: Record<TabKey, string> = {
    oggi: t.nav.oggi,
    hotel: t.nav.hotel,
    dining: t.nav.dining,
    wellness: t.nav.wellness,
    explore: t.nav.explore,
  };

  const sections: Record<TabKey, React.ReactNode> = {
    oggi: <OggiSection t={t} onOpenChat={() => setChatOpen(true)} onNavigate={setActiveTab} />,
    hotel: <HotelSection t={t} />,
    dining: <DiningSection t={t} />,
    wellness: <WellnessSection t={t} />,
    explore: <ExploreSection t={t} />,
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden lg:flex-row lg:gap-6 lg:px-6 lg:py-6 xl:max-w-6xl xl:gap-8 xl:px-8 xl:py-8">
        {/* ── HEADER / SIDEBAR ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md lg:top-6 lg:w-64 lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-6 lg:self-start lg:rounded-3xl lg:border lg:bg-[var(--color-surface-2)] lg:p-6 lg:backdrop-blur-none xl:w-72">
          {/* Logo */}
          <div className="min-w-0 lg:flex lg:justify-center">
            <h1 className="sr-only">
              {t.home.titleMain} {t.home.titleAccent}
            </h1>
            <img
              src="/brand/logo-full.svg"
              alt="Grand Hotel San Marino"
              className="logo-light h-14 w-auto lg:h-auto lg:w-40"
            />
            <img
              src="/brand/logo-full-dark.svg"
              alt=""
              aria-hidden
              className="logo-dark h-14 w-auto lg:h-auto lg:w-40"
            />
          </div>

          {/* Toggles */}
          <div className="flex shrink-0 items-center gap-1.5 lg:order-last lg:mt-auto lg:w-full">
            <button
              onClick={toggleLang}
              aria-label={t.common.languageLabel}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-border)] lg:h-10 lg:flex-1 lg:justify-center"
            >
              {lang === "it" ? "EN" : "IT"}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Theme"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-border)] lg:h-10 lg:w-auto lg:flex-1"
            >
              {theme === "light" ? <Moon size={16} strokeWidth={1.875} /> : <Sun size={16} strokeWidth={1.875} />}
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden flex-col gap-1 lg:flex">
            {TABS.map(({ key, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors duration-200 ${
                    active
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.25 : 1.75} />
                  {navLabels[key]}
                </button>
              );
            })}
          </nav>

          {/* Desktop persistent reception CTA */}
          <a
            href={HOTEL.phoneHref}
            className="hidden h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] text-[0.95rem] font-semibold text-[var(--color-on-accent)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.98] lg:flex"
          >
            <Phone size={17} strokeWidth={1.875} />
            {t.common.receptionCta}
          </a>
        </header>

        {/* ── CONTENT ── */}
        {activeTab === "explore" ? (
          <main className="min-h-0 flex-1 overflow-hidden">{sections.explore}</main>
        ) : (
          <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:py-6 lg:px-0 lg:pt-2 lg:pb-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {sections[activeTab]}
            </motion.div>
            <p className="mt-10 text-center text-xs text-[var(--color-text-muted)]">
              {t.footer} · © {new Date().getFullYear()}
            </p>
          </main>
        )}
      </div>

      {/* ── FLOATING DOCK (mobile/tablet) ──
          Inset from the edges; corner radius is concentric with the iPhone screen
          radius (--screen-radius − inset) so the dock nests inside the display corners. */}
      <nav
        className="fixed inset-x-[var(--dock-inset)] bottom-[max(var(--dock-inset),env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-stretch gap-0.5 border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-1.5 shadow-[0_12px_36px_oklch(0.2_0.04_258/0.24)] backdrop-blur-xl lg:hidden"
        style={{ borderRadius: "calc(var(--screen-radius) - var(--dock-inset))" }}
      >
        {TABS.map(({ key, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[1.4rem] py-2 text-[0.625rem] font-medium leading-none transition-colors duration-200 ${
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] active:bg-[var(--color-surface-muted)]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              <span className="max-w-full truncate px-0.5">{navLabels[key]}</span>
            </button>
          );
        })}
      </nav>

      <ChatAssistant lang={lang} open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
