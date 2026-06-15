"use client";

import { MapPin, Phone, CalendarDays } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, GHSM_VENUES } from "@/lib/hotel";
import { SectionHeader, SectionLabel, IconBadge, Card, CallButton, NavigateButton, AddToCalendarButton, ImageBanner } from "@/components/ui";

export function AboutSection({ t }: { t: HotelContent }) {
  const titanoSuites = GHSM_VENUES.find((v) => v.id === "titanoSuites");

  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/info2.webp" alt={t.about.label} />
      <SectionHeader title={t.about.label} intro={t.about.intro} />

      {/* ── GHSM GROUP ── */}
      <section>
        <SectionLabel>{t.about.groupLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.about.group.intro}</p>
          <div className="flex items-start gap-3 border-t border-[var(--color-border)] pt-3">
            <IconBadge icon={MapPin} size={18} />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{t.about.group.titanoSuites.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{t.about.group.titanoSuites.body}</p>
            </div>
          </div>
          {titanoSuites && (
            <NavigateButton
              lat={titanoSuites.lat}
              lon={titanoSuites.lon}
              name={titanoSuites.name}
              label={t.common.openInMapsLabel}
              variant="outline"
            />
          )}
        </Card>
      </section>

      {/* ── EVENTI ── */}
      <section>
        <SectionLabel>
          <span className="flex items-center gap-2">
            <CalendarDays size={14} strokeWidth={1.75} />
            {t.about.eventsLabel}
          </span>
        </SectionLabel>
        <Card className="flex flex-col gap-1">
          {t.about.events.map((event, i) => (
            <div
              key={event.name}
              className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                i !== 0 ? "border-t border-[var(--color-border)]" : ""
              }`}
            >
              <div>
                <span className="block text-sm font-medium text-[var(--color-text)]">{event.name}</span>
                <span className="block text-sm text-[var(--color-text-secondary)]">{event.date}</span>
              </div>
              {event.dates && (
                <AddToCalendarButton title={event.name} location={HOTEL.name} dates={event.dates} label={t.common.addToCalendarLabel} />
              )}
            </div>
          ))}
        </Card>
      </section>

      {/* ── CONTATTI ── */}
      <section>
        <SectionLabel>{t.about.contactsLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <IconBadge icon={MapPin} size={18} />
            <div className="flex flex-col justify-center pt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <span className="font-medium text-[var(--color-text)]">{HOTEL.name}</span>
              <span>{HOTEL.addressLine1}</span>
              <span>{HOTEL.addressLine2}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
            <IconBadge icon={Phone} size={18} />
            <span className="text-sm font-medium text-[var(--color-text)]">{HOTEL.phone}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} />
            <NavigateButton lat={HOTEL.lat} lon={HOTEL.lon} name={HOTEL.name} label={t.common.navigateLabel} />
          </div>
        </Card>
      </section>
    </div>
  );
}
