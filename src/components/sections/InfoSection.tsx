"use client";

import {
  SquareParking,
  ParkingMeter,
  CarTaxiFront,
  AlarmClock,
  TicketPercent,
  Scissors,
  Plane,
  Users,
  Building2,
  CalendarDays,
  MapPin,
  Phone,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL } from "@/lib/hotel";
import { SectionHeader, SectionLabel, IconBadge, Card, ChipGrid, HoursTable } from "@/components/ui";

export function InfoSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <SectionHeader title={t.info.label} intro={t.info.intro} />

      {/* ── PARCHEGGIO ── */}
      <section>
        <SectionLabel>{t.info.parkingLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={SquareParking} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.garage.title}</p>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t.info.garage.body.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
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

      {/* ── CONCIERGE ── */}
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

      {/* ── AEROPORTI ── */}
      <section>
        <SectionLabel>{t.info.airportsLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={Plane} size={18} />
            <ChipGrid items={t.info.airports.list} />
          </div>
          <p className="border-t border-[var(--color-border)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t.info.airports.note}
          </p>
        </Card>
      </section>

      {/* ── MEETING & EVENTI ── */}
      <section>
        <SectionLabel>{t.info.meetingsLabel}</SectionLabel>
        <Card className="flex items-start gap-3">
          <IconBadge icon={Users} size={18} />
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.meetings.body}</p>
        </Card>
      </section>

      {/* ── GHSM GROUP ── */}
      <section>
        <SectionLabel>{t.info.groupLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.group.intro}</p>
          <div className="flex items-start gap-3 border-t border-[var(--color-border)] pt-3">
            <IconBadge icon={Building2} size={18} />
            <div>
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.info.group.titanoSuites.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.info.group.titanoSuites.body}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* ── EVENTI A SAN MARINO ── */}
      <section>
        <SectionLabel>
          <span className="flex items-center gap-2">
            <CalendarDays size={14} strokeWidth={1.75} />
            {t.info.eventsLabel}
          </span>
        </SectionLabel>
        <HoursTable rows={t.info.events.map((e) => ({ label: e.name, value: e.date }))} />
      </section>

      {/* ── INDIRIZZO E CONTATTI ── */}
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
          <a
            href={HOTEL.phoneHref}
            className="flex items-center gap-3 border-t border-[var(--color-border)] pt-3 transition-colors duration-150 hover:text-[var(--color-accent)]"
          >
            <IconBadge icon={Phone} size={18} />
            <span className="text-sm font-medium text-[var(--color-text)]">{HOTEL.phone}</span>
          </a>
        </Card>
      </section>
    </div>
  );
}
