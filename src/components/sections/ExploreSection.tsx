"use client";

import dynamic from "next/dynamic";
import {
  MapPin,
  Plane,
  Bus,
  CarFront,
  Footprints,
  CalendarDays,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, POINTS_OF_INTEREST, AIRPORTS } from "@/lib/hotel";
import {
  SectionHeader,
  SectionLabel,
  NavigateButton,
  CallButton,
  AddToCalendarButton,
} from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--color-surface-muted)]" />,
});

const REACH_ICONS: Record<string, LucideIcon> = { transit: Bus, taxi: CarFront, walk: Footprints };

export function ExploreSection({ t }: { t: HotelContent }) {
  const info = t.info;
  const about = t.about;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title={t.nav.explore} intro={info.intro} />

      {/* ── Map ── */}
      <section className="space-y-3">
        <div className="h-72 overflow-hidden rounded-2xl bg-[var(--color-surface-muted)] lg:h-80">
          <MapView t={t} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[0.8125rem] text-[var(--color-text-secondary)]">
          <Legend color="#0a2444" label={HOTEL.name} />
          <Legend color="#b88746" label={about.groupLabel} />
          <Legend color="#6b7385" label={info.poiLabel} square />
        </div>
      </section>

      {/* ── Must-see ── */}
      <section className="space-y-2">
        <SectionLabel>{info.poiLabel}</SectionLabel>
        {info.pois.map((p) => {
          const pin = POINTS_OF_INTEREST.find((x) => x.id === p.id);
          return (
            <div key={p.id} className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold text-[var(--color-text)]">{p.name}</h4>
                {pin && (
                  <span className="shrink-0 text-[0.8125rem] text-[var(--color-text-muted)]">
                    {pin.walkMinutes} {t.common.minWalk}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{p.body}</p>
              {pin && (
                <div className="mt-3">
                  <NavigateButton
                    lat={pin.lat}
                    lon={pin.lon}
                    name={p.name}
                    label={t.common.navigateLabel}
                    variant="outline"
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Getting around ── */}
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

        {/* Airports */}
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
                <span className="flex items-center gap-3">
                  <span className="text-[0.8125rem] tabular-nums text-[var(--color-text-secondary)]">
                    {a.distanceKm} km
                  </span>
                  <a
                    href={`https://maps.apple.com/?ll=${a.lat},${a.lon}&q=${encodeURIComponent(a.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t.common.navigateLabel} ${a.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-accent)] transition-colors hover:bg-[var(--color-border)]"
                  >
                    <MapPin size={15} strokeWidth={2} />
                  </a>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{info.airports.note}</p>
        </div>
      </section>

      {/* ── Events ── */}
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

      {/* ── Group + contacts ── */}
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
  );
}

function Legend({ color, label, square = false }: { color: string; label: string; square?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 border border-white shadow-sm"
        style={{ background: color, borderRadius: square ? "2px" : "9999px" }}
      />
      {label}
    </span>
  );
}
