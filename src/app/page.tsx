"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MapPin, ChevronRight, Bed, Clock, Coffee,
  UtensilsCrossed, Sparkles, MessageCircle, LogOut, Wifi,
} from "lucide-react";

const HOTEL = {
  name: "Grand Hotel San Marino",
  address: "Viale Antonio Onofri, 31\n47890 San Marino",
  phone: "+378 0549 992951",
};

const SERVICES = [
  { icon: Coffee, label: "Room Service", desc: "Colazione, snack e bevande in camera. 7:00–23:00." },
  { icon: UtensilsCrossed, label: "Ristorante L'Arengo", desc: "Cucina internazionale e regionale. Prenota un tavolo." },
  { icon: Sparkles, label: "Centro Benessere", desc: "Massaggi, trattamenti viso, jacuzzi panoramica." },
  { icon: MessageCircle, label: "Concierge", desc: "Transfer, escursioni, informazioni. 24/7." },
  { icon: LogOut, label: "Check-out", desc: "Entro le 11:00. Late check-out su richiesta." },
];

const AMENITIES = ["Wi-Fi gratuito", "Aria condizionata", "TV schermo piatto", "Set cortesia", "Parcheggio", "Cassaforte"];

const NEARBY = [
  { name: "Tre Torri", icon: "🏰", min: 5 },
  { name: "Basilica del Santo", icon: "⛪", min: 4 },
  { name: "Palazzo Pubblico", icon: "🏛️", min: 3 },
  { name: "Caffè Titano", icon: "☕", min: 2 },
  { name: "Gelateria artigianale", icon: "🍦", min: 2 },
  { name: "Bottega locale", icon: "🧀", min: 3 },
];

export default function Home() {
  const [open, setOpen] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const n = theme === "light" ? "dark" : "light";
    setTheme(n);
    document.documentElement.setAttribute("data-theme", n);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--color-surface)]"
      style={{ paddingTop: "calc(var(--sat) + 4px)" }}
    >
      {/* ── HEADER ── */}
      <header className="shrink-0 px-5 pt-1 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[var(--color-accent)] uppercase tracking-widest">
            Benvenuto al
          </p>
          <h1 className="text-[22px] font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight mt-0.5">
            Grand Hotel
          </h1>
          <p className="text-[14px] font-medium text-[var(--color-accent)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            San Marino
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="touch-target w-11 h-11 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] text-lg active:scale-90 transition-transform"
        >
          {theme === "light" ? "☀️" : "🌙"}
        </button>
      </header>

      {/* ── ROOM CARD ── */}
      <div className="shrink-0 px-4 pb-4">
        <div className="bg-[var(--color-accent)] rounded-2xl px-5 py-4 text-white">
          <p className="text-[11px] text-white/60 uppercase tracking-widest font-semibold">La tua camera</p>
          <div className="flex items-center gap-2 mt-1">
            <Bed size={18} className="text-white/80" />
            <span className="text-[16px] font-bold">Superior · 304</span>
          </div>
          <p className="text-[12px] text-white/60 mt-2">Check-out oggi entro le 11:00</p>
        </div>
      </div>

      {/* ── SECTION LABEL ── */}
      <div className="shrink-0 px-5 pb-2">
        <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest">
          Servizi
        </p>
      </div>

      {/* ── SERVICES ── */}
      <div className="flex-1 overflow-y-auto gpu-scroll px-4" style={{ paddingBottom: "calc(80px + var(--sab))" }}>
        <div className="flex flex-col gap-1.5 pb-4">
          {SERVICES.map((srv) => {
            const isOpen = open === srv.label;
            return (
              <motion.div
                key={srv.label}
                layout
                className="bg-[var(--color-surface-secondary)] rounded-2xl overflow-hidden"
                transition={{ type: "tween", duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : srv.label)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.03] transition-colors"
                >
                  <srv.icon size={18} className="text-[var(--color-accent)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {srv.label}
                    </span>
                    {!isOpen && (
                      <p className="text-[12px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                        {srv.desc}
                      </p>
                    )}
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={15} className="text-[var(--color-text-tertiary)]" />
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
                      <div className="px-4 pb-4 pt-1">
                        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] mb-3">
                          {srv.desc}
                        </p>
                        <a
                          href={`tel:${HOTEL.phone}`}
                          className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white font-semibold rounded-xl px-4 py-2.5 text-[13px] active:scale-95 transition-transform"
                        >
                          <Phone size={13} />
                          Chiama
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── AMENITIES ── */}
        <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 px-1">
          Dotazioni
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {AMENITIES.map((a) => (
            <div key={a} className="bg-[var(--color-surface-secondary)] rounded-xl px-3 py-3 text-center">
              <span className="text-[12px] text-[var(--color-text-secondary)] font-medium">{a}</span>
            </div>
          ))}
        </div>

        {/* ── NEARBY ── */}
        <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 px-1">
          Nei dintorni
        </p>
        <div className="bg-[var(--color-surface-secondary)] rounded-2xl divide-y divide-[var(--color-divider)] mb-5">
          {NEARBY.map((p, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-base w-6 text-center">{p.icon}</span>
              <span className="flex-1 text-[13px] font-medium text-[var(--color-text-primary)]">{p.name}</span>
              <span className="text-[12px] text-[var(--color-text-tertiary)]">{p.min} min a piedi</span>
            </div>
          ))}
        </div>

        {/* ── INFO ── */}
        <div className="bg-[var(--color-surface-secondary)] rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-2.5 text-[13px] text-[var(--color-text-secondary)]">
            <MapPin size={15} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{HOTEL.address}</span>
          </div>
        </div>

        <p className="text-[11px] text-[var(--color-text-tertiary)] text-center pb-6">
          Grand Hotel San Marino © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-2 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-divider)]"
        style={{ paddingBottom: "max(8px, var(--sab))" }}
      >
        <a
          href={`tel:${HOTEL.phone}`}
          className="w-full touch-target bg-[var(--color-accent)] text-white rounded-2xl font-bold text-[16px] active:scale-[0.97] transition-transform flex items-center justify-center py-2.5 gap-2"
        >
          <Phone size={16} />
          Reception
        </a>
      </div>
    </div>
  );
}
