"use client";

import {
  SquareParking,
  ParkingMeter,
  CarTaxiFront,
  AlarmClock,
  TicketPercent,
  Scissors,
  Users,
  Dumbbell,
  Bike,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, SERVICE_HOURS } from "@/lib/hotel";
import { SectionHeader, SectionLabel, IconBadge, Card, FloorBadge, StatusBadge, CallButton, ImageBanner } from "@/components/ui";

export function FacilitySection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/meeting.webp" alt={t.facility.label} />
      <SectionHeader title={t.facility.label} intro={t.facility.intro} />

      {/* ── PARCHEGGIO ── */}
      <section>
        <SectionLabel>{t.facility.parkingLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <IconBadge icon={SquareParking} size={18} />
                <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.garage.title}</p>
              </div>
              <StatusBadge hours={SERVICE_HOURS.valet} labels={t.common.status} />
            </div>
            <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t.facility.garage.body.map((line, i) => (
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
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.publicParking.title}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.publicParking.body}</p>
          </Card>
        </div>
      </section>

      {/* ── CONCIERGE ── */}
      <section>
        <SectionLabel>{t.facility.conciergeLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={CarTaxiFront} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.taxiLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.taxi.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={AlarmClock} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.wakeUpLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.wakeUp.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={TicketPercent} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.cardLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.card.body}</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Scissors} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.hairdresserLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.hairdresser.body}</p>
          </Card>
        </div>
      </section>

      {/* ── SALE MEETING ── */}
      <section>
        <SectionLabel>{t.facility.meetingsLabel}</SectionLabel>
        <Card className="flex items-start gap-3">
          <IconBadge icon={Users} size={18} />
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.meetings.body}</p>
        </Card>
      </section>

      {/* ── PALESTRA & BICI ── */}
      <section>
        <SectionLabel>{t.facility.gymBikeLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <IconBadge icon={Dumbbell} size={18} />
                <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.gymLabel}</p>
              </div>
              <StatusBadge hours={SERVICE_HOURS.gym} labels={t.common.status} />
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.gym.body}</p>
            <FloorBadge>{t.common.floorThirdMessegue}</FloorBadge>
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Bike} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.facility.bikeLabel}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.facility.bike.body}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
