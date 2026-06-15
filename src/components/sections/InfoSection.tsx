"use client";

import dynamic from "next/dynamic";
import {
  MapPin,
  Plane,
  Bus,
  CarTaxiFront,
  Footprints,
  Landmark,
  Church,
  Building2,
  Castle,
  CableCar,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { GHSM_VENUES, AIRPORTS, POINTS_OF_INTEREST } from "@/lib/hotel";
import { SectionHeader, SectionLabel, IconBadge, Card, NavigateButton, ImageBanner } from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse rounded-2xl bg-[var(--color-surface-muted)] lg:h-[480px]" />,
});

const POI_ICONS: LucideIcon[] = [Landmark, Church, Building2, Castle, Castle, CableCar];

export function InfoSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/info.webp" alt={t.info.label} />
      <SectionHeader title={t.info.label} intro={t.info.intro} />

      {/* ══════ MAPPA ══════ */}
      <section>
        <div className="h-[400px] overflow-hidden rounded-2xl lg:h-[480px]">
          <MapView t={t} />
        </div>
      </section>

      {/* ══════ INDIRIZZI GHSM ══════ */}
      <section>
        <SectionLabel>{t.info.ghsmLabel}</SectionLabel>
        <Card className="flex flex-col gap-1">
          {GHSM_VENUES.map((venue, i) => (
            <div
              key={venue.id}
              className={`flex items-center justify-between gap-3 py-2.5 ${i !== 0 ? "border-t border-[var(--color-border)]" : ""}`}
            >
              <div className="flex items-center gap-3">
                <MapPin size={16} strokeWidth={1.75} className="shrink-0 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{venue.name}</p>
                  {venue.walkMinutes && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {venue.walkMinutes} {t.common.minWalk}
                    </p>
                  )}
                </div>
              </div>
              <NavigateButton lat={venue.lat} lon={venue.lon} name={venue.name} label={t.common.navigateLabel} variant="outline" />
            </div>
          ))}
        </Card>
      </section>

      {/* ══════ DA NON PERDERE ══════ */}
      <section>
        <SectionLabel>{t.info.poiLabel}</SectionLabel>
        <div className="flex flex-col gap-2">
          {t.info.pois.map((poi, i) => {
            const place = POINTS_OF_INTEREST.find((p) => p.id === poi.id);
            if (!place) return null;
            return (
              <Card key={poi.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <IconBadge icon={POI_ICONS[i]} size={18} />
                    <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{poi.name}</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {place.walkMinutes} {t.common.minWalk}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{poi.body}</p>
                <div className="border-t border-[var(--color-border)] pt-3">
                  <NavigateButton lat={place.lat} lon={place.lon} name={place.name} label={t.common.openInMapsLabel} variant="outline" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ══════ AEROPORTI ══════ */}
      <section>
        <SectionLabel>{t.info.airportsLabel}</SectionLabel>
        <Card className="flex flex-col gap-1">
          {AIRPORTS.map((airport, i) => (
            <div
              key={airport.id}
              className={`flex items-center justify-between gap-3 py-2.5 ${i !== 0 ? "border-t border-[var(--color-border)]" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Plane size={16} strokeWidth={1.75} className="shrink-0 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {t.info.airports.list[i]} <span className="text-[var(--color-text-muted)]">({airport.code})</span>
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{airport.distanceKm} km</p>
                </div>
              </div>
              <NavigateButton lat={airport.lat} lon={airport.lon} name={airport.name} label={t.common.navigateLabel} variant="outline" />
            </div>
          ))}
          <p className="border-t border-[var(--color-border)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t.info.airports.note}
          </p>
        </Card>
      </section>

      {/* ══════ COME MUOVERSI ══════ */}
      <section>
        <SectionLabel>{t.info.reachLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Bus} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.reach.transit.title}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.reach.transit.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={CarTaxiFront} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.reach.taxi.title}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.reach.taxi.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Footprints} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.reach.walk.title}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.reach.walk.body}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
