"use client";

import { UtensilsCrossed } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { GHSM_VENUES, SERVICE_HOURS, REVIEW_LINKS } from "@/lib/hotel";
import {
  SectionHeader,
  SectionLabel,
  HoursTable,
  StatusBadge,
  CardImage,
  CallButton,
  NavigateButton,
  BookButton,
  MenuButton,
  ReviewButtons,
  CtaRow,
} from "@/components/ui";

const VENUE_IMG: Record<string, string> = {
  laTerrazza: "/images/venue-laterrazza.webp",
  caffeTitano: "/images/venue-caffetitano.webp",
  cremeria: "/images/venue-cremeria.webp",
  laLoggia: "/images/venue-laloggia.webp",
};

export function DiningSection({ t }: { t: HotelContent }) {
  const d = t.dining;

  return (
    <div className="flex flex-col gap-8">
      {/* Il titolo di sezione è il nome della tab (come Hotel e Benessere); il nome
          esteso del ristorante vive dentro la sua card, come per gli altri locali. */}
      <SectionHeader title={t.nav.dining} intro={d.intro} />

      {/* ── L'Arengo ── stessa anatomia delle card dei locali GHSM qui sotto e della
          card Mességué: immagine, riga kicker (icona + badge), titolo, testo, azioni.
          id usato dalla card "Ristorante" nella strip Home per atterrare qui
          direttamente (feedback Manuel 2026-08-03). */}
      <section id="venue-arengo" className="space-y-3">
        <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
          <CardImage src="/images/dining.webp" alt={d.arengoLabel} />
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <UtensilsCrossed size={16} strokeWidth={1.875} />
            </span>
            <StatusBadge hours={SERVICE_HOURS.arengo} labels={t.common.status} />
          </div>
          <h4 className="font-display text-xl font-semibold leading-snug text-[var(--color-text)]">
            {d.arengoLabel}
          </h4>
          <div className="mt-2 space-y-3 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
            {d.arengo.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {/* Feedback Manuel 2026-08-03: niente più bottone di chiamata esterna
                qui — l'ospite è già in hotel, il tasto 9 dal telefono in camera è
                il canale giusto (nel testo di d.arengo.reservation qui sotto). */}
            <p className="font-medium text-[var(--color-text)]">{d.arengo.reservation}</p>
          </div>
        </div>

        <HoursTable rows={d.arengo.hours} />
      </section>

      {/* ── GHSM Group venues ── */}
      <section className="space-y-3">
        <SectionLabel>{d.groupLabel}</SectionLabel>
        <p className="px-1 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{d.groupIntro}</p>

        {d.venues.map((v) => {
          const pin = GHSM_VENUES.find((p) => p.id === v.id);
          const reviewLinks = REVIEW_LINKS[v.id];
          return (
            <div key={v.id} id={`venue-${v.id}`} className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
              {VENUE_IMG[v.id] && <CardImage src={VENUE_IMG[v.id]} alt={v.name} />}
              <h4 className="font-display text-xl font-semibold leading-snug text-[var(--color-text)]">{v.name}</h4>
              {pin?.walkMinutes && (
                <p className="mt-0.5 text-[0.8125rem] text-[var(--color-text-muted)]">
                  {pin.walkMinutes} {t.common.minWalk}
                </p>
              )}
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{v.body}</p>
              {pin && (
                <CtaRow className="mt-4">
                  {pin.bookingUrl && <BookButton href={pin.bookingUrl} label={t.common.bookLabel} trackLabel={`prenota-${v.id}`} />}
                  <NavigateButton
                    lat={pin.lat}
                    lon={pin.lon}
                    name={v.name}
                    label={t.common.openInMapsLabel}
                    variant={pin.bookingUrl ? "outline" : "solid"}
                    trackLabel={`mappe-${v.id}`}
                  />
                  {pin.menuUrl && <MenuButton href={pin.menuUrl} label={t.common.menuLabel} trackLabel={`menu-${v.id}`} />}
                  {pin.phoneHref && (
                    <CallButton href={pin.phoneHref} label={t.common.callLabel} variant="outline" trackLabel={`chiama-${v.id}`} />
                  )}
                </CtaRow>
              )}
              {reviewLinks && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  <p className="mb-3 text-[0.8125rem] font-medium text-[var(--color-text)]">{t.common.reviewLabel}</p>
                  <ReviewButtons
                    googleUrl={reviewLinks.googleUrl}
                    tripadvisorUrl={reviewLinks.tripadvisorUrl}
                    googleLabel={t.common.reviewGoogleLabel}
                    tripadvisorLabel={t.common.reviewTripadvisorLabel}
                    trackPrefix={`recensione-${v.id}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
