"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Globe, Utensils, Sparkles, Users, Coffee, ShoppingBag, Castle, Clock, ChevronRight, X, Bed, Ship } from "lucide-react";

const HOTEL = {
  name: "Grand Hotel San Marino",
  stars: 4,
  address: "Viale Antonio Onofri, 31 — 47890 San Marino",
  phone: "+378 0549 992951",
  email: "info@grandhotel.sm",
  web: "https://www.grandhotel.sm",
  booking: "https://book.blastness.com/?id_albergo=11682&dc=3462&language=it&currency=EUR",
  coords: { lat: 43.9367, lng: 12.4465 },
};

const SECTIONS = [
  {
    id: "hotel",
    icon: Bed,
    title: "L'Hotel",
    color: "var(--color-accent)",
    content: `Il Grand Hotel San Marino è un elegante **hotel 4 stelle** situato nel **centro storico** della Repubblica, patrimonio UNESCO dal 2008. Affacciato sulla Valle del Montefeltro, offre un soggiorno all'insegna del relax e della scoperta.

Tutte le attrazioni principali — le Tre Torri, la Basilica del Santo, Palazzo Pubblico — sono raggiungibili **a piedi** in pochi minuti.

**Servizi inclusi:**
• Wi-Fi gratuito in tutte le camere
• TV a schermo piatto, minibar
• Servizio navetta gratuito per la stazione bus
• Parcheggio disponibile`,
  },
  {
    id: "restaurant",
    icon: Utensils,
    title: "Ristorante L'Arengo",
    color: "#c9956b",
    content: `Il **Ristorante L'Arengo** è il punto d'incontro gastronomico del Grand Hotel, aperto anche ai non residenti.

**Cucina:** internazionale e regionale, con menu speciali su richiesta. Perfetto per cene romantiche a lume di candela tra i merli di una torre medievale — un'esperienza unica.

**Capacità:** fino a 120 persone, ideale per eventi privati e banchetti.

**Bar:** L'Arengo Bar Salone per aperitivi e drink con vista.`,
  },
  {
    id: "wellness",
    icon: Sparkles,
    title: "Centro Benessere",
    color: "#7eb8a0",
    content: `Il **Centro Medico Dimagrimento Maurice Mességué**, attivo da oltre 30 anni nel cuore di San Marino, offre percorsi personalizzati di:

• **Dimagrimento** — programmi su misura
• **Salute e benessere** — massaggi con pietre calde, body wrap
• **Bellezza** — trattamenti viso personalizzati
• **Relax** — equilibrio mente-corpo
• **Terrazza con jacuzzi** — vista panoramica sulla valle`,
  },
  {
    id: "meetings",
    icon: Users,
    title: "Sale Meeting",
    color: "#6b9ec9",
    content: `Il Grand Hotel dispone di **5 sale riunioni** attrezzate per eventi business e privati.

A soli **30 minuti dall'Aeroporto di Rimini**, è la location ideale per meeting aziendali, conferenze e workshop.

**Sale disponibili:**
• Meeting Sala Camino — atmosfera raccolta ed elegante
• Sale modulari per gruppi da 10 a 120 persone
• Attrezzatura audio/video disponibile su richiesta`,
  },
  {
    id: "outlets",
    icon: ShoppingBag,
    title: "Punti Ristoro & Outlet",
    color: "#b8946e",
    content: `Nel centro storico, a pochi passi dall'hotel:

☕ **Caffè Titano** — nel cuore del centro storico, affacciato su una splendida piazzetta medievale. L'angolo perfetto per una pausa caffè in uno dei luoghi più remoti del borgo antico.

🍦 **Gelateria Artigianale** — sapori autentici e semplici trasformati in gelati artigianali di alta qualità.

🧀 **Bottega Locale** — salumi, formaggi, vini e vermouth locali. I sapori autentici di San Marino e della Romagna.`,
  },
  {
    id: "attractions",
    icon: Castle,
    title: "Cosa Visitare",
    color: "#9b7eb8",
    content: `San Marino è un museo a cielo aperto. A pochi minuti a piedi dall'hotel:

🏰 **Le Tre Torri** — simbolo della Repubblica (Guaita, Cesta, Montale)
⛪ **Basilica del Santo** — reliquie di San Marino
🏛️ **Palazzo Pubblico** — sede del governo, Piazza della Libertà
🖼️ **Museo di Stato** — storia e arte sammarinese
🏰 **Monastero di Santa Chiara**
🚶 **Contrada Ombrelli** e **Piazzetta del Titano**

🚴 **Bike tours** — i nove castelli ricchi di storia, pedalando tra borghi medievali e panorami mozzafiato.`,
  },
];

