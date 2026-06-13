"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MapPin, UtensilsCrossed, Sparkles, Bed, Clock, ChevronRight,
  Coffee, MessageCircle, LogOut, Wifi, Wind, Tv, Bath, Car, ShieldCheck
} from "lucide-react";

const HOTEL = {
  name: "Grand Hotel San Marino",
  address: "Viale Antonio Onofri, 31 — 47890 San Marino",
  phone: "+378 0549 992951",
  email: "info@grandhotel.sm",
  web: "https://www.grandhotel.sm",
  reception: "9",
  coords: { lat: 43.9367, lng: 12.4465 },
};

const SERVICES = [
  {
    id: "roomservice",
    icon: Coffee,
    title: "Room Service",
    desc: "Colazione in camera, snack e bevande. Disponibile 7:00—23:00. Componi il 9 dalla tua camera.",
    action: { label: "Chiama", href: "tel:+3780549992951", icon: Phone },
    color: "#c9956b",
  },
  {
    id: "restaurant",
    icon: UtensilsCrossed,
    title: "Ristorante L'Arengo",
    desc: "Cucina internazionale e regionale. Aperto a pranzo e cena. Prenota il tuo tavolo o richiedi un menu personalizzato.",
    action: { label: "Prenota tavolo", href: "tel:+3780549992951", icon: Phone },
    color: "#c9956b",
  },
  {
    id: "spa",
    icon: Sparkles,
    title: "Centro Benessere",
    desc: "Massaggi con pietre calde, trattamenti viso, body wrap. Terrazza con jacuzzi panoramica. Prenota il tuo trattamento.",
    action: { label: "Prenota trattamento", href: "tel:+3780549992951", icon: Phone },
    color: "#7eb8a0",
  },
  {
    id: "concierge",
    icon: MessageCircle,
    title: "Concierge",
    desc: "Transfer aeroporto, prenotazione escursioni, consigli su ristoranti e attrazioni. Siamo a tua disposizione 24/7.",
    action: { label: "Contatta concierge", href: "tel:+3780549992951", icon: Phone },
    color: "#6b9ec9",
  },
  {
    id: "checkout",
    icon: LogOut,
    title: "Check-out",
    desc: "Check-out entro le 11:00. Late check-out su richiesta. Possiamo custodire i bagagli dopo il check-out.",
    action: { label: "Reception", href: "tel:+3780549992951", icon: Phone },
    color: "#8a8a8a",
  },
];

const AMENITIES = [
  { icon: Wifi, label: "Wi-Fi gratuito" },
  { icon: Wind, label: "Aria condizionata" },
  { icon: Tv, label: "TV schermo piatto" },
  { icon: Bath, label: "Set cortesia" },
  { icon: Car, label: "Parcheggio" },
  { icon: ShieldCheck, label: "Cassaforte" },
];

const NEARBY = [
  { name: "Tre Torri", icon: "🏰", walk: "5 min" },
  { name: "Basilica del Santo", icon: "⛪", walk: "4 min" },
  { name: "Palazzo Pubblico", icon: "🏛️", walk: "3 min" },
  { name: "Caffè Titano", icon: "☕", walk: "2 min" },
  { name: "Gelateria", icon: "🍦", walk: "2 min" },
  { name: "Bottega locale", icon: "🧀", walk: "3 min" },
];

