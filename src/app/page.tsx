"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  Coffee,
  UtensilsCrossed,
  Sparkles,
  ConciergeBell,
  LogOut,
  Wifi,
  Wind,
  Tv,
  ShowerHead,
  SquareParking,
  Lock,
  Castle,
  Church,
  Landmark,
  IceCream2,
  ShoppingBag,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

const TRANSITION: Transition = { type: "tween", duration: 0.2, ease: "easeOut" };

const HOTEL = {
  name: "Grand Hotel San Marino",
  addressLine1: "Viale Onofri 31",
  addressLine2: "47890 San Marino",
  phone: "+378 0549 992951",
  phoneHref: "tel:+3780549992951",
};

const SERVICES: { icon: LucideIcon; title: string; hours: string; description: string }[] = [
  {
    icon: Coffee,
    title: "Room Service",
    hours: "7:00 – 23:00",
    description: "Colazione, snack e bevande direttamente in camera, ogni giorno dalle 7:00 alle 23:00.",
  },
  {
    icon: UtensilsCrossed,
    title: "Ristorante L'Arengo",
    hours: "Su prenotazione",
    description: "Cucina internazionale e regionale. Il concierge è a disposizione per prenotare il vostro tavolo.",
  },
  {
    icon: Sparkles,
    title: "Centro Benessere",
    hours: "Su prenotazione",
    description: "Massaggi, trattamenti viso e corpo, jacuzzi panoramica. Prenotazione consigliata in reception.",
  },
  {
    icon: ConciergeBell,
    title: "Concierge",
    hours: "24 ore su 24",
    description: "Informazioni, escursioni e transfer: il nostro staff è a vostra disposizione 24 ore su 24.",
  },
  {
    icon: LogOut,
    title: "Check-out",
    hours: "Entro le 11:00",
    description: "Il check-out è previsto entro le 11:00. Late check-out disponibile su richiesta in reception.",
  },
];

const AMENITIES: { icon: LucideIcon; label: string }[] = [
  { icon: Wifi, label: "Wi-Fi" },
  { icon: Wind, label: "Aria condizionata" },
  { icon: Tv, label: "TV" },
  { icon: ShowerHead, label: "Set di cortesia" },
  { icon: SquareParking, label: "Parcheggio" },
  { icon: Lock, label: "Cassaforte" },
];

const NEARBY: { icon: LucideIcon; name: string; minutes: number }[] = [
  { icon: Castle, name: "Tre Torri", minutes: 5 },
  { icon: Church, name: "Basilica del Santo", minutes: 4 },
  { icon: Landmark, name: "Palazzo Pubblico", minutes: 3 },
  { icon: Coffee, name: "Caffè Titano", minutes: 2 },
  { icon: IceCream2, name: "Gelateria artigianale", minutes: 2 },
  { icon: ShoppingBag, name: "Bottega locale", minutes: 3 },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] lg:text-sm">
      {children}
    </h2>
  );
}

function IconBadge({ icon: Icon, size = 20 }: { icon: LucideIcon; size?: number }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] lg:h-12 lg:w-12">
      <Icon size={size} strokeWidth={1.75} />
    </span>
  );
}

