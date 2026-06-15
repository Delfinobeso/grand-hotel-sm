"use client";

import { UtensilsCrossed, HandPlatter, Shirt, Mountain, Coffee, IceCream2, type LucideIcon } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, GHSM_VENUES, SERVICE_HOURS } from "@/lib/hotel";
import { SectionHeader, SectionLabel, IconBadge, Card, HoursTable, FloorBadge, StatusBadge, CallButton, NavigateButton, ImageBanner } from "@/components/ui";

const VENUE_ICONS: LucideIcon[] = [Mountain, Coffee, IceCream2];

export function DiningSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/dining.webp" alt={t.dining.label} />
      <SectionHeader title={t.dining.label} intro={t.dining.intro} />

      {/* ── RISTORANTE L'ARENGO ── */}
      <section className="flex flex-col gap-2">
        <SectionLabel>{t.dining.arengoLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <IconBadge icon={UtensilsCrossed} size={18} />
            <div className="flex flex-wrap items-center gap-2">
              <FloorBadge>{t.common.floorGround}</FloorBadge>
              <StatusBadge hours={SERVICE_HOURS.arengo} labels={t.common.status} />
            </div>
          </div>
          {t.dining.arengo.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {p}
            </p>
          ))}
          <p className="text-sm font-medium italic text-[var(--color-text)]">{t.dining.arengo.reservation}</p>
          <div className="border-t border-[var(--color-border)] pt-3">
            <CallButton href={HOTEL.phoneHref} label={t.common.bookLabel} />
          </div>
        </Card>
        <HoursTable rows={t.dining.arengo.hours} />
      </section>

      {/* ── ROOM SERVICE & LAVANDERIA ── */}
      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <IconBadge icon={HandPlatter} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.dining.roomServiceLabel}</p>
            </div>
            <StatusBadge hours={SERVICE_HOURS.roomService} labels={t.common.status} />
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.dining.roomService.body}</p>
          <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3 text-sm">
            <span className="font-medium text-[var(--color-text)]">{t.dining.roomService.hours}</span>
            <span className="text-[var(--color-text-muted)]">{t.dining.roomService.supplement}</span>
          </div>
          <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} />
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <IconBadge icon={Shirt} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.dining.laundryLabel}</p>
            </div>
            <StatusBadge hours={SERVICE_HOURS.laundry} labels={t.common.status} />
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.dining.laundry.body}</p>
          <div className="border-t border-[var(--color-border)] pt-3 text-sm font-medium text-[var(--color-text)]">
            {t.dining.laundry.hours}
          </div>
        </Card>
      </section>

      {/* ── GHSM GROUP ── */}
      <section>
        <SectionLabel>{t.dining.groupLabel}</SectionLabel>
        <p className="mb-3 px-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.dining.groupIntro}</p>
        <div className="flex flex-col gap-2">
          {t.dining.venues.map((venue, i) => {
            const place = GHSM_VENUES.find((v) => v.id === venue.id);
            return (
              <Card key={venue.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <IconBadge icon={VENUE_ICONS[i]} size={18} />
                  <div>
                    <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{venue.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{venue.body}</p>
                  </div>
                </div>
                {place && (
                  <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                    <NavigateButton lat={place.lat} lon={place.lon} name={place.name} label={t.common.openInMapsLabel} />
                    {place.phoneHref && <CallButton href={place.phoneHref} label={t.common.callLabel} variant="outline" />}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
