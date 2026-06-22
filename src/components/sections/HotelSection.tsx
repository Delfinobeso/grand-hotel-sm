"use client";

import {
  Wifi,
  Tv,
  Phone,
  Sparkles,
  Lock,
  Wind,
  BedDouble,
  PawPrint,
  BellRing,
  Shirt,
  Car,
  CarFront,
  Clock,
  Scissors,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { HotelContent } from "@/lib/content";
import { HOTEL } from "@/lib/hotel";
import {
  SectionHeader,
  SectionLabel,
  AccordionItem,
  CopyField,
  CallButton,
  FloorBadge,
} from "@/components/ui";

const COMFORT_ICONS: LucideIcon[] = [Phone, Sparkles, Lock, Wind, BedDouble];

function ChannelGrid({ channels, intro }: { channels: HotelContent["room"]["channels"]; intro: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{intro}</p>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {channels.map((c) => (
          <li
            key={c.number}
            className="flex items-center gap-2.5 rounded-xl bg-[var(--color-surface-muted)] px-2.5 py-2"
          >
            <span className="w-7 shrink-0 text-center text-[0.8125rem] font-semibold tabular-nums text-[var(--color-accent)]">
              {c.number}
            </span>
            <ChannelLogo src={c.logo} />
            <span className="min-w-0 truncate text-[0.8125rem] font-medium text-[var(--color-text)]">
              {c.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChannelLogo({ src }: { src: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setOk(false)}
      className="h-5 w-7 shrink-0 object-contain"
      style={{ filter: "var(--channel-logo-filter, none)" }}
    />
  );
}

export function HotelSection({ t }: { t: HotelContent }) {
  const r = t.room;
  const f = t.facility;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title={t.nav.hotel} intro={r.intro} />

      {/* ── La tua camera ── */}
      <section className="space-y-2">
        <SectionLabel>{r.servicesLabel}</SectionLabel>

        <AccordionItem icon={Wifi} title={r.wifiLabel} subtitle={r.wifi.network}>
          <CopyField value={r.wifi.network} copiedLabel={t.home.quick.wifi.copyDone} />
          <p className="mt-2 whitespace-pre-line">{r.wifi.body}</p>
        </AccordionItem>

        <AccordionItem icon={Tv} title={r.tvLabel} subtitle={`37 · 1 – 831`}>
          <ChannelGrid channels={r.channels} intro={r.tvIntro} />
        </AccordionItem>

        {r.services.map((s, i) => (
          <AccordionItem
            key={s.title}
            icon={COMFORT_ICONS[i] ?? Phone}
            title={s.title}
            subtitle={s.subtitle}
          >
            <p>{s.body}</p>
          </AccordionItem>
        ))}

        <AccordionItem icon={PawPrint} title={r.petsLabel} subtitle="+ €4,00">
          <p>{r.pets.body}</p>
        </AccordionItem>
      </section>

      {/* ── Servizi pratici ── */}
      <section className="space-y-2">
        <SectionLabel>{f.label}</SectionLabel>

        <AccordionItem icon={BellRing} title={r.roomServiceLabel} subtitle={r.roomService.hours}>
          <p>{r.roomService.body}</p>
          <p className="mt-1 font-medium text-[var(--color-text)]">{r.roomService.supplement}</p>
        </AccordionItem>

        <AccordionItem icon={Shirt} title={r.laundryLabel} subtitle={r.laundry.hours}>
          <p>{r.laundry.body}</p>
        </AccordionItem>

        <AccordionItem icon={Car} title={f.parkingLabel} badge={<FloorBadge>{t.common.floorBasement}</FloorBadge>}>
          <p className="font-medium text-[var(--color-text)]">{f.garage.title}</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {f.garage.body.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <div className="mt-3">
            <CallButton href={HOTEL.phoneHref} label={t.common.callValetLabel} variant="outline" />
          </div>
          <p className="mt-4 font-medium text-[var(--color-text)]">{f.publicParking.title}</p>
          <p className="mt-1">{f.publicParking.body}</p>
        </AccordionItem>

        <AccordionItem icon={CarFront} title={f.taxiLabel}>
          <p className="mb-3">{f.taxi.body}</p>
          <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} variant="outline" />
        </AccordionItem>

        <AccordionItem icon={Clock} title={f.wakeUpLabel}>
          <p>{f.wakeUp.body}</p>
        </AccordionItem>

        <AccordionItem icon={Scissors} title={f.hairdresserLabel}>
          <p>{f.hairdresser.body}</p>
        </AccordionItem>

        <AccordionItem icon={Presentation} title={f.meetingsLabel}>
          <p className="mb-3">{f.meetings.body}</p>
          <CallButton href={HOTEL.phoneHref} label={t.common.callLabel} variant="outline" />
        </AccordionItem>
      </section>
    </div>
  );
}
