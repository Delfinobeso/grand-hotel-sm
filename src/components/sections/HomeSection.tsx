"use client";

import { Clock, Wifi, Phone, Coffee } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { SectionLabel, HoursTable, ImageBanner } from "@/components/ui";
import { HOTEL } from "@/lib/hotel";

const HIGHLIGHT_ICONS = [Wifi, Phone, Coffee];

export function HomeSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/home.webp" alt={t.home.welcomeTitle} />
      {/* ── STAY CARD ── */}
      <section className="rounded-3xl bg-[var(--color-accent)] px-5 py-5 text-[var(--color-on-accent)] lg:px-6 lg:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{t.home.stayLabel}</p>
        <h1 className="mt-2 text-xl font-bold leading-snug lg:text-2xl">{t.home.welcomeTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed opacity-90 lg:text-base">{t.home.welcomeBody}</p>
        <div className="mt-4 flex flex-col gap-2 border-t border-white/15 pt-4 text-sm opacity-90 sm:flex-row sm:items-center sm:gap-6">
          <span className="flex items-center gap-2">
            <Clock size={16} strokeWidth={1.75} />
            {t.home.checkIn.label}: {t.home.checkIn.value}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={16} strokeWidth={1.75} />
            {t.home.checkOut.label}: {t.home.checkOut.value}
          </span>
        </div>
      </section>

      {/* ── AZIONI RAPIDE ── */}
      <section>
        <SectionLabel>{t.home.highlightsLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {t.home.highlights.map((highlight, i) => (
            <div key={highlight.title} className="group flex flex-col gap-3 rounded-2xl bg-[var(--color-surface)] p-4 transition-all duration-200 hover:bg-[var(--color-surface-muted)] lg:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] lg:h-12 lg:w-12">
                  {(() => {
                    const Icon = HIGHLIGHT_ICONS[i];
                    return <Icon size={20} strokeWidth={1.75} />;
                  })()}
                </span>
                <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{highlight.title}</p>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{highlight.body}</p>
              {i === 1 && (
                <a
                  href={HOTEL.phoneHref}
                  className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-on-accent)] transition-[transform,opacity] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
                >
                  <Phone size={16} strokeWidth={1.75} />
                  {t.common.receptionCta}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── ORARI DEI SERVIZI ── */}
      <section>
        <SectionLabel>{t.home.hoursLabel}</SectionLabel>
        <HoursTable rows={t.home.hours} />
      </section>
    </div>
  );
}
