"use client";

import type { HotelContent } from "@/lib/content";
import { DiningSection } from "@/components/sections/DiningSection";
import { WellnessSection } from "@/components/sections/WellnessSection";

export function EsperienzeSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-12">
      <DiningSection t={t} />
      <WellnessSection t={t} />
    </div>
  );
}
