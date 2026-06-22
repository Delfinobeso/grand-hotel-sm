"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Bus,
  CarFront,
  Footprints,
  CalendarDays,
  Building2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, AIRPORTS } from "@/lib/hotel";
import { SectionLabel, NavigateButton, CallButton, AddToCalendarButton, EASE_EXPO } from "@/components/ui";

const MapExplorer = dynamic(() => import("@/components/MapExplorer"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--color-surface-muted)]" />,
});

const REACH_ICONS: Record<string, LucideIcon> = { transit: Bus, taxi: CarFront, walk: Footprints };

export function ExploreSection({ t }: { t: HotelContent }) {
  const info = t.info;
  const about = t.about;
  const [sheet, setSheet] = useState(false);

  return (
    <div className="map-fill relative w-full overflow-hidden">
      {/* Full-screen interactive map + place banners */}
      <MapExplorer t={t} />

      {/* Info / events trigger */}
      <button
        onClick={() => setSheet(true)}
        className="absolute right-3 top-3 z-[1100] inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 text-[0.85rem] font-semibold text-[var(--color-text)] shadow-[0_6px_20px_oklch(0.2_0.04_258/0.2)] backdrop-blur-xl transition-transform duration-200 active:scale-95"
      >
        <Info size={16} strokeWidth={2} />
        {info.sheetLabel}
      </button>

      {/* Bottom sheet: events, getting around, group, contacts */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheet(false)}
              className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: EASE_EXPO }}
              className="fixed inset-x-0 bottom-0 z-[1300] max-h-[85svh] overflow-y-auto rounded-t-3xl bg-[var(--color-bg)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-5 py-3.5 backdrop-blur-md">
                <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">{info.sheetLabel}</h2>
                <button
                  onClick={() => setSheet(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <div className="flex flex-col gap-8 px-5 py-6">
                {/* Events */}
                <section className="space-y-2">
                  <SectionLabel>{about.eventsLabel}</SectionLabel>
                  <div className="rounded-2xl bg-[var(--color-surface)] px-4 lg:px-5">
                    {about.events.map((e, i) => (
                      <div
                        key={e.name}
                        className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 ${
                          i !== 0 ? "border-t border-[var(--color-border)]" : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <CalendarDays size={17} strokeWidth={1.875} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--color-text)]">{e.name}</p>
                            <p className="text-[0.8125rem] text-[var(--color-text-muted)]">{e.date}</p>
                          </div>
                        </div>
                        {e.dates && (
                          <AddToCalendarButton
                            title={e.name}
                            location={`${HOTEL.name}, San Marino`}
                            dates={e.dates}
                            label={t.common.addToCalendarLabel}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Getting around */}
                <section className="space-y-2">
                  <SectionLabel>{info.reachLabel}</SectionLabel>
                  {(["transit", "taxi", "walk"] as const).map((key) => {
                    const Icon = REACH_ICONS[key];
                    const item = info.reach[key];
                    return (
                      <div key={key} className="flex gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                          <Icon size={17} strokeWidth={1.875} />
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">{item.title}</p>
                          <p className="mt-0.5 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{item.body}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
                    <div className="mb-1 flex items-center gap-2">
                      <Plane size={16} strokeWidth={1.875} className="text-[var(--color-accent)]" />
                      <h4 className="font-semibold text-[var(--color-text)]">{info.airportsLabel}</h4>
                    </div>
                    <ul className="divide-y divide-[var(--color-border)]">
                      {AIRPORTS.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-[0.95rem] font-medium text-[var(--color-text)]">
                            {a.name} <span className="text-[var(--color-text-muted)]">{a.code}</span>
                          </span>
                          <span className="text-[0.8125rem] tabular-nums text-[var(--color-text-secondary)]">{a.distanceKm} km</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{info.airports.note}</p>
                  </div>
                </section>

                {/* Group + contacts */}
                <section className="space-y-2">
                  <SectionLabel>{about.groupLabel}</SectionLabel>
                  <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
                    <p className="text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{about.group.intro}</p>
                    <div className="mt-3 flex gap-3 border-t border-[var(--color-border)] pt-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                        <Building2 size={17} strokeWidth={1.875} />
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{about.group.titanoSuites.name}</p>
                        <p className="mt-0.5 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
                          {about.group.titanoSuites.body}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      {about.contactsLabel}
                    </p>
                    <p className="mt-2 font-display text-lg font-semibold text-[var(--color-text)]">{HOTEL.name}</p>
                    <p className="mt-0.5 text-[0.95rem] text-[var(--color-text-secondary)]">
                      {HOTEL.addressLine1}, {HOTEL.addressLine2}
                    </p>
                    <p className="mt-0.5 text-[0.95rem] text-[var(--color-text-secondary)]">{HOTEL.phone}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} />
                      <NavigateButton lat={HOTEL.lat} lon={HOTEL.lon} name={HOTEL.name} label={t.common.openInMapsLabel} />
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
