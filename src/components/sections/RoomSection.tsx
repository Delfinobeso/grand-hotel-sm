"use client";

import { Phone, HeartPulse, Lock, Wind, BellOff, Wifi, Tv, PawPrint } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL } from "@/lib/hotel";
import { SectionHeader, SectionLabel, AccordionItem, IconBadge, Card, ChipGrid, FloorBadge, CallButton } from "@/components/ui";

const SERVICE_ICONS = [Phone, HeartPulse, Lock, Wind, BellOff];

export function RoomSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <SectionHeader title={t.room.label} intro={t.room.intro} />

      {/* ── SERVIZI IN CAMERA ── */}
      <section>
        <SectionLabel>{t.room.servicesLabel}</SectionLabel>
        <div className="flex flex-col gap-2">
          {t.room.services.map((service, i) => (
            <AccordionItem
              key={service.title}
              icon={SERVICE_ICONS[i]}
              title={service.title}
              subtitle={service.subtitle}
              badge={
                i === 0 ? (
                  <FloorBadge>{t.common.floorGround}</FloorBadge>
                ) : i === 1 ? (
                  <FloorBadge>{t.common.floorThirdMessegue}</FloorBadge>
                ) : undefined
              }
            >
              <p>{service.body}</p>
            </AccordionItem>
          ))}
        </div>
      </section>

      {/* ── WI-FI & ANIMALI ── */}
      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={Wifi} size={18} />
            <div>
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.room.wifiLabel}</p>
              <p className="font-mono text-sm text-[var(--color-accent)]">{t.room.wifi.network}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.room.wifi.body}</p>
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={PawPrint} size={18} />
            <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.room.petsLabel}</p>
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.room.pets.body}</p>
          <div>
            <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} variant="outline" />
          </div>
        </Card>
      </section>

      {/* ── CANALI TV ── */}
      <section>
        <SectionLabel>{t.room.tvLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={Tv} size={18} />
            <p className="text-sm text-[var(--color-text-secondary)]">{t.room.tvIntro}</p>
          </div>
          <ChipGrid items={t.room.channels} />
        </Card>
      </section>
    </div>
  );
}
