"use client";

import { type ReactNode } from "react";
import {
  ArrowLeft,
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  ConciergeBell,
  HandPlatter,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, SERVICE_HOURS } from "@/lib/hotel";
import { SectionLabel, IconBadge, Card, StatusBadge, CallButton } from "@/components/ui";
import { RoomSection } from "./RoomSection";
import { DiningSection } from "./DiningSection";
import { WellnessSection } from "./WellnessSection";
import { FacilitySection } from "./FacilitySection";

export type ServiceId = "room" | "dining" | "wellness" | "facility";

interface Tile {
  id: ServiceId;
  icon: LucideIcon;
  label: (t: HotelContent) => string;
  hours?: keyof typeof SERVICE_HOURS;
}

const TILES: Tile[] = [
  { id: "room",     icon: BedDouble,       label: (t) => t.room.label },
  { id: "dining",   icon: UtensilsCrossed, label: (t) => t.dining.label,    hours: "arengo" },
  { id: "wellness", icon: Sparkles,        label: (t) => t.wellness.label,  hours: "messegue" },
  { id: "facility", icon: ConciergeBell,   label: (t) => t.facility.label },
];

const SECTIONS: Record<ServiceId, (t: HotelContent) => ReactNode> = {
  room:     (t) => <RoomSection t={t} />,
  dining:   (t) => <DiningSection t={t} />,
  wellness: (t) => <WellnessSection t={t} />,
  facility: (t) => <FacilitySection t={t} />,
};

export function DirectorySection({
  t,
  subView,
  onSubViewChange,
}: {
  t: HotelContent;
  subView: ServiceId | null;
  onSubViewChange: (v: ServiceId | null) => void;
}) {
  if (subView !== null) {
    return (
      <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
        <button
          onClick={() => onSubViewChange(null)}
          className="flex items-center gap-2 self-start rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)] active:scale-95"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          {t.services.backLabel}
        </button>
        {SECTIONS[subView](t)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      {/* ── HEADER ── */}
      <div className="px-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)] lg:text-3xl">
          {t.services.label}
        </h2>
      </div>

      {/* ── TILE GRID ── */}
      <section>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              onClick={() => onSubViewChange(tile.id)}
              className="group flex flex-col items-start gap-4 rounded-2xl bg-[var(--color-surface)] p-4 text-left transition-all duration-200 hover:bg-[var(--color-surface-muted)] active:scale-[0.98] lg:p-5"
            >
              <IconBadge icon={tile.icon} size={20} />
              <div className="flex w-full flex-col gap-1.5">
                <span className="text-base font-semibold leading-tight text-[var(--color-text)] lg:text-lg">
                  {tile.label(t)}
                </span>
                {tile.hours && (
                  <StatusBadge hours={SERVICE_HOURS[tile.hours]} labels={t.common.status} />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── ACCESSO RAPIDO ── */}
      <section>
        <SectionLabel>{t.services.quickLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          {/* Room Service */}
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <IconBadge icon={HandPlatter} size={18} />
                <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">
                  {t.room.roomServiceLabel}
                </p>
              </div>
              <StatusBadge hours={SERVICE_HOURS.roomService} labels={t.common.status} />
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t.room.roomService.body}
            </p>
            <div className="border-t border-[var(--color-border)] pt-3 text-sm">
              <span className="font-medium text-[var(--color-text)]">{t.room.roomService.hours}</span>
              <span className="ml-2 text-[var(--color-text-muted)]">{t.room.roomService.supplement}</span>
            </div>
            <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} />
          </Card>

          {/* Wi-Fi */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Wifi} size={18} />
              <div>
                <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">
                  {t.room.wifiLabel}
                </p>
                <p className="font-mono text-sm text-[var(--color-accent)]">{t.room.wifi.network}</p>
              </div>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t.room.wifi.body}
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