export default function Home() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--color-surface)]" style={{ paddingTop: "calc(var(--sat) + 4px)" }}>
      {/* ── Header ── */}
      <header className="shrink-0 px-5 pt-1 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight">
              Grand Hotel
            </h1>
            <p className="text-[14px] font-semibold text-[var(--color-accent)]">San Marino</p>
            <div className="flex items-center gap-1.5 mt-1">
              {Array.from({ length: HOTEL.stars }).map((_, i) => (
                <span key={i} className="text-[var(--color-accent)] text-[11px]">★</span>
              ))}
              <span className="text-[11px] text-[var(--color-text-tertiary)] ml-1">Centro storico UNESCO</span>
            </div>
          </div>
          <a
            href={HOTEL.booking}
            target="_blank"
            rel="noopener"
            className="touch-target bg-[var(--color-accent)] text-[#1b1b1b] font-bold px-4 py-2.5 rounded-xl text-[14px] active:scale-95 transition-transform"
          >
            Prenota
          </a>
        </div>
      </header>

      {/* ── Hero Image Placeholder ── */}
      <div className="shrink-0 mx-4 mb-4 rounded-2xl overflow-hidden bg-[var(--color-surface-secondary)] h-[180px] flex items-center justify-center">
        <div className="text-center">
          <Ship size={40} className="text-[var(--color-accent)]/30 mx-auto mb-2" />
          <p className="text-[var(--color-text-tertiary)] text-[12px]">Grand Hotel San Marino</p>
          <p className="text-[var(--color-accent)]/40 text-[10px] mt-1">Affacciato sulla Valle del Montefeltro</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="shrink-0 px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 gpu-scroll">
          {[
            { label: "Chiama", icon: Phone, href: `tel:${HOTEL.phone}` },
            { label: "Mappe", icon: MapPin, href: `https://maps.google.com/?q=${HOTEL.coords.lat},${HOTEL.coords.lng}` },
            { label: "Sito", icon: Globe, href: HOTEL.web },
            { label: "Prenota", icon: Bed, href: HOTEL.booking },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 bg-[var(--color-surface-secondary)] rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)] active:scale-95 transition-transform shrink-0"
            >
              <action.icon size={15} className="text-[var(--color-accent)]" />
              {action.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="flex-1 overflow-y-auto gpu-scroll px-4" style={{ paddingBottom: "calc(80px + var(--sab))" }}>
        <div className="flex flex-col gap-2 pb-4">
          <AnimatePresence initial={false}>
            {SECTIONS.map((section) => {
              const isOpen = expanded === section.id;
              return (
                <motion.div
                  key={section.id}
                  layout
                  className="bg-[var(--color-surface-secondary)] rounded-2xl overflow-hidden"
                  transition={{ type: "tween", duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <button
                    onClick={() => toggle(section.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: section.color + "18" }}
                    >
                      <section.icon size={16} style={{ color: section.color }} />
                    </div>
                    <span className="flex-1 text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {section.title}
                    </span>
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
                        <div
                          className="px-4 pb-4 text-[13px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: section.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[var(--color-text-primary)]'>$1</strong>")
                              .replace(/• /g, "<span class='text-[var(--color-accent)]'>•</span> "),
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── Info Box ── */}
          <div className="bg-[var(--color-surface-secondary)] rounded-2xl p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-[var(--color-text-tertiary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Info & Contatti</span>
            </div>
            <div className="space-y-2.5 text-[13px] text-[var(--color-text-secondary)]">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                <span>{HOTEL.address}</span>
              </div>
              <a href={`tel:${HOTEL.phone}`} className="flex items-center gap-2 text-[var(--color-accent)] font-medium">
                <Phone size={14} />
                {HOTEL.phone}
              </a>
              <a href={`mailto:${HOTEL.email}`} className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Globe size={14} className="text-[var(--color-accent)]" />
                {HOTEL.email}
              </a>
            </div>
          </div>

          {/* ── Footer ── */}
          <p className="text-[11px] text-[var(--color-text-tertiary)] text-center py-4">
            Grand Hotel San Marino © {new Date().getFullYear()} — Repubblica di San Marino
          </p>
        </div>
      </div>

      {/* ── Bottom Booking Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-2 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-divider)]"
        style={{ paddingBottom: "max(8px, var(--sab))" }}
      >
        <a
          href={HOTEL.booking}
          target="_blank"
          rel="noopener"
          className="w-full touch-target bg-[var(--color-accent)] text-[#1b1b1b] rounded-2xl font-bold text-[16px] active:scale-[0.97] transition-transform flex items-center justify-center py-2.5"
        >
          Prenota il tuo soggiorno
        </a>
      </div>

      {/* ── Fullscreen Sheet ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setExpanded(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