export default function Home() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#0a1628" : "#f6f4ef");
  };

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--color-surface)]" style={{ paddingTop: "calc(var(--sat) + 4px)" }}>
      {/* ── Header ── */}
      <header className="shrink-0 px-5 pt-3 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--color-accent)] uppercase tracking-[0.15em] mb-0.5">
              Benvenuto al
            </p>
            <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
              Grand Hotel
            </h1>
            <p className="text-[15px] font-semibold text-[var(--color-accent)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              San Marino
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="touch-target w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] active:scale-90 transition-transform"
            aria-label="Cambia tema"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      {/* ── Room Status Card ── */}
      <div className="shrink-0 mx-4 mb-4">
        <div className="bg-[var(--color-accent)] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Bed size={18} />
            <span className="text-[14px] font-semibold">Camera 304 — Superior</span>
          </div>
          <p className="text-[12px] text-white/70">Check-out: oggi entro le 11:00</p>
          <div className="flex gap-2 mt-4">
            <a
              href={`tel:${HOTEL.phone}`}
              className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3.5 py-2 text-[12px] font-semibold active:bg-white/25 transition-colors"
            >
              <Phone size={13} />
              Reception
            </a>
            <a
              href={`tel:${HOTEL.phone}`}
              className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3.5 py-2 text-[12px] font-semibold active:bg-white/25 transition-colors"
            >
              <MessageCircle size={13} />
              Concierge
            </a>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className="shrink-0 px-4 mb-3">
        <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.1em] mb-2 px-1">
          Servizi in camera
        </p>
      </div>

      <div className="flex-1 overflow-y-auto gpu-scroll px-4" style={{ paddingBottom: "calc(80px + var(--sab))" }}>
        <div className="flex flex-col gap-2 pb-4">
          <AnimatePresence initial={false}>
            {SERVICES.map((srv) => {
              const isOpen = expanded === srv.id;
              return (
                <motion.div
                  key={srv.id}
                  layout
                  className="bg-[var(--color-surface-secondary)] rounded-2xl overflow-hidden"
                  transition={{ type: "tween", duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <button
                    onClick={() => toggle(srv.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.03] transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: srv.color + "18" }}
                    >
                      <srv.icon size={17} style={{ color: srv.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-semibold text-[var(--color-text-primary)] block">
                        {srv.title}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-tertiary)] block truncate">
                        {srv.desc.split(".")[0]}.
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ type: "tween", duration: 0.2 }}
                    >
                      <ChevronRight size={16} className="text-[var(--color-text-tertiary)]" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "tween", duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] mb-3">
                            {srv.desc}
                          </p>
                          <a
                            href={srv.action.href}
                            className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold active:scale-95 transition-transform"
                          >
                            <srv.action.icon size={14} />
                            {srv.action.label}
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── Amenities ── */}
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.1em] mb-3 px-1">
              Dotazioni camera
            </p>
            <div className="grid grid-cols-3 gap-2">
              {AMENITIES.map((a) => (
                <div
                  key={a.label}
                  className="bg-[var(--color-surface-secondary)] rounded-xl p-3 text-center"
                >
                  <a.icon size={18} className="text-[var(--color-accent)] mx-auto mb-1.5" />
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Nearby ── */}
          <div className="mt-1">
            <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.1em] mb-3 px-1">
              Nei dintorni
            </p>
            <div className="bg-[var(--color-surface-secondary)] rounded-2xl divide-y divide-[var(--color-divider)]">
              {NEARBY.map((place, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{place.icon}</span>
                  <span className="flex-1 text-[13px] font-medium text-[var(--color-text-primary)]">{place.name}</span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                    <Clock size={11} />
                    {place.walk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Info ── */}
          <div className="mt-3 bg-[var(--color-surface-secondary)] rounded-2xl p-4">
            <div className="space-y-2.5 text-[13px] text-[var(--color-text-secondary)]">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                <span>{HOTEL.address}</span>
              </div>
              <a href={`tel:${HOTEL.phone}`} className="flex items-center gap-2 text-[var(--color-accent)] font-medium">
                <Phone size={14} />
                {HOTEL.phone}
              </a>
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-text-tertiary)] text-center py-4">
            Grand Hotel San Marino © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-2 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-divider)]"
        style={{ paddingBottom: "max(8px, var(--sab))" }}
      >
        <a
          href={`tel:${HOTEL.phone}`}
          className="w-full touch-target bg-[var(--color-accent)] text-white rounded-2xl font-bold text-[15px] active:scale-[0.97] transition-transform flex items-center justify-center py-2.5 gap-2"
        >
          <Phone size={16} />
          Chiama Reception
        </a>
      </div>
    </div>
  );
}