function ReceptionButton() {
  return (
    <a
      href={HOTEL.phoneHref}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-base font-semibold text-[var(--color-on-accent)] transition-[transform,opacity] duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
    >
      <Phone size={18} strokeWidth={1.75} />
      Chiama la Reception
    </a>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [openService, setOpenService] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0a1626" : "#f6f4ef");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg)]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col lg:flex-row lg:gap-6 lg:px-6 lg:py-6 xl:max-w-6xl xl:gap-8 xl:px-8 xl:py-8">
        {/* ── HEADER / SIDEBAR ── */}
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-md lg:top-6 lg:w-64 lg:shrink-0 lg:gap-8 lg:self-start lg:rounded-3xl lg:border lg:bg-[var(--color-surface)] lg:p-6 lg:backdrop-blur-none xl:w-72">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                Benvenuti al
              </p>
              <h1 className="mt-1 flex items-baseline gap-2 leading-none">
                <span className="text-2xl font-extrabold tracking-tight text-[var(--color-text)] lg:text-3xl">
                  Grand Hotel
                </span>
                <span className="font-display text-xl italic text-[var(--color-accent)] lg:text-2xl">
                  San Marino
                </span>
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Cambia tema"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text)] transition-all duration-200 ease-out hover:scale-105 hover:bg-[var(--color-border)] active:scale-90"
            >
              {theme === "light" ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
            </button>
          </div>

          {/* ── Solo sidebar desktop/TV: stato soggiorno + CTA persistente ── */}
          <div className="hidden flex-col gap-4 border-t border-[var(--color-border)] pt-6 lg:flex">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Clock size={16} strokeWidth={1.75} />
              <span>Check-out entro le 11:00</span>
            </div>
            <ReceptionButton />
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 grid grid-cols-1 gap-7 px-5 pb-8 pt-5 md:grid-cols-2 md:gap-5 md:px-6 md:py-6 lg:gap-6 lg:px-0 lg:py-0 xl:gap-8">
          {/* ── COLONNA SINISTRA: camera + servizi ── */}
          <div className="contents md:flex md:flex-col md:gap-5 lg:gap-6 xl:gap-8">
            {/* ── STAY CARD ── */}
            <section className="rounded-3xl bg-[var(--color-accent)] px-5 py-5 text-[var(--color-on-accent)] lg:px-6 lg:py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
                Il vostro soggiorno
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug lg:text-xl">
                Vi diamo il benvenuto: la vostra camera è pronta.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
                <Clock size={16} strokeWidth={1.75} />
                <span>Check-out entro le 11:00</span>
              </div>
            </section>

            {/* ── SERVIZI IN CAMERA ── */}
            <section>
              <SectionLabel>Servizi in camera</SectionLabel>
              <div className="flex flex-col gap-2">
                {SERVICES.map((service) => {
                  const isOpen = openService === service.title;
                  return (
                    <div key={service.title} className="overflow-hidden rounded-2xl bg-[var(--color-surface)]">
                      <button
                        onClick={() => setOpenService(isOpen ? null : service.title)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[var(--color-surface-muted)] lg:px-5 lg:py-4"
                      >
                        <IconBadge icon={service.icon} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-[var(--color-text)] lg:text-lg">
                            {service.title}
                          </span>
                          <span className="block text-sm text-[var(--color-text-secondary)]">
                            {service.hours}
                          </span>
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={TRANSITION}
                          className="shrink-0 text-[var(--color-text-muted)]"
                        >
                          <ChevronDown size={18} strokeWidth={1.75} />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={TRANSITION}
                            className="overflow-hidden"
                          >
                            <p className="px-4 pb-4 pl-[68px] text-sm leading-relaxed text-[var(--color-text-secondary)] lg:px-5 lg:pb-5 lg:pl-20 lg:text-base">
                              {service.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── COLONNA DESTRA: dotazioni, dintorni, informazioni ── */}
          <div className="contents md:flex md:flex-col md:gap-5 lg:gap-6 xl:gap-8">
            {/* ── DOTAZIONI ── */}
            <section>
              <SectionLabel>Dotazioni</SectionLabel>
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                {AMENITIES.map((amenity) => (
                  <div
                    key={amenity.label}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--color-surface)] px-2 py-4 text-center lg:py-5"
                  >
                    <IconBadge icon={amenity.icon} size={18} />
                    <span className="text-xs font-medium leading-tight text-[var(--color-text-secondary)]">
                      {amenity.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── NEI DINTORNI ── */}
            <section>
              <SectionLabel>Nei dintorni</SectionLabel>
              <div className="flex flex-col gap-2 rounded-2xl bg-[var(--color-surface)] px-4 py-1 lg:px-5">
                {NEARBY.map((place, i) => (
                  <div
                    key={place.name}
                    className={`flex items-center gap-3 py-3 ${
                      i !== 0 ? "border-t border-[var(--color-border)]" : ""
                    }`}
                  >
                    <IconBadge icon={place.icon} size={18} />
                    <span className="flex-1 text-sm font-medium text-[var(--color-text)]">{place.name}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{place.minutes} min a piedi</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── INFORMAZIONI ── */}
            <section>
              <SectionLabel>Informazioni</SectionLabel>
              <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
                <div className="flex items-start gap-3">
                  <IconBadge icon={MapPin} size={18} />
                  <div className="flex flex-col justify-center pt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-text)]">{HOTEL.name}</span>
                    <span>{HOTEL.addressLine1}</span>
                    <span>{HOTEL.addressLine2}</span>
                  </div>
                </div>
                <a
                  href={HOTEL.phoneHref}
                  className="flex items-center gap-3 border-t border-[var(--color-border)] pt-3 transition-colors duration-150 hover:text-[var(--color-accent)]"
                >
                  <IconBadge icon={Phone} size={18} />
                  <span className="text-sm font-medium text-[var(--color-text)]">{HOTEL.phone}</span>
                </a>
              </div>
            </section>
          </div>

          <p className="text-center text-xs text-[var(--color-text-muted)] md:col-span-2">
            {HOTEL.name} · © {new Date().getFullYear()}
          </p>
        </main>
      </div>

      {/* ── BOTTOM BAR (mobile/tablet) ── */}
      <div className="sticky bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <ReceptionButton />
      </div>
    </div>
  );
}
