"use client";

import { useState } from "react";
import { Phone, HeartPulse, Lock, Wind, BellOff, Wifi, Tv, PawPrint, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { HotelContent } from "@/lib/content";
import { HOTEL } from "@/lib/hotel";
import { SectionHeader, SectionLabel, AccordionItem, IconBadge, Card, FloorBadge, CallButton, ImageBanner } from "@/components/ui";
import { TRANSITION } from "@/components/ui";

const SERVICE_ICONS = [Phone, HeartPulse, Lock, Wind, BellOff];

const CHANNEL_COLORS = [
  "bg-[#1a73e8] text-white",     // blue
  "bg-[#e37400] text-white",     // orange
  "bg-[#0d904f] text-white",     // green
  "bg-[#c5221f] text-white",     // red
  "bg-[#9334e6] text-white",     // purple
  "bg-[#188038] text-white",     // dark green
  "bg-[#d93025] text-white",     // dark red
  "bg-[#1967d2] text-white",     // royal blue
  "bg-[#f9ab00] text-black",     // yellow
  "bg-[#129eaf] text-white",     // teal
  "bg-[#e52592] text-white",     // pink
  "bg-[#5f6368] text-white",     // grey
];

function channelColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CHANNEL_COLORS[Math.abs(hash) % CHANNEL_COLORS.length];
}

function ChannelLogo({ name }: { name: string }) {
  // Smart abbreviation: extract channel number or meaningful letters
  const num = name.match(/\d+/);
  const abbr = num
    ? num[0]
    : name
        .replace(/Rai\s?|TV\s?|Mediaset|Channel|Sky\s?|Italia\s?|Sport\s?/gi, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 3)
        .toUpperCase();
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${channelColor(name)}`}
    >
      {abbr || name.slice(0, 3).toUpperCase()}
    </span>
  );
}

export function RoomSection({ t }: { t: HotelContent }) {
  const [channelsOpen, setChannelsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/room.webp" alt={t.room.label} />
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
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.room.wifi.body}</p>
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
        <Card>
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            aria-expanded={channelsOpen}
            className="flex w-full items-center gap-3 text-left transition-colors duration-150"
          >
            <IconBadge icon={Tv} size={18} />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.room.tvLabel}</span>
              <span className="block text-sm text-[var(--color-text-secondary)]">{t.room.tvIntro}</span>
            </span>
            <motion.span
              animate={{ rotate: channelsOpen ? 180 : 0 }}
              transition={TRANSITION}
              className="shrink-0 text-[var(--color-text-muted)]"
            >
              <ChevronDown size={18} strokeWidth={1.75} />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {channelsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={TRANSITION}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                  <div className="flex flex-col gap-0">
                    {t.room.channels.map((ch, i) => (
                      <div
                        key={ch.number}
                        className={`flex items-center gap-3 py-2.5 ${i !== 0 ? "border-t border-[var(--color-border)]" : ""}`}
                      >
                        <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded bg-[var(--color-surface-muted)] text-xs font-bold tabular-nums text-[var(--color-text-muted)]">
                          {ch.number}
                        </span>
                        <ChannelLogo name={ch.name} />
                        <span className="text-sm font-medium text-[var(--color-text)]">{ch.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </section>
    </div>
  );
}
