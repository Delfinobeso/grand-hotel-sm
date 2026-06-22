"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import { Navigation, Footprints, ChevronRight } from "lucide-react";
import { HOTEL, GHSM_VENUES, POINTS_OF_INTEREST } from "@/lib/hotel";
import type { HotelContent } from "@/lib/content";
import { mapsUrl } from "@/components/ui";

type LatLng = [number, number];

interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  walk: number;
  desc: string;
  kind: "venue" | "poi";
}

function buildPlaces(t: HotelContent): Place[] {
  const venueDesc: Record<string, string> = {
    titanoSuites: t.about.group.titanoSuites.body,
    ...Object.fromEntries(t.dining.venues.map((v) => [v.id, v.body])),
  };
  const poiDesc: Record<string, string> = Object.fromEntries(t.info.pois.map((p) => [p.id, p.body]));

  const pois: Place[] = POINTS_OF_INTEREST.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lon: p.lon,
    walk: p.walkMinutes,
    desc: poiDesc[p.id] ?? "",
    kind: "poi",
  }));
  const venues: Place[] = GHSM_VENUES.map((v) => ({
    id: v.id,
    name: v.name,
    lat: v.lat,
    lon: v.lon,
    walk: v.walkMinutes ?? 5,
    desc: venueDesc[v.id] ?? "",
    kind: "venue",
  }));
  // POIs first (the sightseeing focus), then group venues.
  return [...pois, ...venues];
}

const hotelIcon = L.divIcon({
  className: "",
  html: `<div class="ghsm-hotel-pin"><span class="ghsm-hotel-pulse"></span><span class="ghsm-hotel-dot"></span></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function placeIcon(active: boolean, kind: Place["kind"]): L.DivIcon {
  const color = kind === "venue" ? "#b88746" : "#0a2444";
  const size = active ? 22 : 14;
  const inner = active
    ? `<span class="ghsm-place-pin-active" style="--pin:${color}"></span>`
    : `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`;
  return L.divIcon({ className: "", html: inner, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

const BOUNDS: L.LatLngBoundsExpression = [
  [43.931, 12.442],
  [43.942, 12.456],
];

/** Leaflet renders blank if its container had no size at init; fix size after mount. */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const id = setTimeout(fix, 250);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

/** Drives camera + walking route whenever the active place changes. */
function MapDriver({ active, onRoute }: { active: Place; onRoute: (r: LatLng[]) => void }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([active.lat, active.lon], 17, { duration: 0.9, easeLinearity: 0.22 });

    const ctrl = new AbortController();
    const straight: LatLng[] = [
      [HOTEL.lat, HOTEL.lon],
      [active.lat, active.lon],
    ];
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${HOTEL.lon},${HOTEL.lat};${active.lon},${active.lat}?overview=full&geometries=geojson`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const coords = d?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        if (coords?.length) onRoute(coords.map(([lon, lat]) => [lat, lon] as LatLng));
        else onRoute(straight);
      })
      .catch(() => onRoute(straight));

    return () => ctrl.abort();
  }, [active, map, onRoute]);

  return null;
}

export default function MapExplorer({ t }: { t: HotelContent }) {
  const places = useMemo(() => buildPlaces(t), [t]);
  const [active, setActive] = useState(0);
  const [route, setRoute] = useState<LatLng[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const rafId = useRef<number>(0);

  const onRoute = useCallback((r: LatLng[]) => setRoute(r), []);

  // Scroll the carousel to a card (used when a marker is tapped).
  const scrollToCard = useCallback((i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (!card) return;
    programmatic.current = true;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    window.setTimeout(() => (programmatic.current = false), 600);
  }, []);

  // Detect the centered card on user scroll → set active.
  const onScroll = useCallback(() => {
    if (programmatic.current) return;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const c = el.children[i] as HTMLElement;
        const cc = c.offsetLeft - el.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setActive((prev) => (prev === best ? prev : best));
    });
  }, []);

  const selectFromMarker = useCallback(
    (i: number) => {
      setActive(i);
      scrollToCard(i);
    },
    [scrollToCard],
  );

  const activePlace = places[active];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={[HOTEL.lat, HOTEL.lon]}
        zoom={16}
        maxBounds={BOUNDS}
        scrollWheelZoom={false}
        zoomControl={false}
        className="absolute inset-0 h-full w-full"
        zoomSnap={0.25}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSize />
        <MapDriver active={activePlace} onRoute={onRoute} />

        {/* Walking route */}
        {route.length > 1 && (
          <Polyline
            key={activePlace.id}
            positions={route}
            pathOptions={{ color: "#0a2444", weight: 4, opacity: 0.9, lineCap: "round", className: "ghsm-walk-route" }}
          />
        )}

        {/* Hotel (origin) */}
        <Marker position={[HOTEL.lat, HOTEL.lon]} icon={hotelIcon} zIndexOffset={1200}>
          <Tooltip permanent direction="top" offset={[0, -14]} className="ghsm-label ghsm-label-hotel">
            {t.common.youAreHere}
          </Tooltip>
        </Marker>

        {/* Places */}
        {places.map((p, i) => {
          const isActive = i === active;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lon]}
              icon={placeIcon(isActive, p.kind)}
              zIndexOffset={isActive ? 1000 : 0}
              eventHandlers={{ click: () => selectFromMarker(i) }}
            >
              {isActive && (
                <Tooltip key={`${p.id}-on`} permanent direction="top" offset={[0, -16]} className="ghsm-label ghsm-label-active">
                  {p.name}
                </Tooltip>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* Bottom banners */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="ghsm-carousel absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[1000] flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 lg:bottom-4"
      >
        {places.map((p, i) => {
          const isActive = i === active;
          return (
            <article
              key={p.id}
              className={`ghsm-card snap-center shrink-0 rounded-3xl border bg-[var(--color-surface)]/95 p-4 shadow-[0_10px_30px_oklch(0.2_0.04_258/0.25)] backdrop-blur-xl transition-[border-color,transform] duration-300 ${
                isActive ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
              }`}
              style={{ width: "min(82vw, 22rem)", willChange: "transform" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
                  style={{
                    color: p.kind === "venue" ? "#9a6f33" : "var(--color-accent)",
                    background: p.kind === "venue" ? "oklch(0.72 0.09 75 / 0.16)" : "var(--color-accent-soft)",
                  }}
                >
                  {p.kind === "venue" ? "GHSM Group" : t.info.poiLabel}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[0.8rem] font-medium text-[var(--color-text-muted)]">
                  <Footprints size={14} strokeWidth={2} />
                  {p.walk} {t.common.minWalk}
                </span>
              </div>
              <h3 className="mt-2 font-display text-[1.15rem] font-semibold leading-snug text-[var(--color-text)]">
                {p.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-[0.85rem] leading-relaxed text-[var(--color-text-secondary)]">
                {p.desc}
              </p>
              <a
                href={mapsUrl(p.lat, p.lon, p.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 text-[0.85rem] font-semibold text-[var(--color-on-accent)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.97]"
              >
                <Navigation size={15} strokeWidth={2} />
                {t.common.navigateLabel}
                <ChevronRight size={15} strokeWidth={2.25} className="-mr-1 opacity-70" />
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
