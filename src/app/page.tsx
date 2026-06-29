"use client";

import { useEffect, useRef, useState } from "react";
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

/** Detect keyboard open on iOS via visualViewport. */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => {
      setOpen(vv.height < window.innerHeight - 60);
    };
    check();
    vv.addEventListener("resize", check);
    vv.addEventListener("scroll", check);
    return () => {
      vv.removeEventListener("resize", check);
      vv.removeEventListener("scroll", check);
    };
  }, []);
  return open;
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<Lang>("it");
  const [activeTab, setActiveTab] = useState<TabKey>("oggi");
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const keyboardOpen = useKeyboardOpen();
  const mainRef = useRef<HTMLElement>(null);

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

  // Scroll to top (or to a section) when switching pillar.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (pendingSection) {
      // Wait one frame for the new tab's DOM to paint, then scroll to target.
      requestAnimationFrame(() => {
        const target = el.querySelector<HTMLElement>(`#${pendingSection}`);
        if (target) {
          el.scrollTo({ top: target.offsetTop - 16, behavior: "smooth" });
        }
        setPendingSection(null);
      });
    } else {
      el.scrollTop = 0;
    }
  }, [activeTab, pendingSection]);

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

  const navigateTo = (tab: TabKey, sectionId?: string) => {
    if (sectionId) setPendingSection(sectionId);
    setActiveTab(tab);
  };

  const sections: Record<TabKey, React.ReactNode> = {
    oggi: <OggiSection t={t} onOpenChat={() => setChatOpen(true)} onNavigate={navigateTo} />,
    hotel: <HotelSection t={t} />,
    dining: <DiningSection t={t} />,
    wellness: <WellnessSection t={t} />,
    explore: <ExploreSection t={t} />,
  };

  // Home and map are visual surfaces: header floats over them (controls only, no logo/bg).
  const visualHeader = activeTab === "oggi" || activeTab === "explore";

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden lg:flex-row lg:gap-6 lg:px-6 lg:py-6 xl:max-w-6xl xl:gap-8 xl:px-8 xl:py-8">
        {/* ── HEADER / SIDEBAR ── on the map it floats over the full-bleed map with a gradient (no hard line) */}
        <header
          className={`z-20 flex items-center justify-between gap-3 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:sticky lg:top-6 lg:w-64 lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-6 lg:self-start lg:rounded-3xl lg:border lg:border-[var(--color-border)] lg:bg-[var(--color-surface-2)] lg:bg-none lg:p-6 lg:pb-6 lg:backdrop-blur-none xl:w-72 ${
            visualHeader
              ? "pointer-events-none absolute inset-x-0 top-0"
              : "sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-md"
          }`}
        >
          {/* Logo (hidden on the visual surfaces where the hero/map carries the brand) */}
          <div className={`min-w-0 lg:flex lg:justify-center ${visualHeader ? "hidden lg:flex" : ""}`}>
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
          <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-1.5 lg:order-last lg:ml-0 lg:mt-auto lg:w-full">
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
          <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:py-6 lg:px-0 lg:pt-2 lg:pb-0">
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
            <p className="mt-1.5 text-center text-xs text-[var(--color-text-muted)]">
              {t.poweredBy}{" "}
              <a
                href="https://blasat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
              >
                Blasat
              </a>
            </p>
            <p className="mt-2.5 text-center">
              <a
                href="/feedback"
                className="text-xs text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-text-secondary)] transition-colors duration-150"
              >
                {t.feedback}
              </a>
            </p>
          </main>
        )}
      </div>

      {/* ── FLOATING DOCK (mobile/tablet) ──
          Equal gap on all sides (--dock-inset) so the pill sits parallel to the
          iPhone screen edges; corner radius is concentric (screen radius − gap)
          so its corners nest inside the screen's rounded corners. The gap alone
          clears the home indicator — we do NOT add env(safe-area-inset-bottom),
          which is what made the bottom margin far larger than the sides. When the
          keyboard opens, the dock slides out of the way. */}
      <nav
        aria-label="Primary"
        className={`fixed left-[var(--dock-inset)] right-[var(--dock-inset)] bottom-[var(--dock-inset)] z-30 mx-auto flex max-w-sm items-stretch gap-1 bg-[var(--color-surface)]/80 p-2 shadow-[0_10px_34px_oklch(0.2_0.04_258/0.30)] ring-1 ring-[var(--color-border)] backdrop-blur-xl transition-[transform,opacity] duration-300 lg:hidden ${
          keyboardOpen ? "pointer-events-none translate-y-[160%] opacity-0" : "translate-y-0 opacity-100"
        }`}
        style={{ borderRadius: "calc(var(--screen-radius) - var(--dock-inset))" }}
      >
        {TABS.map(({ key, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-current={active ? "page" : undefined}
              aria-label={navLabels[key]}
              className={`flex items-center justify-center gap-2 rounded-full py-3.5 leading-none transition-colors duration-300 ${
                active
                  ? "flex-none bg-[var(--color-accent-soft)] px-4 text-[0.8125rem] font-semibold text-[var(--color-accent)]"
                  : "flex-1 px-2 text-[var(--color-text-muted)] active:bg-[var(--color-surface-muted)]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} className="shrink-0" />
              {active && <span className="truncate">{navLabels[key]}</span>}
            </button>
          );
        })}
      </nav>

      <ChatAssistant lang={lang} open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
