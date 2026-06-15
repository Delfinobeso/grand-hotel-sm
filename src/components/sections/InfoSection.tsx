"use client";

import dynamic from "next/dynamic";
import {
  SquareParking,
  ParkingMeter,
  CarTaxiFront,
  AlarmClock,
  TicketPercent,
  Scissors,
  Plane,
  Users,
  CalendarDays,
  MapPin,
  Phone,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, GHSM_VENUES, AIRPORTS, SERVICE_HOURS } from "@/lib/hotel";
import {
  SectionHeader,
  SectionLabel,
  IconBadge,
  Card,
  FloorBadge,
  StatusBadge,
  CallButton,
  NavigateButton,
  AddToCalendarButton,
  ImageBanner,
} from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-[260px] w-full animate-pulse rounded-2xl bg-[var(--color-surface-muted)] lg:h-[340px]" />,
});

export function InfoSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/info.webp" alt={t.info.label} />
      <SectionHeader title={t.info.label} intro={t.info.intro} />

      {/* ══════ MAPPA ══════ */}
      <section>
        <div className="h-[260px] overflow-hidden rounded-2xl lg:h-[340px]">
          <MapView t={t} />
        </div>

        {/* Quick nav: hotel + GHSM venues */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {[{ id: "hotel", name: HOTEL.name, lat: HOTEL.lat, lon: HOTEL.lon }, ...GHSM_VENUES].map((place) => (
            <NavigateButton
              key={place.id}
              lat={place.lat}
              lon={place.lon}
              name={place.name}
              label={place.name}
              variant="outline"
            />
          ))}
        </div>
      </section>

      {/* ══════ PARCHEGGIO ══════ */}
      <section>
        <SectionLabel>{t.info.parkingLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <IconBadge icon={SquareParking} size={18} />
                <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.garage.title}</p>
              </div>
              <StatusBadge hours={SERVICE_HOURS.valet} labels={t.common.status} />
            </div>
            <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t.info.garage.body.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
              <FloorBadge>{t.common.floorBasement}</FloorBadge>
              <CallButton href={HOTEL.phoneHref} label={t.common.callValetLabel} variant="outline" />
            </div>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={ParkingMeter} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.publicParking.title}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.publicParking.body}</p>
          </Card>
        </div>
      </section>

      {/* ══════ CONCIERGE ══════ */}
      <section>
        <SectionLabel>{t.info.conciergeLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={CarTaxiFront} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.taxiLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.taxi.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={AlarmClock} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.wakeUpLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.wakeUp.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={TicketPercent} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.cardLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.card.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Scissors} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.hairdresserLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.hairdresser.body}</p>
          </Card>
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

      {/* ══════ MEETING & GHSM ══════ */}
      <section>
        <SectionLabel>{t.info.meetingsLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <IconBadge icon={Users} size={18} />
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.meetings.body}</p>
            </div>
          </Card>
          <Card className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.group.intro}</p>
            <div className="flex items-start gap-3 border-t border-[var(--color-border)] pt-3">
              <IconBadge icon={MapPin} size={18} />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{t.info.group.titanoSuites.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{t.info.group.titanoSuites.body}</p>
              </div>
            </div>
            {(() => {
              const ts = GHSM_VENUES.find((v) => v.id === "titanoSuites");
              return ts ? (
                <NavigateButton lat={ts.lat} lon={ts.lon} name={ts.name} label={t.common.openInMapsLabel} variant="outline" />
              ) : null;
            })()}
          </Card>
        </div>
      </section>

      {/* ══════ EVENTI ══════ */}
      <section>
        <SectionLabel>
          <span className="flex items-center gap-2">
            <CalendarDays size={14} strokeWidth={1.75} />
            {t.info.eventsLabel}
          </span>
        </SectionLabel>
        <Card className="flex flex-col gap-1">
          {t.info.events.map((event, i) => (
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

      {/* ══════ CONTATTI ══════ */}
      <section>
        <SectionLabel>{t.info.contactsLabel}</SectionLabel>
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
